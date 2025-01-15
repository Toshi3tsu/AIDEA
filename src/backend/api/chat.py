# src/backend/api/chat.py
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
CUSTOM_CERT_PATH = "C:\\Users\\toshimitsu_fujiki\\OpenAI_Cato_Networks_CA.crt"

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
    """
    チャットのリクエストを処理し、選択されたソース（ファイルまたはSlackチャンネル）に基づいて
    コンテキストをプロンプトに挿入して回答を生成します。
    """
    try:
        context = ""

        # ファイルが選択された場合
        if chat_request.source_type == 'file' and chat_request.source_id:
            file_path = os.path.join("../../data/uploads/", chat_request.source_id)
            logging.debug(f"Checking file at path: {file_path}")
            if not os.path.exists(file_path):
                logging.error(f"File not found: {file_path}")
                raise HTTPException(status_code=404, detail="選択されたファイルが見つかりません。")
            with open(file_path, "r", encoding="utf-8") as f:
                file_content = f.read()
            context = f"### 以下はアップロードされたファイルの内容です:\n{file_content}\n\n"

        # Slackチャンネルが選択された場合
        elif chat_request.source_type == 'slack' and chat_request.source_id:
            from .documents import read_projects  # プロジェクトのBPMN XMLを取得するため
            project_id = int(chat_request.source_id)  # SlackチャンネルとプロジェクトIDが紐づく
            projects = read_projects()
            project = next((p for p in projects if p["id"] == project_id), None)
            if project and project.get("bpmn_xml"):
                context = f"### 以下はプロジェクトに関連するBPMN業務フローです:\n{project['bpmn_xml']}\n\n"
            else:
                context = "### プロジェクトに関連する業務フローが見つかりませんでした。\n\n"

        # ユーザーからのメッセージをコンテキストに追加
        user_message = f"ユーザー: {chat_request.message}\nAI:"

        # OpenAI GPTへのリクエスト
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # 使用するモデル
            messages=[
                {"role": "system", "content": "あなたは優秀な業務アシスタントAIです。"},
                {"role": "user", "content": user_message + context}
            ],
            max_tokens=4000,
            temperature=0.1,  # 応答の多様性を制御
        )

        ai_response = response.choices[0].message.content.strip()

        return ChatResponse(response=ai_response)

    except Exception as e:
        logging.error(f"Chat APIエラー: {str(e)}")
        raise HTTPException(status_code=500, detail=f"エラーが発生しました: {str(e)}")
