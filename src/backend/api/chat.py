# src/backend/api/chat.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from openai import OpenAI
import os
from dotenv import load_dotenv
from typing import Optional
from .files import UploadedFile
from .slack import get_project_slack_channel, ProjectSlackLink
import logging
import httpx

load_dotenv()

# ログの設定
logging.basicConfig(level=logging.DEBUG)

# モデルごとの設定（証明書とAPIキー）
MODEL_CONFIG = {
    "gpt-4o-mini": {
        "api_key": os.getenv("OPENAI_API_KEY"),
        "cert_path": "C:\\Users\\toshimitsu_fujiki\\OpenAI_Cato_Networks_CA.crt"
    },
    "deepseek-chat": {
        "api_key": os.getenv("DEEPSEEK_API_KEY"),
        "cert_path": "C:\\Users\\toshimitsu_fujiki\\DeepSeek_CA.crt"
    }
}

def get_client(model: str):
    """
    選択されたモデルに基づき、適切なAPIキーと証明書、エンドポイントを適用してOpenAIクライアントを返す。
    """
    if model not in MODEL_CONFIG:
        raise ValueError(f"指定されたモデル '{model}' は無効です。")

    model_config = MODEL_CONFIG[model]

    # APIキーの確認
    api_key = model_config.get("api_key")
    if not api_key:
        raise ValueError(f"{model} の APIキーが設定されていません。")

    # DeepSeekモデル用の特定のエンドポイント設定
    base_url = "https://api.deepseek.com" if model == "deepseek-chat" else "https://api.openai.com/v1"

    # HTTPクライアントの作成（適切な証明書の設定）
    httpx_client = httpx.Client(
        verify=model_config["cert_path"]
    )

    # OpenAIクライアントの作成（DeepSeekの場合はbase_urlを指定）
    return OpenAI(api_key=api_key, base_url=base_url, http_client=httpx_client)

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    model: str
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
    client = get_client(chat_request.model)
    
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
            model=chat_request.model,  # 使用するモデル
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
