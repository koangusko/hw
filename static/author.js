// 從網址取得作者名字，例如 author.html?name=小明
const authorName = new URLSearchParams(location.search).get("name");
if (!authorName) {
  location.href = "index.html"; // 沒有名字就回首頁
}
document.getElementById("author-name").textContent = authorName;

// 正在編輯哪一篇 (null 代表現在是「新增」)
let editingId = null;

// 載入我的投稿清單
async function loadArticles() {
  const articles = await callApi("/api/articles?author=" + encodeURIComponent(authorName));

  let html = "";
  for (const a of articles) {
    // 只有「編輯中」的稿件可以編輯、送出、刪除
    let buttons = "";
    if (a.status === "編輯中") {
      buttons = `
        <button onclick="editArticle(${a.id})">編輯</button>
        <button onclick="submitArticle(${a.id})">送出投稿</button>
        <button class="danger" onclick="deleteArticle(${a.id})">刪除</button>
      `;
    }

    html += `
      <tr>
        <td>${a.category}</td>
        <td>${a.title}</td>
        <td><span class="status ${a.status}">${a.status}</span></td>
        <td>${buttons}</td>
      </tr>
    `;
  }

  if (articles.length === 0) {
    html = `<tr><td colspan="4" class="hint">還沒有任何投稿</td></tr>`;
  }
  document.getElementById("article-list").innerHTML = html;
}

// 按下「儲存」: 新增或修改
async function saveArticle(event) {
  event.preventDefault(); // 不要讓表單重新整理頁面

  const data = {
    author: authorName,
    category: document.getElementById("category").value,
    title: document.getElementById("title").value,
    content: document.getElementById("content").value,
  };

  if (editingId === null) {
    await callApi("/api/articles", "POST", data);
  } else {
    await callApi("/api/articles/" + editingId, "PUT", data);
  }

  resetForm();
  loadArticles();
}

// 按下「編輯」: 把稿件內容放進表單
async function editArticle(id) {
  const article = await callApi("/api/articles/" + id);

  editingId = id;
  document.getElementById("form-title").textContent = "編輯投稿";
  document.getElementById("category").value = article.category;
  document.getElementById("title").value = article.title;
  document.getElementById("content").value = article.content;
}

// 清空表單，回到「新增」狀態
function resetForm() {
  editingId = null;
  document.getElementById("form-title").textContent = "新增投稿";
  document.getElementById("title").value = "";
  document.getElementById("content").value = "";
}

// 按下「送出投稿」: 編輯中 => 審查中
async function submitArticle(id) {
  if (!confirm("送出後就不能再修改，確定要送出嗎？")) return;
  await callApi("/api/articles/" + id + "/submit", "POST");
  loadArticles();
}

// 按下「刪除」
async function deleteArticle(id) {
  if (!confirm("確定要刪除這篇稿件嗎？")) return;
  await callApi("/api/articles/" + id, "DELETE");
  loadArticles();
}

// 一打開頁面就載入清單
loadArticles();
