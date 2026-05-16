chrome.runtime.onInstalled.addListener(() => {
  console.log("Basic Extension installed");
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "PING") {
    sendResponse({ ok: true });
    return;
  }
});
