const flagEl = document.getElementById("flag");
const savedEl = document.getElementById("saved");

async function load() {
  const { exampleFlag = false } = await chrome.storage.sync.get({
    exampleFlag: false
  });
  flagEl.checked = exampleFlag;
}

async function save(value) {
  await chrome.storage.sync.set({ exampleFlag: value });
  savedEl.textContent = "已保存";
  setTimeout(() => {
    savedEl.textContent = "";
  }, 1200);
}

flagEl.addEventListener("change", () => {
  void save(flagEl.checked);
});

void load();

