# src/backend/api/news.py
from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Dict
import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import pytz
import os
from pathlib import Path
from sqlalchemy.orm import Session
from database import get_db, NewsKeyword as DBNewsKeyword  # Import database model
from pydantic import BaseModel
import logging

router = APIRouter()

# キャッシュの設定
NEWS_CACHE = {}
CACHE_EXPIRATION = timedelta(minutes=5)

# Pydantic models for keywords
class NewsKeywordBase(BaseModel):
    keyword: str
    user_id: str

class NewsKeywordCreate(NewsKeywordBase):
    pass

class NewsKeywordOut(NewsKeywordBase):
    id: int

    class Config:
        from_attributes = True

def fetch_google_news(keyword: str) -> List[Dict]:
    """
    指定されたキーワードでGoogleニュースを検索し、記事リストを返す (RSSフィードスクレイピング)。
    """
    url = f"https://news.google.com/rss/search?q={keyword}&hl=ja&gl=JP&ceid=JP:ja"
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()  # エラーレスポンスの場合は例外を発生させる
        soup = BeautifulSoup(response.content, 'xml')
        articles = []
        for item in soup.find_all('item'):
            title = item.title.text if item.title else "No Title"
            link = item.link.text if item.link else ""
            pub_date_str = item.pubDate.text if item.pubDate else None
            pub_datetime = None
            if pub_date_str:
                # GoogleニュースのpubDateはUTCなので、JSTに変換
                pub_datetime = datetime.strptime(pub_date_str, '%a, %d %b %Y %H:%M:%S %Z').replace(tzinfo=pytz.utc).astimezone(pytz.timezone('Asia/Tokyo'))
            articles.append({
                "title": title,
                "link": link,
                "pubDate": pub_datetime.isoformat() if pub_datetime else None,
            })
        return articles
    except requests.exceptions.RequestException as e:
        print(f"ニュース取得エラー: {e}")
        logging.error(f"ニュース取得エラー: {e}", exc_info=True)
        return []

@router.get("/keywords", response_model=List[NewsKeywordOut])
async def get_keywords(db: Session = Depends(get_db)) -> List[NewsKeywordOut]:
    """保存されたニュースキーワードをデータベースから取得する"""
    user_id = "user_888" # 固定のユーザーID
    keywords = db.query(DBNewsKeyword).filter(DBNewsKeyword.user_id == user_id).all()
    return keywords

@router.post("/keywords")
async def update_keywords(keywords: List[str], db: Session = Depends(get_db)):
    """ニュースキーワードをデータベースで更新する (全キーワードを置き換え)"""
    try:
        user_id = "user_888" # 固定のユーザーID
        # 古いキーワードを削除 (特定のuser_idに関連するもののみ)
        db.query(DBNewsKeyword).filter(DBNewsKeyword.user_id == user_id).delete()
        for keyword_str in keywords:
            keyword = NewsKeywordCreate(keyword=keyword_str, user_id=user_id)
            db_keyword = DBNewsKeyword(**keyword.dict())
            db.add(db_keyword)
        db.commit()
        return {"message": "Keywords updated successfully"}
    except Exception as e:
        db.rollback() # ロールバック
        raise HTTPException(status_code=500, detail=f"Failed to update keywords: {str(e)}")

@router.get("/news")
async def get_news(keyword: str = Query(..., title="検索キーワード")):
    """
    キーワードに基づいてGoogleニュース記事を取得するAPIエンドポイント。
    キャッシュを利用して一定時間内のリクエストは高速化。
    """
    now = datetime.now()
    cached_news = NEWS_CACHE.get(keyword)

    if cached_news and now - cached_news['timestamp'] < CACHE_EXPIRATION:
        print(f"キャッシュからニュースを取得: キーワード={keyword}")
        return cached_news['articles']

    print(f"APIからニュースをリフレッシュ: キーワード={keyword}")
    news_articles = fetch_google_news(keyword)
    NEWS_CACHE[keyword] = {
        'articles': news_articles,
        'timestamp': now
    }
    return news_articles