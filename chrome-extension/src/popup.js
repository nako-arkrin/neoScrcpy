const statusEl = document.getElementById("status");
const pingBtn = document.getElementById("ping");

pingBtn.addEventListener("click", async () => {
  try {
    const response = await chrome.runtime.sendMessage({ type: "PING" });
    statusEl.textContent = response?.ok ? "收到回复：OK" : "收到回复：未知";
  } catch (e) {
    statusEl.textContent = "发送失败（扩展未完全加载？）";
  }
});

