# src/backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import proposals, solutions, ai, project_tasks, projects, chat, chat_history, slack, box, files, notes, mask, task, news
from dotenv import load_dotenv

# .env ファイルの読み込み
load_dotenv()

app = FastAPI()

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # 必要に応じて変更
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ルーターの登録
app.include_router(proposals.router, prefix="/api/proposals")
app.include_router(solutions.router, prefix="/api/solutions")
app.include_router(ai.router, prefix="/api/ai")
app.include_router(project_tasks.router, prefix="/api/project_tasks")
app.include_router(projects.router, prefix="/api/projects")
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(chat_history.router, prefix="/api/chat_history", tags=["ChatHistory"])
app.include_router(slack.router, prefix="/api/slack", tags=["Slack"])
app.include_router(box.router, prefix="/api/box", tags=["Box"])
app.include_router(files.router, prefix="/api/files", tags=["Files"])
app.include_router(notes.router, prefix="/api/notes", tags=["notes"])
app.include_router(mask.router, prefix="/api/mask", tags=["Mask"])
app.include_router(task.router, prefix="/api/task", tags=["Task"])
app.include_router(news.router, prefix="/api/news", tags=["news"])

@app.get("/")
def root():
    return {"message": "Backend is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
