import type { TabFolder } from "./storage";

export type RestoreMode = "new-tab" | "current-tab";

export const DEFAULT_RESTORE_MODE: RestoreMode = "new-tab";

export function getRestoreModeLabel(mode: RestoreMode): string {
  return mode === "current-tab" ? "현재 탭" : "새 탭";
}

export function buildTabsToRightOptions(folder: TabFolder, activeTab: chrome.tabs.Tab): chrome.tabs.CreateProperties[] {
  const baseIndex = typeof activeTab.index === "number" ? activeTab.index + 1 : 0;
  const windowId = activeTab.windowId;

  return folder.tabs.slice(1).map((tab, offset) => ({
    url: tab.url,
    windowId,
    index: baseIndex + offset,
    active: false
  }));
}

export async function restoreFolderTabs(folder: TabFolder, mode: RestoreMode): Promise<void> {
  if (mode === "current-tab") {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!activeTab || typeof activeTab.id !== "number" || typeof activeTab.windowId !== "number") {
      throw new Error("현재 활성 탭을 찾을 수 없습니다.");
    }

    const [firstTab, ...restTabs] = folder.tabs;

    if (!firstTab) {
      return;
    }

    await chrome.tabs.update(activeTab.id, { url: firstTab.url });

    if (restTabs.length === 0) {
      return;
    }

    const createRequests = buildTabsToRightOptions(folder, activeTab);

    for (const request of createRequests) {
      await chrome.tabs.create(request);
    }

    return;
  }

  for (const tab of folder.tabs) {
    await chrome.tabs.create({ url: tab.url, active: false });
  }
}
