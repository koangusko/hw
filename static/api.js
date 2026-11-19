// 呼叫後端 API 的小工具 (作者頁、編輯頁都會用到)
// 用法: await callApi("/api/xxx", "POST", { 資料 })
async function callApi(url, method = "GET", data = null) {
  const options = {
    method: method,
    headers: { "Content-Type": "application/json" },
  };
  if (data !== null) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  const result = await response.json();

  // 後端回傳錯誤時，跳出訊息
  if (!response.ok) {
    alert(result.detail);
    return null;
  }
  return result;
}
