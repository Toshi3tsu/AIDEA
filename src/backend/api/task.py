# src/backend/api/task.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from openai import OpenAI, AzureOpenAI
import os
from dotenv import load_dotenv
from typing import List
import logging
import httpx
import json
import datetime

load_dotenv()

# ログの設定
logging.basicConfig(level=logging.DEBUG)

# モデルごとの設定
MODEL_CONFIG = {
    "Azure-gpt-4o-mini": {
        "azure_endpoint": os.getenv("AZURE_OPENAI_ENDPOINT"),
        "api_key": os.getenv("AZURE_OPENAI_API_KEY"),
        "api_version": "2024-08-01-preview",
        "cert_path": os.getenv("AZURE_CERT_PATH"),
        "api_model_name": "gpt-4o-mini"  # Azure OpenAIのデプロイ名に合わせる必要があるかもしれません
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

        return AzureOpenAI(
            azure_endpoint=azure_endpoint, 
            api_key=api_key, 
            api_version=api_version
        )
    else:
        raise ValueError(f"モデル '{model}' はAzure OpenAIモデルではありません。")

router = APIRouter()

class ExtractionRequest(BaseModel):
    document_text: str
    model: str = "Azure-gpt-4o-mini"

class TaskItem(BaseModel):
    title: str
    assignee: str
    start_date: str
    due_date: str
    detail: str
    tag: str  # 新規作成、更新、クローズ、無視など

class ExtractionResponse(BaseModel):
    tasks: List[TaskItem]

@router.post("/extract-tasks", response_model=ExtractionResponse)
async def extract_tasks(task_extraction_request: ExtractionRequest):
    client = get_client(task_extraction_request.model)
    api_model_name = MODEL_CONFIG[task_extraction_request.model]["api_model_name"]
    """
    OpenAI APIを使用して議事録からタスクを抽出します。
    """
    try:
        logging.info("タスク抽出を開始します...")
        logging.debug(f"議事録の内容: {task_extraction_request.document_text}")

        response = client.chat.completions.create(
            model=api_model_name,
            messages=[
                {
                    "role": "system",
                    "content": "あなたは会議議事録からタスクを抽出する優秀なプロジェクトマネージャーアシスタントです。議事録に基づいてタスクのJSONリストを作成してください。",
                },
                {
                    "role": "user",
                    "content": f"議事録の内容:\n{task_extraction_request.document_text}",
                },
            ],
            functions=[
                {
                    "name": "extract_tasks",
                    "description": "議事録からタスクを抽出する",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "tasks": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "title": {"type": "string", "description": "タスク名"},
                                        "assignee": {"type": "string", "description": "担当者名"},
                                        "due_date": {"type": "string", "description": "期限日 (YYYY-MM-DD形式)"},
                                        "detail": {"type": "string", "description": "タスクの詳細"},
                                        "tag": {
                                            "type": "string",
                                            "enum": ["新規作成", "更新", "クローズ", "無視"],
                                            "description": "タスクの状態タグ",
                                        },
                                    },
                                    "required": ["title", "assignee", "due_date", "tag"],
                                },
                            },
                        },
                        "required": ["tasks"],
                    },
                }
            ],
            function_call={"name": "extract_tasks"},
            max_tokens=16384,
            temperature=0.1,
        )

        # LLMの応答解析
        function_call = response.choices[0].message.function_call
        if not function_call or not hasattr(function_call, "arguments"):
            logging.error("タスク抽出に失敗しました。関数の応答がありません。")
            raise HTTPException(status_code=500, detail="タスク抽出に失敗しました。")

        # 抽出結果をJSON形式に変換
        tasks_data = json.loads(function_call.arguments)
        tasks = tasks_data.get("tasks", [])

        logging.info("タスク抽出が完了しました。")
        return ExtractionResponse(
            tasks=[
                TaskItem(
                    title=task["title"],
                    assignee=task["assignee"],
                    start_date=datetime.datetime.now().strftime("%Y-%m-%d"),
                    due_date=task["due_date"],
                    detail=task.get("detail", ""),
                    tag=task["tag"],
                )
                for task in tasks
            ]
        )

    except Exception as e:
        logging.error(f"タスク抽出処理中にエラーが発生しました: {str(e)}")
        raise HTTPException(status_code=500, detail=f"タスク抽出中にエラーが発生しました: {str(e)}")
