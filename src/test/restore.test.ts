import {
  buildTabsToRightOptions,
  DEFAULT_RESTORE_MODE,
  getRestoreModeLabel
} from "../lib/restore";
import type { TabFolder } from "../lib/storage";

function createFolder(): TabFolder {
  return {
    id: "folder-1",
    kind: "session",
    name: "업무 시작",
    createdAt: "2026-03-11T05:00:00.000Z",
    updatedAt: "2026-03-11T05:00:00.000Z",
    source: "current-window",
    skippedCount: 0,
    tabs: [
      { id: "tab-1", title: "A", url: "https://a.example" },
      { id: "tab-2", title: "B", url: "https://b.example" },
      { id: "tab-3", title: "C", url: "https://c.example" }
    ]
  };
}

describe("restore helpers", () => {
  it("uses new-tab as the default manager restore mode", () => {
    expect(DEFAULT_RESTORE_MODE).toBe("new-tab");
    expect(getRestoreModeLabel("new-tab")).toBe("새 탭");
    expect(getRestoreModeLabel("current-tab")).toBe("현재 탭");
  });

  it("builds create requests for the tabs that should open to the right of the active tab", () => {
    const requests = buildTabsToRightOptions(
      createFolder(),
      {
        id: 99,
        index: 4,
        windowId: 7
      } as chrome.tabs.Tab
    );

    expect(requests).toEqual([
      { url: "https://b.example", windowId: 7, index: 5, active: false },
      { url: "https://c.example", windowId: 7, index: 6, active: false }
    ]);
  });
});
