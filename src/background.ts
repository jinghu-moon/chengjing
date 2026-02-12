console.log('[ChengJing] Background Service Worker Started');

// 监听安装事件
chrome.runtime.onInstalled.addListener(() => {
  console.log('[ChengJing] Extension Installed');
});

// 搜索建议代理：为受 CSP 限制的 API（如百度 JSONP）提供 fetch 中转
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'FETCH_SUGGESTION' && msg.url) {
    fetch(msg.url)
      .then(res => res.json())
      .then(data => sendResponse(data))
      .catch(() => sendResponse(null))
    return true // 异步响应
  }
});
