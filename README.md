# 投稿審查系統

使用 uv + FastAPI + PostgreSQL + HTML / CSS / JavaScript 的簡單投稿審查系統。

## 功能

兩種角色：作者、編輯

- 作者
  - 查看投稿稿件清單（類別、標題、審查狀態）
  - 新增 / 編輯投稿（類別、標題、文章內容），狀態為「編輯中」
  - 刪除編輯中稿件
  - 送出投稿：編輯中 => 審查中
- 編輯
  - 查看待審查清單（作者、類別、標題）
  - 查看稿件內容
  - 通過：審查中 => 已通過
  - 退回：審查中 => 編輯中

## 執行方式

1. 確認 PostgreSQL 有在跑，並建立資料庫（只需做一次）：

   ```bash
   createdb review_db
   ```

2. 啟動伺服器（第一次會自動安裝套件，資料表也會自動建立）：

   ```bash
   uv run uvicorn main:app --reload
   ```

3. 打開瀏覽器：http://127.0.0.1:8000

   如果 8000 已經被別的程式佔用，可以換一個埠：`uv run uvicorn main:app --reload --port 8001`

## 檔案說明

```
review-system/
├── pyproject.toml     uv 專案設定（套件清單）
├── main.py            後端：FastAPI 的 API 和資料庫操作
└── static/            前端網頁
    ├── index.html     首頁，選擇角色
    ├── author.html    作者頁面
    ├── author.js      作者頁面的程式
    ├── editor.html    編輯頁面
    ├── editor.js      編輯頁面的程式
    ├── api.js         呼叫後端 API 的共用小工具
    └── style.css      樣式
```

## 資料表

```sql
CREATE TABLE articles (
    id       SERIAL PRIMARY KEY,
    author   TEXT NOT NULL,              -- 作者
    category TEXT NOT NULL,              -- 類別
    title    TEXT NOT NULL,              -- 標題
    content  TEXT NOT NULL,              -- 文章內容
    status   TEXT NOT NULL DEFAULT '編輯中'  -- 編輯中 / 審查中 / 已通過
);
```

## API 列表

| 方法 | 網址 | 說明 |
|------|------|------|
| GET | /api/articles?author=名字 | 作者的投稿清單 |
| POST | /api/articles | 新增投稿 |
| GET | /api/articles/{id} | 查看稿件內容 |
| PUT | /api/articles/{id} | 編輯投稿（限編輯中） |
| DELETE | /api/articles/{id} | 刪除投稿（限編輯中） |
| POST | /api/articles/{id}/submit | 送出投稿 |
| GET | /api/review | 待審查清單 |
| POST | /api/articles/{id}/approve | 通過 |
| POST | /api/articles/{id}/reject | 退回 |

啟動後也可以打開 http://127.0.0.1:8000/docs 直接測試 API（FastAPI 自動產生）。
