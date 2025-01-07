# backend/api/slack.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# Slackクライアントの初期化
slack_client = WebClient(token=os.getenv("SLACK_BOT_TOKEN"))

class SlackChannel(BaseModel):
    id: str
    name: str

class ProjectSlackLink(BaseModel):
    project_id: int
    slack_channel_id: str

# プロジェクトとSlackチャンネルのリンクを管理（実際のアプリケーションではデータベースを使用）
project_slack_links: List[ProjectSlackLink] = []

@router.get("/slack-channels", response_model=List[SlackChannel])
async def get_slack_channels():
    try:
        response = slack_client.conversations_list(types="public_channel,private_channel", limit=1000)
        channels = response['channels']
        return [SlackChannel(id=channel['id'], name=channel['name']) for channel in channels]
    except SlackApiError as e:
        raise HTTPException(status_code=500, detail=f"Slack API Error: {e.response['error']}")

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

# 追加: Slackメッセージ検索機能
@router.post("/search-messages", response_model=List[dict])
async def search_slack_messages(channel_id: str, query: str):
    try:
        response = slack_client.search_messages(
            query=query,
            sort="timestamp",
            sort_dir="desc",
            count=10,
            highlight=True
        )
        messages = response['messages']['matches']
        # 必要な情報のみを抽出
        extracted_messages = [
            {
                "user": msg.get('user', 'unknown'),
                "text": msg.get('text', ''),
                "ts": msg.get('ts', '')
            }
            for msg in messages
        ]
        return extracted_messages
    except SlackApiError as e:
        raise HTTPException(status_code=500, detail=f"Slack API Error: {e.response['error']}")
