# backend/api/chat.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import openai
import os
from dotenv import load_dotenv
from typing import Optional
from .files import UploadedFile
from .slack import get_project_slack_channel, ProjectSlackLink, project_slack_links

load_dotenv()

router = APIRouter()

# 環境変数からAPIキーを取得
openai.api_key = os.getenv("OPENAI_API_KEY")

class ChatRequest(BaseModel):
    message: str
    source_type: Optional[str] = None  # 'file' または 'slack'
    source_id: Optional[str] = None    # ファイル名またはSlackチャンネルID

class ChatResponse(BaseModel):
    response: str

@router.post("/", response_model=ChatResponse)
async def chat_endpoint(chat_request: ChatRequest):
    try:
        context = ""
        if chat_request.source_type == 'file' and chat_request.source_id:
            # ファイルの内容を取得
            file_path = os.path.join("data/uploads/", chat_request.source_id)
            if not os.path.exists(file_path):
                raise HTTPException(status_code=404, detail="File not found.")
            with open(file_path, "r", encoding="utf-8") as f:
                file_content = f.read()
            context = f"アップロードされたファイルの内容:\n{file_content}\n\n"
        elif chat_request.source_type == 'slack' and chat_request.source_id:
            # Slackチャンネルに連携されたプロジェクトのBPMN XMLを取得
            try:
                project_id = int(chat_request.source_id)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid project ID for Slack channel.")
            project_slack = next((link for link in project_slack_links if link.project_id == project_id), None)
            if project_slack:
                project_channel = await get_project_slack_channel(project_id)
                if project_channel and project_channel.id:
                    # ここでプロジェクトに関連するBPMN XMLを取得
                    # 例えば、プロジェクト情報から取得するなど
                    # 仮にプロジェクト情報にBPMN XMLが含まれていると仮定
                    from .documents import read_projects
                    projects = read_projects()
                    project = next((p for p in projects if p.id == project_id), None)
                    if project and project.bpmn_xml:
                        context = f"BPMN業務フローのデータ:\n{project.bpmn_xml}\n\n"
                    else:
                        context = "プロジェクトに業務フローが設定されていません。\n\n"
                else:
                    context = "連携されたSlackチャンネルに業務フローが設定されていません。\n\n"
            else:
                context = "プロジェクトに連携されたSlackチャンネルが見つかりません。\n\n"
        
        # ユーザーからのメッセージをコンテキストに追加
        user_message = f"ユーザー: {chat_request.message}\nAI:"

        # OpenAI GPTへのリクエスト
        response = openai.Completion.create(
            engine="text-davinci-003",  # 使用するモデル
            prompt=context + user_message,
            max_tokens=500,
            n=1,
            stop=["ユーザー:", "AI:"],
            temperature=0.7,
        )

        ai_response = response.choices[0].text.strip()

        return ChatResponse(response=ai_response)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
