# src/backend/api/chat_history.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import csv, os, datetime
import logging

router = APIRouter()
HISTORY_CSV = os.path.join(os.path.dirname(__file__), '../../../data/chat_history.csv')

class MessageItem(BaseModel):
    sender: str
    message: str
    timestamp: str

class SaveChatRequest(BaseModel):
    project_id: int
    session_title: str
    messages: List[MessageItem]

def initialize_csv():
    if not os.path.exists(HISTORY_CSV):
        with open(HISTORY_CSV, mode='w', newline='', encoding='utf-8') as file:
            writer = csv.DictWriter(file, fieldnames=["project_id", "session_title", "timestamp", "sender", "message"])
            writer.writeheader()

initialize_csv()

@router.post("/save", response_model=List[MessageItem])
async def save_chat(request: SaveChatRequest):
    logging.debug(f"Received save request: {request}")
    # 各メッセージをCSVに追加
    with open(HISTORY_CSV, mode='a', newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=["project_id", "session_title", "timestamp", "sender", "message"])
        for msg in request.messages:
            writer.writerow({
                "project_id": request.project_id,
                "session_title": request.session_title,
                "timestamp": msg.timestamp,
                "sender": msg.sender,
                "message": msg.message
            })
    return request.messages

@router.get("/history/{project_id}/{session_title}", response_model=List[MessageItem])
async def get_chat_history(project_id: int, session_title: str):
    records = []
    try:
        with open(HISTORY_CSV, mode='r', newline='', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                if int(row["project_id"]) == project_id and row["session_title"] == session_title:
                    records.append(MessageItem(**row))
        return records
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sessions/{project_id}", response_model=List[str])
async def get_session_titles(project_id: int):
    titles = set()
    try:
        with open(HISTORY_CSV, mode='r', newline='', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                if int(row["project_id"]) == project_id:
                    titles.add(row["session_title"])
        return list(titles)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/rename")
async def rename_session(project_id: int, old_title: str, new_title: str):
    records = []
    updated = False
    try:
        with open(HISTORY_CSV, mode='r', newline='', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                if int(row["project_id"]) == project_id and row["session_title"] == old_title:
                    row["session_title"] = new_title
                    updated = True
                records.append(row)
        
        if not updated:
            raise HTTPException(status_code=404, detail="該当するセッションが見つかりません")

        # CSVファイルを上書き保存
        with open(HISTORY_CSV, mode='w', newline='', encoding='utf-8') as file:
            writer = csv.DictWriter(file, fieldnames=["project_id", "session_title", "timestamp", "sender", "message"])
            writer.writeheader()
            writer.writerows(records)

        return {"detail": "セッション名が変更されました", "old_title": old_title, "new_title": new_title}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/delete")
async def delete_session(project_id: int, session_title: str):
    records = []
    deleted = False
    try:
        with open(HISTORY_CSV, mode='r', newline='', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                if int(row["project_id"]) == project_id and row["session_title"] == session_title:
                    deleted = True
                    continue  # この行は削除対象なのでリストに追加しない
                records.append(row)

        if not deleted:
            raise HTTPException(status_code=404, detail="該当するセッションが見つかりません")

        # CSVファイルを上書き保存
        with open(HISTORY_CSV, mode='w', newline='', encoding='utf-8') as file:
            writer = csv.DictWriter(file, fieldnames=["project_id", "session_title", "timestamp", "sender", "message"])
            writer.writeheader()
            writer.writerows(records)

        return {"detail": "セッションが削除されました", "session_title": session_title}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/move")
async def move_session(old_project_id: int, new_project_id: int, session_title: str):
    records = []
    moved = False
    try:
        with open(HISTORY_CSV, mode='r', newline='', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                if int(row["project_id"]) == old_project_id and row["session_title"] == session_title:
                    row["project_id"] = new_project_id
                    moved = True
                records.append(row)

        if not moved:
            raise HTTPException(status_code=404, detail="該当するセッションが見つかりません")

        # CSVファイルを上書き保存
        with open(HISTORY_CSV, mode='w', newline='', encoding='utf-8') as file:
            writer = csv.DictWriter(file, fieldnames=["project_id", "session_title", "timestamp", "sender", "message"])
            writer.writeheader()
            writer.writerows(records)

        return {"detail": "セッションのプロジェクトが移動されました", "session_title": session_title, "new_project_id": new_project_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
