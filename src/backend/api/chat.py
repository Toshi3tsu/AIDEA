# backend/api/chat.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from openai import OpenAI
import os
from dotenv import load_dotenv
from typing import Optional
from .files import UploadedFile
from .slack import get_project_slack_channel, ProjectSlackLink, project_slack_links
import logging
import httpx

load_dotenv()

# ログの設定
logging.basicConfig(level=logging.DEBUG)

# カスタム証明書のパス（自己署名証明書を指定）
CUSTOM_CERT_PATH = "C:\\Users\\toshimitsu_fujiki\\Cato Networks CA.crt"

# httpxクライアントを構築
httpx_client = httpx.Client(
    verify=CUSTOM_CERT_PATH  # 自己署名証明書を指定
)

# OpenAIクライアントにカスタムhttpxクライアントを渡す
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("APIキーが設定されていません。")

client = OpenAI(api_key=api_key, http_client=httpx_client)

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    source_type: Optional[str] = None  # 'file' または 'slack'
    source_id: Optional[str] = None    # ファイル名またはSlackチャンネルID

class ChatResponse(BaseModel):
    response: str

@router.post("/chat", response_model=ChatResponse)
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
        response = client.chat.completions.create(
            engine="gpt-4o-mini",  # 使用するモデル
            prompt=context + user_message,
            max_tokens=1000,
            n=1,
            stop=["ユーザー:", "AI:"],
            temperature=0,
        )

        ai_response = response.choices[0].message.content.strip()

        return ChatResponse(response=ai_response)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
