import {
  STORAGE_KEY,
  buildFolderFromTabs,
  deleteTabFromFolder,
  deleteFolder,
  formatFolderTimestamp,
  getFolders,
  isRestorableUrl,
  renameFolder,
  saveFolder,
  type StorageAreaLike,
  type TabFolder
} from "../lib/storage";

function createMemoryStorage(seedFolders: TabFolder[] = []): StorageAreaLike {
  const state: Record<string, unknown> = {
    [STORAGE_KEY]: structuredClone(seedFolders)
  };

  return {
    async get(keys) {
      if (typeof keys === "string") {
        return { [keys]: state[keys] };
      }

      return { [STORAGE_KEY]: state[STORAGE_KEY] };
    },
    async set(items) {
      Object.assign(state, items);
    }
  };
}

describe("isRestorableUrl", () => {
  it("accepts only http and https urls", () => {
    expect(isRestorableUrl("https://example.com")).toBe(true);
    expect(isRestorableUrl("http://example.com")).toBe(true);
    expect(isRestorableUrl("chrome://settings")).toBe(false);
    expect(isRestorableUrl("about:blank")).toBe(false);
  });
});

describe("buildFolderFromTabs", () => {
  it("filters non-restorable tabs and keeps order", () => {
    const folder = buildFolderFromTabs(
      [
        { title: "첫 번째", url: "https://a.example" },
        { title: "제외 대상", url: "chrome://extensions" },
        { title: "", url: "https://b.example" }
      ],
      "업무 세션",
      {
        createId: () => "folder-1",
        now: new Date("2026-03-11T06:00:00.000Z")
      }
    );

    expect(folder).not.toBeNull();
    expect(folder?.tabs.map((tab) => tab.url)).toEqual(["https://a.example", "https://b.example"]);
    expect(folder?.tabs[1].title).toBe("https://b.example");
    expect(folder?.skippedCount).toBe(1);
  });

  it("deduplicates identical urls while keeping the first tab", () => {
    const folder = buildFolderFromTabs(
      [
        { title: "원본", url: "https://dup.example" },
        { title: "중복", url: "https://dup.example" },
        { title: "다른 탭", url: "https://other.example" }
      ],
      "중복 제거 테스트",
      {
        createId: () => "folder-dup",
        now: new Date("2026-03-11T06:10:00.000Z")
      }
    );

    expect(folder?.tabs.map((tab) => tab.title)).toEqual(["원본", "다른 탭"]);
    expect(folder?.duplicateCount).toBe(1);
    expect(folder?.skippedCount).toBe(1);
  });

  it("returns null when there are no restorable tabs", () => {
    const folder = buildFolderFromTabs([{ title: "설정", url: "chrome://settings" }], "test");

    expect(folder).toBeNull();
  });

  it("uses the local timestamp label when folder name is blank", () => {
    const folder = buildFolderFromTabs([{ title: "문서", url: "https://example.com" }], "   ", {
      createId: () => "folder-2",
      now: new Date("2026-03-11T06:05:00.000Z")
    });

    expect(folder?.name).toBe(formatFolderTimestamp(new Date("2026-03-11T06:05:00.000Z")));
  });
});

describe("folder storage helpers", () => {
  it("saves and sorts folders by createdAt descending", async () => {
    const storage = createMemoryStorage();

    await saveFolder(
      {
        id: "older",
        name: "older",
        createdAt: "2026-03-11T05:00:00.000Z",
        updatedAt: "2026-03-11T05:00:00.000Z",
        source: "current-window",
        skippedCount: 0,
        tabs: [{ id: "older:0", title: "A", url: "https://a.example" }]
      },
      storage
    );
    await saveFolder(
      {
        id: "newer",
        name: "newer",
        createdAt: "2026-03-11T06:00:00.000Z",
        updatedAt: "2026-03-11T06:00:00.000Z",
        source: "current-window",
        skippedCount: 1,
        tabs: [{ id: "newer:0", title: "B", url: "https://b.example" }]
      },
      storage
    );

    const folders = await getFolders(storage);

    expect(folders.map((folder) => folder.id)).toEqual(["newer", "older"]);
  });

  it("renames a folder and updates updatedAt", async () => {
    const storage = createMemoryStorage([
      {
        id: "folder-1",
        name: "원래 이름",
        createdAt: "2026-03-11T05:00:00.000Z",
        updatedAt: "2026-03-11T05:00:00.000Z",
        source: "current-window",
        skippedCount: 0,
        tabs: [{ id: "tab-1", title: "A", url: "https://a.example" }]
      }
    ]);

    const folders = await renameFolder("folder-1", "변경된 이름", storage, new Date("2026-03-11T07:00:00.000Z"));

    expect(folders[0].name).toBe("변경된 이름");
    expect(folders[0].updatedAt).toBe("2026-03-11T07:00:00.000Z");
  });

  it("deletes a folder", async () => {
    const storage = createMemoryStorage([
      {
        id: "folder-1",
        name: "삭제 대상",
        createdAt: "2026-03-11T05:00:00.000Z",
        updatedAt: "2026-03-11T05:00:00.000Z",
        source: "current-window",
        skippedCount: 0,
        tabs: [{ id: "tab-1", title: "A", url: "https://a.example" }]
      }
    ]);

    const folders = await deleteFolder("folder-1", storage);

    expect(folders).toEqual([]);
  });

  it("deletes a single tab from a folder and updates updatedAt", async () => {
    const storage = createMemoryStorage([
      {
        id: "folder-1",
        name: "작업 탭",
        createdAt: "2026-03-11T05:00:00.000Z",
        updatedAt: "2026-03-11T05:00:00.000Z",
        source: "current-window",
        skippedCount: 0,
        tabs: [
          { id: "tab-1", title: "A", url: "https://a.example" },
          { id: "tab-2", title: "B", url: "https://b.example" }
        ]
      }
    ]);

    const folders = await deleteTabFromFolder("folder-1", "tab-1", storage, new Date("2026-03-11T08:00:00.000Z"));

    expect(folders[0].tabs.map((tab) => tab.id)).toEqual(["tab-2"]);
    expect(folders[0].updatedAt).toBe("2026-03-11T08:00:00.000Z");
  });

  it("removes the folder when its last tab is deleted", async () => {
    const storage = createMemoryStorage([
      {
        id: "folder-1",
        name: "한 개 남음",
        createdAt: "2026-03-11T05:00:00.000Z",
        updatedAt: "2026-03-11T05:00:00.000Z",
        source: "current-window",
        skippedCount: 0,
        tabs: [{ id: "tab-1", title: "A", url: "https://a.example" }]
      }
    ]);

    const folders = await deleteTabFromFolder("folder-1", "tab-1", storage);

    expect(folders).toEqual([]);
  });
});
