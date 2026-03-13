import {
  getNextVisibleFolderCount,
  getVisibleFolders,
  INITIAL_VISIBLE_FOLDER_COUNT,
  LOAD_MORE_FOLDER_COUNT,
  toggleExpandedFolder
} from "../lib/popupFolders";
import type { TabFolder } from "../lib/storage";

function createFolder(index: number): TabFolder {
  return {
    id: `folder-${index}`,
    kind: "session",
    name: `폴더 ${index}`,
    createdAt: `2026-03-11T0${index}:00:00.000Z`,
    updatedAt: `2026-03-11T0${index}:00:00.000Z`,
    source: "current-window",
    skippedCount: 0,
    tabs: [
      {
        id: `folder-${index}:0`,
        title: `탭 ${index}`,
        url: `https://example.com/${index}`
      }
    ]
  };
}

describe("popup folder helpers", () => {
  it("shows at least the initial 3 folders", () => {
    const folders = Array.from({ length: 12 }, (_, index) => createFolder(index + 1));

    expect(getVisibleFolders(folders, 0)).toHaveLength(INITIAL_VISIBLE_FOLDER_COUNT);
    expect(getVisibleFolders(folders, 2)).toHaveLength(INITIAL_VISIBLE_FOLDER_COUNT);
  });

  it("loads 10 more folders at a time without exceeding the total", () => {
    expect(getNextVisibleFolderCount(INITIAL_VISIBLE_FOLDER_COUNT, 25)).toBe(
      INITIAL_VISIBLE_FOLDER_COUNT + LOAD_MORE_FOLDER_COUNT
    );
    expect(getNextVisibleFolderCount(INITIAL_VISIBLE_FOLDER_COUNT + LOAD_MORE_FOLDER_COUNT, 11)).toBe(11);
  });

  it("toggles the expanded folder id", () => {
    expect(toggleExpandedFolder(null, "folder-1")).toBe("folder-1");
    expect(toggleExpandedFolder("folder-1", "folder-1")).toBeNull();
    expect(toggleExpandedFolder("folder-1", "folder-2")).toBe("folder-2");
  });
});
