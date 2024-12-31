# src/backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import proposals, solutions, ai, project_tasks
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
app.include_router(proposals.router, prefix="/api")
app.include_router(solutions.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(project_tasks.router, prefix="/api")

@app.get("/")
def root():
    return {"message": "Backend is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
