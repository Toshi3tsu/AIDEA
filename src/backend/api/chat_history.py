# src/backend/api/chat_history.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List
import os
from datetime import datetime as dt
import logging
import asyncio

from sqlalchemy.orm import Session
from database import get_db, SessionLocal, ChatHistory

router = APIRouter()

class MessageItem(BaseModel):
    sender: str
    message: str
    timestamp: dt

# 新たにセッション情報を返すためのモデルを定義
class SessionItem(BaseModel):
    session_title: str
    latest_timestamp: dt

class SaveChatRequest(BaseModel):
    project_id: int
    session_title: str
    messages: List[MessageItem]

@router.post("/save", response_model=List[MessageItem])
async def save_chat(request: SaveChatRequest, db: Session = Depends(get_db)):
    logging.debug(f"Received save request: {request}")

    async def write_to_db():
        try:
            await asyncio.to_thread(_write_messages_to_db, request)
        except Exception as e:
            logging.error(f"Failed to write to DB: {e}")
            raise HTTPException(status_code=500, detail="DBへの書き込み中にエラーが発生しました。")

    # 非同期に書き込み処理を実行
    asyncio.create_task(write_to_db())
    return request.messages

def _write_messages_to_db(request: SaveChatRequest):
    db = SessionLocal()  # 新しいセッションをこのスレッド内で生成する
    try:
        for msg in request.messages:
            # ISO形式の文字列（例："2025-02-03T01:32:00.715Z"）の末尾の 'Z' を除去
            timestamp_str = msg.timestamp.rstrip("Z")
            try:
                # 文字列を datetime オブジェクトに変換
                timestamp_dt = dt.fromisoformat(timestamp_str)
            except Exception as e:
                # 変換に失敗した場合は、UTCの現在時刻を利用する
                timestamp_dt = dt.utcnow()

            # ChatHistoryのインスタンスを生成
            db_chat_history = ChatHistory(
                project_id=request.project_id,
                user_id='user_888',  # 固定のユーザーID
                session_title=request.session_title,
                # モデルでは timestamp を文字列として保存している場合は、isoformat()で文字列に変換
                timestamp=timestamp_dt,
                sender=msg.sender,
                message=msg.message
            )
            db.add(db_chat_history)
        db.commit()
    except Exception as e:
        # エラーログを残し、例外を再送出する
        raise e
    finally:
        db.close()

@router.get("/history/{project_id}/{session_title}", response_model=List[MessageItem])
async def get_chat_history(project_id: int, session_title: str, db: Session = Depends(get_db)):
    records = []
    try:
        db_records = db.query(ChatHistory).filter(
            ChatHistory.project_id == project_id,
            ChatHistory.session_title == session_title
        ).all()
        for record in db_records:
            records.append(MessageItem(
                sender=record.sender,
                message=record.message,
                timestamp=record.timestamp
            ))
        return records
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sessions/{project_id}", response_model=List[SessionItem])
async def get_session_titles(project_id: int, db: Session = Depends(get_db)):
    sessions = {}
    try:
        db_records = db.query(ChatHistory).filter(ChatHistory.project_id == project_id).all()
        for record in db_records:
            session = record.session_title
            timestamp = record.timestamp
            if session not in sessions or sessions[session] < timestamp:
                sessions[session] = timestamp
        # タイムスタンプが新しい順にソートしてセッション一覧を作成
        sorted_sessions = sorted(sessions.items(), key=lambda x: x[1], reverse=True)
        return [SessionItem(session_title=session, latest_timestamp=timestamp) for session, timestamp in sorted_sessions]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/rename")
async def rename_session(project_id: int, old_title: str, new_title: str, db: Session = Depends(get_db)):
    try:
        db_records = db.query(ChatHistory).filter(
            ChatHistory.project_id == project_id,
            ChatHistory.session_title == old_title
        ).all()
        if not db_records:
            raise HTTPException(status_code=404, detail="該当するセッションが見つかりません")

        for record in db_records:
            record.session_title = new_title
        db.commit()

        return {"detail": "セッション名が変更されました", "old_title": old_title, "new_title": new_title}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/delete")
async def delete_session(project_id: int, session_title: str, db: Session = Depends(get_db)):
    try:
        db_records = db.query(ChatHistory).filter(
            ChatHistory.project_id == project_id,
            ChatHistory.session_title == session_title
        ).all()
        if not db_records:
            raise HTTPException(status_code=404, detail="該当するセッションが見つかりません")

        for record in db_records:
            db.delete(record)
        db.commit()

        return {"detail": "セッションが削除されました", "session_title": session_title}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/move")
async def move_session(old_project_id: int, new_project_id: int, session_title: str, db: Session = Depends(get_db)):
    try:
        db_records = db.query(ChatHistory).filter(
            ChatHistory.project_id == old_project_id,
            ChatHistory.session_title == session_title
        ).all()
        if not db_records:
            raise HTTPException(status_code=404, detail="該当するセッションが見つかりません")

        for record in db_records:
            record.project_id = new_project_id
        db.commit()

        return {"detail": "セッションのプロジェクトが移動されました", "session_title": session_title, "new_project_id": new_project_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
