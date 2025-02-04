# src/backend/api/chat.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from openai import OpenAI, AzureOpenAI
import os
from dotenv import load_dotenv
from typing import List, Optional
# from .files import UploadedFile
from .slack import get_project_slack_channel, ProjectSlackLink
import logging
import httpx
from fastapi.responses import PlainTextResponse
import httpx

load_dotenv()

# ログの設定
# logging.basicConfig(level=logging.DEBUG)

# モデルごとの設定（証明書とAPIキー）
MODEL_CONFIG = {
    "gpt-4o-mini": { # キーを修正 (OpenAI API 用の識別子)
        "api_key": os.getenv("OPENAI_API_KEY"),
        "cert_path": "C:\\Users\\toshimitsu_fujiki\\OpenAI_Cato_Networks_CA.crt",
        "api_model_name": "gpt-4o-mini" # APIに渡すモデル名を追加
    },
    "deepseek-chat": {
        "api_key": os.getenv("DEEPSEEK_API_KEY"),
        "cert_path": "C:\\Users\\toshimitsu_fujiki\\DeepSeek_CA.crt",
        "api_model_name": "deepseek-chat" # APIに渡すモデル名を追加 (DeepSeekも明示的に)
    },
    "Azure-gpt-4o-mini": { # キーを修正 (Azure OpenAI 用の識別子)
        "azure_endpoint": os.getenv("AZURE_OPENAI_ENDPOINT"),
        "api_key": os.getenv("AZURE_OPENAI_API_KEY"),
        "api_version": "2024-08-01-preview",
        "cert_path": "C:\\Users\\toshimitsu_fujiki\\Azure_Cato_Networks_CA.crt",
        "api_model_name": "gpt-4o-mini" # APIに渡すモデル名を追加
    }
}

def get_client(model: str):
    """
    選択されたモデルに基づき、適切なAPIキーと証明書、エンドポイントを適用してOpenAIクライアントを返す。
    """
    if model not in MODEL_CONFIG: # モデルが設定に存在するかチェック
        raise ValueError(f"指定されたモデル '{model}' は無効です。")

    model_config = MODEL_CONFIG[model]
    # APIキーの確認
    api_key = model_config.get("api_key")
    if not api_key:
        raise ValueError(f"{model} の APIキーが設定されていません。")

    if model == "Azure-gpt-4o-mini": # 条件分岐を修正 (Azure OpenAI 用の識別子)
        azure_endpoint = model_config.get("azure_endpoint")
        api_version = model_config.get("api_version")
        if not azure_endpoint:
            raise ValueError(f"{model} の Azure Endpoint が設定されていません。")
        if not api_version:
            raise ValueError(f"{model} の APIバージョンが設定されていません。")

        return AzureOpenAI(
            azure_endpoint = azure_endpoint,
            api_key=api_key,
            api_version=api_version
        )
    elif model == "deepseek-chat": # DeepSeek の場合 (変更なし)
         # DeepSeekモデル用の特定のエンドポイント設定
        base_url = "https://api.deepseek.com"

        client_params = {
            "api_key": api_key,
            "base_url": base_url
        }

        # 証明書パスが設定されている場合は、HTTPクライアントに追加
        cert_path = model_config.get("cert_path")
        if cert_path:
            client_params["http_client"] = httpx.Client(verify=cert_path)

        return OpenAI(**client_params)
    elif model == "gpt-4o-mini": # 通常の OpenAI API の場合 (識別子を修正)
        base_url = "https://api.openai.com/v1"
        client_params = {
            "api_key": api_key,
            "base_url": base_url
        }
        cert_path = model_config.get("cert_path")
        if cert_path:
            client_params["http_client"] = httpx.Client(verify=cert_path)
        return OpenAI(**client_params)
    else: # その他のモデル (念のため)
        base_url = "https://api.openai.com/v1"
        client_params = {
            "api_key": api_key,
            "base_url": base_url
        }
        cert_path = model_config.get("cert_path")
        if cert_path:
            client_params["http_client"] = httpx.Client(verify=cert_path)
        return OpenAI(**client_params)

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    model: str
    source_type: str
    source_id: Optional[str] = None
    source_ids: Optional[List[str]] = None # 複数ソースID用フィールド
    source_content: Optional[str] = None

class ChatResponse(BaseModel):
    response: str

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(chat_request: ChatRequest):
    """
    チャットのリクエストを処理し、選択されたソース（ファイルまたはSlackチャンネル）に基づいて
    コンテキストをプロンプトに挿入して回答を生成します。
    """
    client = get_client(chat_request.model)
    api_model_name = MODEL_CONFIG[chat_request.model]["api_model_name"] # APIに渡すモデル名を取得

    try:
        context = ""

        # ファイルが選択された場合
        if chat_request.source_type == 'file' and chat_request.source_id:
            # ファイル内容を直接利用 (frontend から source_content が送信されるようになった)
            context = f"### 以下は選択されたファイルの内容です:\n{chat_request.source_content}\n\n"

        # Slackスレッドが選択された場合
        elif chat_request.source_type == 'thread' and chat_request.source_id:
            # Slackスレッドの内容を直接利用 (frontend から source_content が送信されるようになった)
            context = f"### 以下は選択されたSlackスレッドの内容です:\n{chat_request.source_content}\n\n"

        # ユーザーからのメッセージをコンテキストに追加
        user_message = f"ユーザー: {chat_request.message}\nAI:"

        # OpenAI GPTへのリクエスト
        response = client.chat.completions.create(
            model=api_model_name,  # APIに渡すモデル名を使用
            messages=[
                {"role": "system", "content": "あなたは優秀な業務アシスタントAIです。"},
                {"role": "user", "content": context + user_message }
            ],
            max_tokens=4000,
            temperature=0.1,  # 応答の多様性を制御
        )

        ai_response = response.choices[0].message.content.strip()

        return ChatResponse(response=ai_response)

    except Exception as e:
        logging.error(f"Chat APIエラー: {str(e)}")
        raise HTTPException(status_code=500, detail=f"エラーが発生しました: {str(e)}")