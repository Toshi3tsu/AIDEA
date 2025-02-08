# src/backend/api/chat_history.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, validator
from typing import List, Union, Optional
import re
from datetime import datetime
import logging
import asyncio

from sqlalchemy.orm import Session
from database import get_db, SessionLocal, ChatHistory

router = APIRouter()

class MessageItem(BaseModel):
    sender: str
    message: str
    timestamp: datetime
    source_name: Optional[Union[str, List[str]]] = None
    source_path: Optional[str] = None
    source_ids: Optional[List[str]] = None

    @validator('timestamp', pre=True)
    def parse_timestamp(cls, value):
        if isinstance(value, str):
            value = re.sub(r'Z$', '+00:00', value)
            return datetime.fromisoformat(value)
        return value

class SessionItem(BaseModel):
    session_title: str
    session_id: int
    latest_timestamp: datetime

class SaveChatRequest(BaseModel):
    session_id: int
    project_id: int
    session_title: str
    messages: List[MessageItem]

@router.post("/save", response_model=List[MessageItem])
async def save_chat(request: SaveChatRequest, db: Session = Depends(get_db)):
    async def write_to_db():
        try:
            await asyncio.to_thread(_write_messages_to_db, request)
        except Exception as e:
            logging.error(f"Failed to write to DB: {e}")
            raise HTTPException(status_code=500, detail="DBへの書き込み中にエラーが発生しました。")
    asyncio.create_task(write_to_db())
    return request.messages

def _write_messages_to_db(request: SaveChatRequest):
    db = SessionLocal()
    try:
        for msg in request.messages:
            db_chat_history = ChatHistory(
                session_id=request.session_id,
                project_id=request.project_id,
                user_id='user_888',  # 固定または認証情報から取得
                session_title=request.session_title,
                timestamp=msg.timestamp,
                sender=msg.sender,
                message=msg.message,
                source_name=msg.source_name,
                source_path=msg.source_path,
                source_ids=msg.source_ids
            )
            db.add(db_chat_history)
        db.commit()
    except Exception as e:
        raise e
    finally:
        db.close()

@router.get("/history/{project_id}/{session_id}", response_model=List[MessageItem])
async def get_chat_history(project_id: int, session_id: int, db: Session = Depends(get_db)):
    try:
        db_records = db.query(ChatHistory).filter(
            ChatHistory.project_id == project_id,
            ChatHistory.session_id == session_id
        ).all()
        return [MessageItem(
            sender=record.sender,
            message=record.message,
            timestamp=record.timestamp,
            source_name=record.source_name,
            source_path=record.source_path,
            source_ids=record.source_ids
        ) for record in db_records]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sessions/{project_id}", response_model=List[SessionItem])
async def get_session_titles(project_id: int, db: Session = Depends(get_db)):
    sessions = {}
    try:
        db_records = db.query(ChatHistory).filter(ChatHistory.project_id == project_id).distinct(ChatHistory.session_id).all()
        for record in db_records:
            session_id = record.session_id
            latest_record = db.query(ChatHistory).filter(
                ChatHistory.project_id == project_id,
                ChatHistory.session_id == session_id
            ).order_by(ChatHistory.timestamp.desc()).first()
            sessions[session_id] = {"title": latest_record.session_title if latest_record else "No Title", "timestamp": record.timestamp}
        sorted_sessions = sorted(sessions.items(), key=lambda item: item[1]["timestamp"], reverse=True)
        return [SessionItem(
            session_title=session_data["title"],
            latest_timestamp=session_data["timestamp"],
            session_id=session_id
        ) for session_id, session_data in sorted_sessions]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/rename")
async def rename_session(project_id: int, session_id: int, new_title: str, db: Session = Depends(get_db)):
    try:
        db_records = db.query(ChatHistory).filter(
            ChatHistory.project_id == project_id,
            ChatHistory.session_id == session_id
        ).all()
        if not db_records:
            raise HTTPException(status_code=404, detail="該当するセッションが見つかりません")
        for record in db_records:
            record.session_title = new_title
        db.commit()
        return {"detail": "セッション名が変更されました", "session_id": session_id, "new_title": new_title}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/delete")
async def delete_session(project_id: int, session_id: int, db: Session = Depends(get_db)):
    try:
        db_records = db.query(ChatHistory).filter(
            ChatHistory.project_id == project_id,
            ChatHistory.session_id == session_id
        ).all()
        if not db_records:
            raise HTTPException(status_code=404, detail="該当するセッションが見つかりません")
        for record in db_records:
            db.delete(record)
        db.commit()
        return {"detail": "セッションが削除されました", "session_id": session_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/move")
async def move_session(old_project_id: int, new_project_id: int, session_id: int, db: Session = Depends(get_db)):
    try:
        db_records = db.query(ChatHistory).filter(
            ChatHistory.project_id == old_project_id,
            ChatHistory.session_id == session_id
        ).all()
        if not db_records:
            raise HTTPException(status_code=404, detail="該当するセッションが見つかりません")
        for record in db_records:
            record.project_id = new_project_id
        db.commit()
        return {"detail": "セッションのプロジェクトが移動されました", "session_id": session_id, "new_project_id": new_project_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
