# srr/backend/database.py
from sqlalchemy import create_engine, Column, Integer, String, Text, Boolean, DateTime, ForeignKey, BigInteger
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Session
import os

# データベース接続設定（PostgreSQLを使用する場合）
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:CHG_S10131@localhost/aidea_db"  # 実際の設定に合わせてください

# SQLAlchemyのエンジンとセッションを作成
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ベースクラスを作成
Base = declarative_base()

# データベースセッションを取得するユーティリティ関数
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# データベースモデル（例: Projectsテーブル）
class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    customer_name = Column(String, index=True)
    issues = Column(Text)
    is_archived = Column(Boolean, default=False)
    bpmn_xml = Column(Text)
    solution_requirements = Column(Text)
    stage = Column(String)
    category = Column(String)
    slack_channel_id = Column(String)
    slack_tag = Column(String)
    box_folder_path = Column(String)
    schedule = Column(DateTime, nullable=True)

class UploadedFile(Base):
    __tablename__ = "uploaded_files"
    id = Column(Integer, primary_key=True, index=True)
    source_name = Column(JSONB, nullable=True)
    source_path = Column(String)
    project_id = Column(Integer, index=True)
    creation_date = Column(DateTime, nullable=True)
    processed = Column(Boolean, default=False)
    processed_text = Column(String, nullable=True)

class Solution(Base):
    __tablename__ = "solutions"

    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    category = Column(String)
    features = Column(String)

class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True) # ID を追加、自動インクリメント
    session_id = Column(BigInteger, index=True)
    project_id = Column(Integer)
    user_id = Column(String(50), nullable=False, default='user_888')
    session_title = Column(String)
    timestamp = Column(DateTime)
    sender = Column(String)
    message = Column(String)
    source_name = Column(JSONB, nullable=True)
    source_path = Column(String, nullable=True)
    source_ids = Column(JSONB, nullable=True)

class NewsKeyword(Base):
    __tablename__ = "news_keywords"

    id = Column(Integer, primary_key=True, index=True)
    keyword = Column(String, index=True)
    user_id = Column(String, ForeignKey("users.id"), index=True) # ユーザーIDでフィルタリングや関連付けを容易にするためindexを追加

class User(Base): # Userモデルの例
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    # 他のユーザー属性...
    news_keywords = relationship("NewsKeyword", backref="user") # Userからキーワードへのリレーションシップ

# 初期化：データベースのテーブルを作成
def init_db():
    Base.metadata.create_all(bind=engine)
