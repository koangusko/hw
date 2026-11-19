# 投稿審查系統 - 後端 (FastAPI + PostgreSQL)
# 啟動: uv run uvicorn main:app --reload

import psycopg
from psycopg.rows import dict_row
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# 資料庫連線字串 (本機 PostgreSQL 的 review_db 資料庫)
DB_URL = "postgresql://localhost/review_db"

app = FastAPI()


def get_db():
    """開一條資料庫連線，查詢結果會是 dict，方便直接回傳 JSON"""
    return psycopg.connect(DB_URL, row_factory=dict_row)


# 程式啟動時，如果資料表還不存在就建立它
with get_db() as conn:
    conn.execute("""
        CREATE TABLE IF NOT EXISTS articles (
            id       SERIAL PRIMARY KEY,
            author   TEXT NOT NULL,
            category TEXT NOT NULL,
            title    TEXT NOT NULL,
            content  TEXT NOT NULL,
            status   TEXT NOT NULL DEFAULT '編輯中'
        )
    """)


# 前端送來的稿件資料格式
class Article(BaseModel):
    author: str
    category: str
    title: str
    content: str


def find_article(conn, article_id):
    """用 id 找一篇稿件，找不到就回傳 404"""
    article = conn.execute(
        "SELECT * FROM articles WHERE id = %s", (article_id,)
    ).fetchone()
    if article is None:
        raise HTTPException(404, "找不到這篇稿件")
    return article


def change_status(article_id, from_status, to_status):
    """把稿件狀態從 from_status 改成 to_status"""
    with get_db() as conn:
        article = find_article(conn, article_id)
        if article["status"] != from_status:
            raise HTTPException(400, f"稿件目前是「{article['status']}」，不能這樣操作")
        conn.execute(
            "UPDATE articles SET status = %s WHERE id = %s", (to_status, article_id)
        )
    return {"message": f"稿件已改為「{to_status}」"}


# ========== 作者功能 ==========

@app.get("/api/articles")
def list_my_articles(author: str):
    """查看自己的投稿清單 (類別、標題、審查狀態)"""
    with get_db() as conn:
        return conn.execute(
            "SELECT id, category, title, status FROM articles WHERE author = %s ORDER BY id",
            (author,),
        ).fetchall()


@app.post("/api/articles")
def create_article(article: Article):
    """新增投稿，狀態預設為「編輯中」"""
    with get_db() as conn:
        conn.execute(
            "INSERT INTO articles (author, category, title, content) VALUES (%s, %s, %s, %s)",
            (article.author, article.category, article.title, article.content),
        )
    return {"message": "新增成功"}


@app.put("/api/articles/{article_id}")
def update_article(article_id: int, article: Article):
    """編輯投稿 (只有「編輯中」可以改)"""
    with get_db() as conn:
        old = find_article(conn, article_id)
        if old["status"] != "編輯中":
            raise HTTPException(400, "只有「編輯中」的稿件可以修改")
        conn.execute(
            "UPDATE articles SET category = %s, title = %s, content = %s WHERE id = %s",
            (article.category, article.title, article.content, article_id),
        )
    return {"message": "修改成功"}


@app.delete("/api/articles/{article_id}")
def delete_article(article_id: int):
    """刪除投稿 (只有「編輯中」可以刪)"""
    with get_db() as conn:
        old = find_article(conn, article_id)
        if old["status"] != "編輯中":
            raise HTTPException(400, "只有「編輯中」的稿件可以刪除")
        conn.execute("DELETE FROM articles WHERE id = %s", (article_id,))
    return {"message": "刪除成功"}


@app.post("/api/articles/{article_id}/submit")
def submit_article(article_id: int):
    """送出投稿: 編輯中 => 審查中"""
    return change_status(article_id, "編輯中", "審查中")


# ========== 作者、編輯共用 ==========

@app.get("/api/articles/{article_id}")
def get_article(article_id: int):
    """查看一篇稿件的完整內容"""
    with get_db() as conn:
        return find_article(conn, article_id)


# ========== 編輯功能 ==========

@app.get("/api/review")
def list_review():
    """查看待審查清單 (作者、類別、標題)"""
    with get_db() as conn:
        return conn.execute(
            "SELECT id, author, category, title FROM articles WHERE status = '審查中' ORDER BY id"
        ).fetchall()


@app.post("/api/articles/{article_id}/approve")
def approve_article(article_id: int):
    """通過: 審查中 => 已通過"""
    return change_status(article_id, "審查中", "已通過")


@app.post("/api/articles/{article_id}/reject")
def reject_article(article_id: int):
    """退回: 審查中 => 編輯中"""
    return change_status(article_id, "審查中", "編輯中")


# 把 static 資料夾裡的 HTML / CSS / JS 當成網頁 (要放在最後面)
app.mount("/", StaticFiles(directory="static", html=True), name="static")
