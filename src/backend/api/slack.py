# backend/api/slack.py
from fastapi import APIRouter, HTTPException, Depends
from database import get_db, UploadedFile as DBUploadedFile
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError
import os
from dotenv import load_dotenv
from urllib.parse import urlparse, parse_qs

load_dotenv(dotenv_path="../.env")

router = APIRouter()

# Slackクライアントの初期化
slack_client = WebClient(token=os.getenv("SLACK_USER_TOKEN"))

class SlackChannel(BaseModel):
    id: str
    name: str

class ProjectSlackLink(BaseModel):
    project_id: int
    slack_channel_id: str

class SlackSearchRequest(BaseModel):
    channel_id: str
    query: str

class SlackThread(BaseModel):
    ts: str
    text: str
    user: str

class ThreadMessagesRequest(BaseModel):
    channel_id: str
    thread_ts: str

class ThreadContentFromDBResponse(BaseModel):
    processed_text: str

@router.get("/slack-channels", response_model=List[SlackChannel])
async def get_slack_channels():
    """
    Slackワークスペース内のチャンネル一覧を取得
    """
    try:
        response = slack_client.conversations_list(types="public_channel,private_channel", limit=1000)
        channels = response['channels']
        return [
            SlackChannel(id=channel['id'], name=channel['name'])
            for channel in channels
        ]
    except SlackApiError as e:
        raise HTTPException(status_code=500, detail=f"Slack API Error: {e.response['error']}")

@router.get("/thread-content-from-db", response_model=ThreadContentFromDBResponse)
async def get_thread_content_from_db(project_id: int, thread_ts: str, db: Session = Depends(get_db)):
    db_file = db.query(DBUploadedFile).filter(DBUploadedFile.project_id == project_id, DBUploadedFile.sourcename == thread_ts).first()
    if not db_file or not db_file.processed_text:
        try:
            return ThreadContentFromDBResponse(processed_text="スレッドの内容はまだデータベースに登録されていません。") # DBにない場合は空で返す
        except SlackApiError as e:
            raise HTTPException(status_code=500, detail=f"Slack API Error: {e.response['error']}")
    return ThreadContentFromDBResponse(processed_text=db_file.processed_text)

@router.get("/project-slack-links", response_model=List[ProjectSlackLink])
async def get_project_slack_links():
    return project_slack_links

@router.post("/connect-slack", response_model=ProjectSlackLink)
async def connect_slack_channel(link: ProjectSlackLink):
    # 既存のリンクを確認
    for existing_link in project_slack_links:
        if existing_link.project_id == link.project_id:
            raise HTTPException(status_code=400, detail="Project already connected to a Slack channel.")
    # 新しいリンクを追加
    project_slack_links.append(link)
    return link

@router.get("/project-slack/{project_id}", response_model=Optional[SlackChannel])
async def get_project_slack_channel(project_id: int):
    for link in project_slack_links:
        if link.project_id == project_id:
            try:
                response = slack_client.conversations_info(channel=link.slack_channel_id)
                channel = response['channel']
                return SlackChannel(id=channel['id'], name=channel['name'])
            except SlackApiError as e:
                raise HTTPException(status_code=500, detail=f"Slack API Error: {e.response['error']}")
    return None

@router.delete("/disconnect-slack/{project_id}")
async def disconnect_slack_channel(project_id: int):
    global project_slack_links
    project_slack_links = [link for link in project_slack_links if link.project_id != project_id]
    return {"detail": "Disconnected Slack channel from project."}

# Slackメッセージ検索機能
@router.post("/search-messages", response_model=List[SlackThread])
async def search_slack_messages(request: SlackSearchRequest):
    try:
        # チャンネル名を取得
        info_response = slack_client.conversations_info(channel=request.channel_id)
        channel_name = info_response["channel"]["name"]

        # 検索クエリをチャンネル名で実施
        search_query = f"in:#{channel_name} {request.query}"
        search_response = slack_client.search_messages(
            query=search_query,
            count=50,
            sort="timestamp",
            sort_dir="desc"
        )

        if not search_response["ok"]:
            raise HTTPException(status_code=400, detail=f"Slack API Error: {search_response['error']}")

        matches = search_response["messages"]["matches"]
        threads_dict = {}
        seen_threads = set()

        for msg in matches:
            # thread_ts がない場合、permalink から抽出を試みる
            if 'thread_ts' in msg:
                thread_ts = msg['thread_ts']
                print(f"'thread_ts' found for message ts={msg['ts']}: {thread_ts}")
            else:
                # permalink に含まれる thread_ts を解析
                permalink = msg.get('permalink')
                thread_ts = None
                if permalink:
                    parsed_url = urlparse(permalink)
                    query_params = parse_qs(parsed_url.query)
                    # クエリパラメータから thread_ts を取得（存在する場合）
                    if 'thread_ts' in query_params:
                        thread_ts = query_params['thread_ts'][0]
                        print(f"Extracted thread_ts from permalink for message ts={msg['ts']}: {thread_ts}")
                if not thread_ts:
                    # それでも thread_ts が取得できなければ、ts を代用
                    thread_ts = msg.get('ts')
                    print(f"No thread_ts found for message ts={msg['ts']}, using ts itself.")

            # 代表メッセージ（初投稿）のみを対象とする
            if msg['ts'] == thread_ts:
                if thread_ts in seen_threads:
                    print(f"Duplicate thread_ts={thread_ts} found, skipping additional occurrence.")
                    continue

                seen_threads.add(thread_ts)
                threads_dict[thread_ts] = {
                    "ts": thread_ts,
                    "text": msg.get('text', ''),
                    "user": msg.get('user', 'unknown')
                }
                print(f"Added thread: ts={thread_ts}, user={msg.get('user')}")
            else:
                print(f"Message ts={msg['ts']} is not representative (thread_ts={thread_ts}).")

        print(f"Total unique threads found: {len(threads_dict)}")
        return list(threads_dict.values())
    except SlackApiError as e:
        raise HTTPException(status_code=500, detail=f"Slack API Error: {e.response['error']}")

@router.get("/thread-messages", response_model=str)
async def get_thread_messages(channel_id: str, thread_ts: str):
    try:
        response = slack_client.conversations_replies(channel=channel_id, ts=thread_ts)
        messages = response.get("messages", [])
        # メッセージを連結して1つのテキストにまとめる
        thread_text = "\n\n".join(msg.get("text", "") for msg in messages)
        return thread_text
    except SlackApiError as e:
        raise HTTPException(status_code=500, detail=f"Slack API Error: {e.response['error']}")