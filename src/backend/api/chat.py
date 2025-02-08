# src/backend/api/chat.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from openai import OpenAI, AzureOpenAI
import os
from dotenv import load_dotenv
from typing import Union, List, Optional
import logging
import httpx
from fastapi.responses import PlainTextResponse
from database import get_db, Session, UploadedFile, ChatHistory
from api.chat_history import MessageItem

load_dotenv()

# モデルごとの設定（証明書とAPIキー）
MODEL_CONFIG = {
    "gpt-4o-mini": {
        "api_key": os.getenv("OPENAI_API_KEY"),
        "cert_path": "C:\\Users\\toshimitsu_fujiki\\OpenAI_Cato_Networks_CA.crt",
        "api_model_name": "gpt-4o-mini"
    },
    "deepseek-chat": {
        "api_key": os.getenv("DEEPSEEK_API_KEY"),
        "cert_path": "C:\\Users\\toshimitsu_fujiki\\DeepSeek_CA.crt",
        "api_model_name": "deepseek-chat"
    },
    "Azure-gpt-4o-mini": {
        "azure_endpoint": os.getenv("AZURE_OPENAI_ENDPOINT"),
        "api_key": os.getenv("AZURE_OPENAI_API_KEY"),
        "api_version": "2024-08-01-preview",
        "cert_path": "C:\\Users\\toshimitsu_fujiki\\Azure_Cato_Networks_CA.crt",
        "api_model_name": "gpt-4o-mini"
    }
}

def get_client(model: str):
    if model not in MODEL_CONFIG:
        raise ValueError(f"指定されたモデル '{model}' は無効です。")
    model_config = MODEL_CONFIG[model]
    api_key = model_config.get("api_key")
    if not api_key:
        raise ValueError(f"{model} の APIキーが設定されていません。")

    if model == "Azure-gpt-4o-mini":
        azure_endpoint = model_config.get("azure_endpoint")
        api_version = model_config.get("api_version")
        if not azure_endpoint or not api_version:
            raise ValueError(f"{model} の設定が不十分です。")
        return AzureOpenAI(azure_endpoint=azure_endpoint, api_key=api_key, api_version=api_version)
    elif model == "deepseek-chat":
        base_url = "https://api.deepseek.com"
        client_params = {"api_key": api_key, "base_url": base_url}
        cert_path = model_config.get("cert_path")
        if cert_path:
            client_params["http_client"] = httpx.Client(verify=cert_path)
        return OpenAI(**client_params)
    else:  # gpt-4o-mini 等
        base_url = "https://api.openai.com/v1"
        client_params = {"api_key": api_key, "base_url": base_url}
        cert_path = model_config.get("cert_path")
        if cert_path:
            client_params["http_client"] = httpx.Client(verify=cert_path)
        return OpenAI(**client_params)

router = APIRouter()

class ChatRequest(BaseModel):
    session_id: Optional[int] = None
    project_id: Optional[int] = None
    message: str
    model: str
    source_type: str
    source_id: Optional[str] = None
    source_content: Optional[str] = None
    source_name: Optional[Union[str, List[str]]] = None
    source_path: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    source_name: Optional[Union[str, List[str]]] = None
    source_path: Optional[str] = None
    source_ids: Optional[List[str]] = None

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(chat_request: ChatRequest, db: Session = Depends(get_db)):
    client = get_client(chat_request.model)
    api_model_name = MODEL_CONFIG[chat_request.model]["api_model_name"]

    try:
        # コンテキスト生成：必要に応じて選択ファイルの processed_text を追加
        context = ""
        if chat_request.source_type == 'multiple' and chat_request.source_name:
            # ここに DB からファイル内容を取得する処理を実装（必要に応じて）
            pass
        elif chat_request.source_type in ('file', 'thread') and chat_request.source_content:
            context = f"### 以下は選択された内容です:\n{chat_request.source_content}\n\n"
            
        system_message_content = "あなたは優秀な業務アシスタントAIです。\n" + context

        # DB から過去のチャット履歴を取得し、コンテキストに含める
        history_messages = [{"role": "system", "content": system_message_content}]
        if chat_request.session_id is not None and chat_request.project_id is not None:
            db_records = db.query(ChatHistory).filter(
                ChatHistory.session_id == chat_request.session_id,
                ChatHistory.project_id == chat_request.project_id
            ).order_by(ChatHistory.timestamp.asc()).all()
            for record in db_records:
                role = "user" if record.sender == "user" else "assistant"
                history_messages.append({"role": role, "content": record.message})
        history_messages.append({"role": "user", "content": chat_request.message})

        logging.debug(f"Chat History Messages: {history_messages}")

        # OpenAI GPT へのリクエスト
        response = client.chat.completions.create(
            model=api_model_name,
            messages=history_messages,
            max_tokens=10000,
            temperature=0.1,
        )
        ai_response = response.choices[0].message.content.strip()

        # 累積のソース名を集計
        cumulative_source_names = set()
        if chat_request.source_name:
            if chat_request.source_type == 'multiple':
                if isinstance(chat_request.source_name, list):
                    for s in chat_request.source_name:
                        cumulative_source_names.add(s.strip())
                else:
                    for s in chat_request.source_name.split(','):
                        cumulative_source_names.add(s.strip())
            else:
                if isinstance(chat_request.source_name, list):
                    cumulative_source_names.add(chat_request.source_name[0])
                else:
                    cumulative_source_names.add(chat_request.source_name)
                
        return ChatResponse(
            response=ai_response,
            source_name=chat_request.source_name,
            source_path=chat_request.source_path,
            source_ids=list(cumulative_source_names)
        )
    except Exception as e:
        logging.error(f"Chat APIエラー: {str(e)}")
        raise HTTPException(status_code=500, detail=f"エラーが発生しました: {str(e)}")
