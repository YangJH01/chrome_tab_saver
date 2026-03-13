import {
  STORAGE_KEY,
  addTabsToFavoriteFolder,
  buildFolderFromTabs,
  createFavoriteFolder,
  deleteTabFromFolder,
  deleteFolder,
  formatFolderTimestamp,
  getFolders,
  isRestorableUrl,
  normalizeStoredFolders,
  previewTabsForFavoriteFolder,
  renameFolder,
  saveFolder,
  type FavoriteTabFolder,
  type StorageAreaLike,
  type TabFolder
} from "../lib/storage";

function createSessionFolder(overrides?: Partial<TabFolder>): TabFolder {
  return {
    id: "folder-1",
    kind: "session",
    name: "기본 세션",
    createdAt: "2026-03-11T05:00:00.000Z",
    updatedAt: "2026-03-11T05:00:00.000Z",
    source: "current-window",
    skippedCount: 0,
    tabs: [{ id: "tab-1", title: "A", url: "https://a.example" }],
    ...overrides
  } as TabFolder;
}

function createFavorite(overrides?: Partial<FavoriteTabFolder>): FavoriteTabFolder {
  return {
    id: "favorite-1",
    kind: "favorite",
    name: "즐겨찾기",
    createdAt: "2026-03-11T05:00:00.000Z",
    updatedAt: "2026-03-11T05:00:00.000Z",
    source: "manual",
    skippedCount: 0,
    tabs: [],
    ...overrides
  };
}

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
  it("migrates legacy stored sessions without a kind field", () => {
    expect(
      normalizeStoredFolders([
        {
          id: "legacy-1",
          name: "기존 세션",
          createdAt: "2026-03-11T05:00:00.000Z",
          updatedAt: "2026-03-11T05:00:00.000Z",
          source: "current-window",
          skippedCount: 0,
          tabs: [{ id: "legacy-1:0", title: "A", url: "https://a.example" }]
        }
      ])
    ).toEqual([
      {
        id: "legacy-1",
        kind: "session",
        name: "기존 세션",
        createdAt: "2026-03-11T05:00:00.000Z",
        updatedAt: "2026-03-11T05:00:00.000Z",
        source: "current-window",
        skippedCount: 0,
        tabs: [{ id: "legacy-1:0", title: "A", url: "https://a.example" }]
      }
    ]);
  });

  it("filters corrupted stored urls during normalization", () => {
    expect(
      normalizeStoredFolders([
        {
          id: "favorite-unsafe",
          kind: "favorite",
          name: "즐겨찾기",
          createdAt: "2026-03-11T05:00:00.000Z",
          updatedAt: "2026-03-11T05:00:00.000Z",
          source: "manual",
          skippedCount: 0,
          tabs: [
            { id: "favorite-unsafe:0", title: "safe", url: "https://safe.example" },
            { id: "favorite-unsafe:1", title: "bad", url: "javascript:alert(1)" }
          ]
        }
      ])
    ).toEqual([
      {
        id: "favorite-unsafe",
        kind: "favorite",
        name: "즐겨찾기",
        createdAt: "2026-03-11T05:00:00.000Z",
        updatedAt: "2026-03-11T05:00:00.000Z",
        source: "manual",
        skippedCount: 0,
        tabs: [{ id: "favorite-unsafe:0", title: "safe", url: "https://safe.example" }]
      }
    ]);
  });

  it("saves and sorts folders by createdAt descending", async () => {
    const storage = createMemoryStorage();

    await saveFolder(
      createSessionFolder({
        id: "older",
        name: "older",
        tabs: [{ id: "older:0", title: "A", url: "https://a.example" }]
      }),
      storage
    );
    await saveFolder(
      createSessionFolder({
        id: "newer",
        name: "newer",
        createdAt: "2026-03-11T06:00:00.000Z",
        updatedAt: "2026-03-11T06:00:00.000Z",
        skippedCount: 1,
        tabs: [{ id: "newer:0", title: "B", url: "https://b.example" }]
      }),
      storage
    );

    const folders = await getFolders(storage);

    expect(folders.map((folder) => folder.id)).toEqual(["newer", "older"]);
  });

  it("renames a folder and updates updatedAt", async () => {
    const storage = createMemoryStorage([createSessionFolder({ name: "원래 이름" })]);

    const folders = await renameFolder("folder-1", "변경된 이름", storage, new Date("2026-03-11T07:00:00.000Z"));

    expect(folders[0].name).toBe("변경된 이름");
    expect(folders[0].updatedAt).toBe("2026-03-11T07:00:00.000Z");
  });

  it("deletes a folder", async () => {
    const storage = createMemoryStorage([createSessionFolder({ name: "삭제 대상" })]);

    const folders = await deleteFolder("folder-1", storage);

    expect(folders).toEqual([]);
  });

  it("deletes a single tab from a folder and updates updatedAt", async () => {
    const storage = createMemoryStorage([
      createSessionFolder({
        name: "작업 탭",
        tabs: [
          { id: "tab-1", title: "A", url: "https://a.example" },
          { id: "tab-2", title: "B", url: "https://b.example" }
        ]
      })
    ]);

    const folders = await deleteTabFromFolder("folder-1", "tab-1", storage, new Date("2026-03-11T08:00:00.000Z"));

    expect(folders[0].tabs.map((tab) => tab.id)).toEqual(["tab-2"]);
    expect(folders[0].updatedAt).toBe("2026-03-11T08:00:00.000Z");
  });

  it("removes the folder when its last tab is deleted", async () => {
    const storage = createMemoryStorage([createSessionFolder({ name: "한 개 남음" })]);

    const folders = await deleteTabFromFolder("folder-1", "tab-1", storage);

    expect(folders).toEqual([]);
  });
});

describe("favorite folders", () => {
  it("creates an empty favorite folder", () => {
    const folder = createFavoriteFolder("   ", {
      createId: () => "favorite-1",
      now: new Date("2026-03-11T06:05:00.000Z")
    });

    expect(folder).toEqual({
      id: "favorite-1",
      kind: "favorite",
      name: formatFolderTimestamp(new Date("2026-03-11T06:05:00.000Z")),
      createdAt: "2026-03-11T06:05:00.000Z",
      updatedAt: "2026-03-11T06:05:00.000Z",
      source: "manual",
      skippedCount: 0,
      tabs: []
    });
  });

  it("previews favorite tab additions with duplicates and non-restorable tabs", () => {
    const preview = previewTabsForFavoriteFolder(
      createFavorite({
        tabs: [{ id: "favorite-1:0", title: "기존", url: "https://saved.example" }]
      }),
      [
        { title: "새 탭", url: "https://new.example" },
        { title: "중복", url: "https://saved.example" },
        { title: "설정", url: "chrome://settings" },
        { title: "새 탭 중복", url: "https://new.example" }
      ]
    );

    expect(preview).toEqual({
      addableCount: 1,
      duplicateCount: 1,
      skippedNonRestorableCount: 1,
      skippedSelectionDuplicateCount: 1
    });
  });

  it("adds tabs to a favorite folder and can overwrite duplicates", async () => {
    const storage = createMemoryStorage([
      createFavorite({
        tabs: [{ id: "favorite-1:0", title: "기존 제목", url: "https://saved.example" }]
      })
    ]);

    const firstPass = await addTabsToFavoriteFolder(
      "favorite-1",
      [
        { title: "새 탭", url: "https://new.example" },
        { title: "중복 제목", url: "https://saved.example" },
        { title: "설정", url: "chrome://settings" }
      ],
      {
        storageArea: storage,
        now: new Date("2026-03-11T09:00:00.000Z"),
        createTabId: (index) => `favorite-1:new:${index}`
      }
    );

    expect(firstPass.addedCount).toBe(1);
    expect(firstPass.updatedCount).toBe(0);
    expect(firstPass.skippedDuplicateCount).toBe(1);
    expect(firstPass.skippedNonRestorableCount).toBe(1);

    const secondPass = await addTabsToFavoriteFolder(
      "favorite-1",
      [{ title: "업데이트 제목", url: "https://saved.example" }],
      {
        storageArea: storage,
        overwriteDuplicates: true,
        now: new Date("2026-03-11T10:00:00.000Z"),
        createTabId: (index) => `favorite-1:overwrite:${index}`
      }
    );

    const favoriteFolder = secondPass.folders[0] as FavoriteTabFolder;

    expect(secondPass.addedCount).toBe(0);
    expect(secondPass.updatedCount).toBe(1);
    expect(favoriteFolder.tabs.map((tab) => tab.url)).toEqual(["https://saved.example", "https://new.example"]);
    expect(favoriteFolder.tabs[0].title).toBe("업데이트 제목");
    expect(favoriteFolder.updatedAt).toBe("2026-03-11T10:00:00.000Z");
  });
});
