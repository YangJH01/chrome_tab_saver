export type TabCleanupCandidate = Pick<chrome.tabs.Tab, "id" | "windowId">;

export type TabCleanupPlan = {
  placeholderWindowId: number | null;
  tabIdsToClose: number[];
};

export function createTabCleanupPlan(windowTabs: TabCleanupCandidate[], tabsToClose: TabCleanupCandidate[]): TabCleanupPlan {
  const currentWindowTabIds = windowTabs.flatMap((tab) => (typeof tab.id === "number" ? [tab.id] : []));
  const tabIdsToClose = tabsToClose.flatMap((tab) => (typeof tab.id === "number" ? [tab.id] : []));
  const tabIdsToCloseSet = new Set(tabIdsToClose);
  const shouldCreatePlaceholder =
    currentWindowTabIds.length > 0 &&
    currentWindowTabIds.length === tabIdsToCloseSet.size &&
    currentWindowTabIds.every((tabId) => tabIdsToCloseSet.has(tabId));

  return {
    placeholderWindowId: shouldCreatePlaceholder
      ? windowTabs.find((tab) => typeof tab.windowId === "number")?.windowId ?? null
      : null,
    tabIdsToClose
  };
}

export async function cleanupTabsInCurrentWindow(
  windowTabs: TabCleanupCandidate[],
  tabsToClose: TabCleanupCandidate[]
): Promise<void> {
  const cleanupPlan = createTabCleanupPlan(windowTabs, tabsToClose);

  if (cleanupPlan.placeholderWindowId !== null) {
    await chrome.tabs.create({ active: false, windowId: cleanupPlan.placeholderWindowId });
  }

  if (cleanupPlan.tabIdsToClose.length > 0) {
    await chrome.tabs.remove(cleanupPlan.tabIdsToClose);
  }
}
