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

router = APIRouter()

logging.basicConfig(level=logging.DEBUG)

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

def get_processed_text_by_source_names(db: Session, source_names: List[str], project_id: int) -> List[str]:
    processed_texts = []
    logging.debug(f"get_processed_text_by_source_names Source Names: {source_names}, Project ID: {project_id}")
    for source_name in source_names:
        uploaded_file = db.query(UploadedFile).filter(
            UploadedFile.source_name == source_name,
            UploadedFile.project_id == project_id
        ).first()
        if uploaded_file and uploaded_file.processed_text:
            processed_texts.append(uploaded_file.processed_text)
    return processed_texts

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(chat_request: ChatRequest, db: Session = Depends(get_db)):
    client = get_client(chat_request.model)
    api_model_name = MODEL_CONFIG[chat_request.model]["api_model_name"]

    print("Chat Request:" + str(chat_request))
    try:
        # コンテキスト生成：必要に応じて選択ファイルの processed_text を追加
        context = ""
        if chat_request.source_type == 'multiple' and chat_request.source_name:
            processed_texts = get_processed_text_by_source_names(db, chat_request.source_name, chat_request.project_id)
            logging.debug(f"/chat Processed Texts: {processed_texts}")
            if processed_texts:
                context += "### 以下の内容は選択されたファイルの内容です:\n"
                context += "\n---\n".join(processed_texts)
                context += "\n---\n\n"
            pass
        # ファイルが単一選択された場合 (source_id と source_content を使用)
        elif chat_request.source_type == 'file' and chat_request.source_name and chat_request.source_content:
            context = f"### 以下は選択されたファイルの内容です:\n{chat_request.source_content}\n\n"
        # Slackスレッドが選択された場合 (source_id と source_content を使用)
        elif chat_request.source_type == 'thread' and chat_request.source_name and chat_request.source_content:
            context = f"### 以下は選択されたSlackスレッドの内容です:\n{chat_request.source_content}\n\n"

        system_message_content = "あなたは優秀な業務アシスタントAIです。\n" + context

        # DB から過去のチャット履歴を取得し、コンテキストに含める
        history_messages = [{"role": "system", "content": system_message_content}]
        previous_source_ids = set() # 過去のsource_idsを保持するセット
        if chat_request.session_id is not None and chat_request.project_id is not None:
            db_records = db.query(ChatHistory).filter(
                ChatHistory.session_id == chat_request.session_id,
                ChatHistory.project_id == chat_request.project_id
            ).order_by(ChatHistory.timestamp.asc()).all()
            for record in db_records:
                role = "user" if record.sender == "user" else "assistant"
                history_messages.append({"role": role, "content": record.message})
                if record.sender == 'ai' and record.source_ids: # 直前のAI応答のsource_idsを継承
                    previous_source_ids.update(record.source_ids)

        history_messages.append({"role": "user", "content": chat_request.message})

        logging.debug(f"Chat History Messages: {history_messages}")

        # OpenAI GPT へのリクエスト
        response = client.chat.completions.create(
            model=api_model_name,
            messages=history_messages,
            max_tokens=16384,
            temperature=0.1,
        )
        ai_response = response.choices[0].message.content.strip()

        # 今回の応答で新たに生成されたsource_ids (ここでは仮に空リストとします。実際にはAI応答から抽出する処理が必要です)
        current_response_source_ids: List[str] = [] # AI応答から抽出されたsource_idsを格納 (例: ドキュメントIDなど)
        # source_name を source_ids に追加 (ファイル名をIDとして扱うのは少し不自然ですが、現状のコードに合わせています)
        if chat_request.source_name:
            if isinstance(chat_request.source_name, list):
                current_response_source_ids.extend([s.strip() for s in chat_request.source_name])
            else:
                current_response_source_ids.append(str(chat_request.source_name).strip()) # 文字列の場合もリストに追加

        # 過去のsource_idsと今回の応答のsource_idsを統合 (重複除去)
        cumulative_source_ids = set(previous_source_ids)
        cumulative_source_ids.update(current_response_source_ids)


        chat_response = ChatResponse(
            response=ai_response,
            source_name=chat_request.source_name, # source_name はそのまま渡す
            source_path=chat_request.source_path, # source_path もそのまま渡す
            source_ids=list(cumulative_source_ids) # 累積された source_ids を設定
        )
        return chat_response
    except Exception as e:
        logging.error(f"Chat APIエラー: {str(e)}")
        raise HTTPException(status_code=500, detail=f"エラーが発生しました: {str(e)}")