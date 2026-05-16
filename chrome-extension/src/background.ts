import { getState } from "./shared/storage";
import { t } from "./shared/i18n";

chrome.runtime.onInstalled.addListener(async () => {
  try {
    await chrome.tabs.create({ url: chrome.runtime.getURL("pages/welcome/index.html") });
  } catch (e) {
    console.error("Failed to open welcome page:", e);
  }

  // Create context menu with initial locale
  await updateContextMenu();
});

async function updateContextMenu() {
  try {
    // Remove existing menu items
    await chrome.contextMenus.removeAll();
    
    // Get current locale
    const state = await getState();
    const title = t(state.locale, "common.openSidePanel");
    
    // Create context menu
    await chrome.contextMenus.create({
      id: "open-sidepanel",
      title,
      contexts: ["all"]
    });
  } catch (e) {
    console.error("Failed to create context menu:", e);
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    if (message?.type === "OPEN_SIDEPANEL") {
      const windowId =
        typeof message.windowId === "number"
          ? message.windowId
          : sender.tab?.windowId ?? (await chrome.windows.getCurrent()).id;
      if (typeof windowId === "number" && chrome.sidePanel?.open) {
        await chrome.sidePanel.open({ windowId });
      }
      sendResponse({ ok: true });
      return;
    }

    if (message?.type === "OPEN_PERMISSION_TAB") {
      const url = chrome.runtime.getURL("pages/permission/index.html");
      const tabs = await chrome.tabs.query({ url });
      if (tabs.length) {
        const tab = tabs[0];
        if (typeof tab.id === "number") {
          await chrome.tabs.update(tab.id, { active: true, url });
        }
        if (typeof tab.windowId === "number") {
          await chrome.windows.update(tab.windowId, { focused: true });
        }
        if (tabs.length > 1) {
          const extraIds = tabs
            .slice(1)
            .map((t) => t.id)
            .filter((id): id is number => typeof id === "number");
          if (extraIds.length) {
            await chrome.tabs.remove(extraIds);
          }
        }
      } else {
        await chrome.tabs.create({ url });
      }
      sendResponse({ ok: true });
      return;
    }

    if (message?.type === "PING") {
      sendResponse({ ok: true });
      return;
    }

    sendResponse({ ok: false });
  })().catch((e) => {
    console.error("Background message handler error:", e);
    try {
      sendResponse({ ok: false, error: String(e?.message ?? e) });
    } catch (sendError) {
      console.error("Failed to send error response:", sendError);
    }
  });

  return true;
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "open-sidepanel") {
    try {
      const windowId = tab?.windowId ?? (await chrome.windows.getCurrent()).id;
      if (typeof windowId === "number" && chrome.sidePanel?.open) {
        await chrome.sidePanel.open({ windowId });
      }
    } catch (e) {
      console.error("Failed to open sidepanel from context menu:", e);
    }
  }
});

// Update context menu when locale changes
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.locale) {
    void updateContextMenu();
  }
});
