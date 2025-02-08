# src/backend/api/task.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from openai import OpenAI
import os
from dotenv import load_dotenv
from typing import List
import logging
import httpx
import json

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

class ExtractionRequest(BaseModel):
    document_text: str

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
async def extract_tasks(request: ExtractionRequest):
    """
    OpenAI APIを使用して議事録からタスクを抽出します。
    """
    try:
        logging.info("タスク抽出を開始します...")
        logging.debug(f"議事録の内容: {request.document_text}")

        response = client.chat.completions.create(
            model="gpt-4o-mini",  # Function Calling対応モデル
            messages=[
                {
                    "role": "system",
                    "content": "あなたは会議議事録からタスクを抽出する優秀なプロジェクトマネージャーアシスタントです。議事録に基づいてタスクのJSONリストを作成してください。",
                },
                {
                    "role": "user",
                    "content": f"議事録の内容:\n{request.document_text}",
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
