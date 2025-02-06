# src/backend/api/chat.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from openai import OpenAI, AzureOpenAI
import os
from dotenv import load_dotenv
from typing import Union, List, Optional
# from .files import UploadedFile
from .slack import get_project_slack_channel, ProjectSlackLink
import logging
import httpx
from fastapi.responses import PlainTextResponse
import httpx
from database import get_db, Session, UploadedFile
from api.chat_history import MessageItem

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
    source_content: Optional[str] = None
    source_name: Optional[Union[str, List[str]]] = None
    source_path: Optional[str] = None
    chat_history: Optional[List['MessageItem']] = None

class ChatResponse(BaseModel):
    response: str
    source_name: Optional[Union[str, List[str]]] = None
    source_path: Optional[str] = None
    source_ids: Optional[List[str]] = None

# processed_text を取得する関数
def get_processed_text_by_source_names(db: Session, source_names: List[str]) -> List[str]:
    """
    source_names のリストを受け取り、対応する processed_text のリストを返す。
    """
    processed_texts = []
    logging.debug(f"get_processed_text_by_source_names Source Names: {source_names}")
    for source_name in source_names:
        uploaded_file = db.query(UploadedFile).filter(UploadedFile.source_name == source_name).first()
        if uploaded_file and uploaded_file.processed_text:
            processed_texts.append(uploaded_file.processed_text)
    return processed_texts

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(chat_request: ChatRequest, db: Session = Depends(get_db)):
    """
    チャットのリクエストを処理し、選択されたソース（ファイルまたはSlackチャンネル）に基づいて
    コンテキストをプロンプトに挿入して回答を生成します。
    """
    client = get_client(chat_request.model)
    api_model_name = MODEL_CONFIG[chat_request.model]["api_model_name"]

    try:
        context = ""

        # ファイルが複数選択された場合 (source_ids を使用)
        logging.debug(f"/chat Source Type: {chat_request.source_type}")
        if chat_request.source_type == 'multiple' and chat_request.source_name:
            processed_texts = get_processed_text_by_source_names(db, chat_request.source_name)
            logging.debug(f"/chat Processed Texts: {processed_texts}")
            if processed_texts:
                context += "### 以下の内容は選択されたファイルの内容です:\n"
                context += "\n---\n".join(processed_texts)
                context += "\n---\n\n"

        # ファイルが単一選択された場合 (source_id と source_content を使用)
        elif chat_request.source_type == 'file' and chat_request.source_name and chat_request.source_content:
            context = f"### 以下は選択されたファイルの内容です:\n{chat_request.source_content}\n\n"

        # Slackスレッドが選択された場合 (source_id と source_content を使用)
        elif chat_request.source_type == 'thread' and chat_request.source_name and chat_request.source_content:
            context = f"### 以下は選択されたSlackスレッドの内容です:\n{chat_request.source_content}\n\n"


        system_message_content = "あなたは優秀な業務アシスタントAIです。\n"
        if context: # Add context to the system message if available
            system_message_content += context

        # 過去のチャット履歴をコンテキストに追加
        history_messages = []
        history_messages.append({"role": "system", "content": system_message_content}) # System message with context
        if chat_request.chat_history:
            for msg in chat_request.chat_history:
                role = "user" if msg.sender == "user" else "assistant"
                history_messages.append({"role": role, "content": msg.message}) # Just message content, no sender prefix

        history_messages.append({"role": "user", "content": chat_request.message}) # Current user message
        logging.debug(f"Chat History Messages: {history_messages}")

        # OpenAI GPTへのリクエスト
        response = client.chat.completions.create(
            model=api_model_name,
            messages=history_messages,
            max_tokens=10000,
            temperature=0.1,
        )

        ai_response = response.choices[0].message.content.strip()

        # バックエンドで、過去のチャット履歴および現在のリクエストから累積のソース情報を集計
        cumulative_source_names = set()
        if chat_request.chat_history:
            for msg in chat_request.chat_history:
                if msg.source_name:
                    # msg.source_name がリストの場合は各要素を追加、そうでなければそのまま追加
                    if isinstance(msg.source_name, list):
                        for name in msg.source_name:
                            cumulative_source_names.add(name)
                    else:
                        cumulative_source_names.add(msg.source_name)
        if chat_request.source_name:
            if chat_request.source_type == 'multiple':
                # source_name がリストの場合
                if isinstance(chat_request.source_name, list):
                    current_source_names = [s.strip() for s in chat_request.source_name]
                else:
                    # 万が一文字列の場合はカンマで分割する
                    current_source_names = [s.strip() for s in chat_request.source_name.split(',')]
                cumulative_source_names.update(current_source_names)
            else:
                # 単一選択の場合
                if isinstance(chat_request.source_name, list):
                    # リストなら最初の要素を利用する（必要に応じて調整）
                    cumulative_source_names.add(chat_request.source_name[0])
                else:
                    cumulative_source_names.add(chat_request.source_name)

        chat_response = ChatResponse(
            response=ai_response,
            source_name=chat_request.source_name,
            source_path=chat_request.source_path,
            source_ids=list(cumulative_source_names)
        )

        return chat_response

    except Exception as e:
        logging.error(f"Chat APIエラー: {str(e)}")
        raise HTTPException(status_code=500, detail=f"エラーが発生しました: {str(e)}")