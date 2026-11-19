// 目前正在看哪一篇稿件
let currentId = null;

// 載入待審查清單
async function loadReviewList() {
  const articles = await callApi("/api/review");

  let html = "";
  for (const a of articles) {
    html += `
      <tr>
        <td>${a.author}</td>
        <td>${a.category}</td>
        <td>${a.title}</td>
        <td><button onclick="viewArticle(${a.id})">查看</button></td>
      </tr>
    `;
  }

  if (articles.length === 0) {
    html = `<tr><td colspan="4" class="hint">目前沒有待審查的稿件</td></tr>`;
  }
  document.getElementById("review-list").innerHTML = html;
}

// 按下「查看」: 顯示稿件內容
async function viewArticle(id) {
  const article = await callApi("/api/articles/" + id);

  currentId = id;
  document.getElementById("detail-title").textContent = article.title;
  document.getElementById("detail-author").textContent = article.author;
  document.getElementById("detail-category").textContent = article.category;
  document.getElementById("detail-content").textContent = article.content;
  document.getElementById("detail").hidden = false;
}

// 關閉稿件內容
function closeDetail() {
  currentId = null;
  document.getElementById("detail").hidden = true;
}

// 按下「通過」: 審查中 => 已通過
async function approveArticle() {
  await callApi("/api/articles/" + currentId + "/approve", "POST");
  closeDetail();
  loadReviewList();
}

// 按下「退回」: 審查中 => 編輯中
async function rejectArticle() {
  await callApi("/api/articles/" + currentId + "/reject", "POST");
  closeDetail();
  loadReviewList();
}

// 一打開頁面就載入清單
loadReviewList();
