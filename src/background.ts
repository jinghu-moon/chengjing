console.log('[ChengJing] Background Service Worker Started');

// 监听安装事件
chrome.runtime.onInstalled.addListener(() => {
  console.log('[ChengJing] Extension Installed');
});
