import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  createTabSaveBackup,
  importTabSaveBackup,
  parseTabSaveBackup,
  serializeTabSaveBackup,
  type TabSaveBackup
} from "../lib/backup";
import { DEFAULT_APP_SETTINGS, SETTINGS_KEY, type AppSettings } from "../lib/settings";
import { STORAGE_KEY, type StorageAreaLike, type TabFolder } from "../lib/storage";

const sessionFolder: TabFolder = {
  id: "session-1",
  kind: "session",
  name: "이동할 세션",
  createdAt: "2026-09-03T01:00:00.000Z",
  updatedAt: "2026-09-03T01:00:00.000Z",
  source: "current-window",
  skippedCount: 0,
  tabs: [{ id: "session-1:0", title: "Example", url: "https://example.com" }]
};

function createMemoryStorage(seed?: {
  folders?: TabFolder[];
  settings?: AppSettings;
}) {
  const state: Record<string, unknown> = {
    [STORAGE_KEY]: structuredClone(seed?.folders ?? []),
    [SETTINGS_KEY]: structuredClone(seed?.settings ?? DEFAULT_APP_SETTINGS)
  };

  const storage: StorageAreaLike = {
    async get(keys) {
      if (typeof keys === "string") {
        return { [keys]: state[keys] };
      }

      return structuredClone(state);
    },
    async set(items) {
      Object.assign(state, structuredClone(items));
    }
  };

  return { state, storage };
}

describe("Tab Save backups", () => {
  it("exports folders and settings in a versioned JSON document", async () => {
    const { storage } = createMemoryStorage({
      folders: [sessionFolder],
      settings: { ...DEFAULT_APP_SETTINGS, language: "en", theme: "dark" }
    });

    const backup = await createTabSaveBackup(storage, new Date("2026-09-03T02:00:00.000Z"));
    const parsed = parseTabSaveBackup(serializeTabSaveBackup(backup));

    expect(parsed).toEqual({
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt: "2026-09-03T02:00:00.000Z",
      folders: [sessionFolder],
      settings: { ...DEFAULT_APP_SETTINGS, language: "en", theme: "dark" }
    });
  });

  it("replaces folders and settings together, including with an empty backup", async () => {
    const { state, storage } = createMemoryStorage({ folders: [sessionFolder] });
    const backup: TabSaveBackup = {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt: "2026-09-03T02:00:00.000Z",
      folders: [],
      settings: { ...DEFAULT_APP_SETTINGS, saveTabsBehavior: "close-tabs" }
    };

    await importTabSaveBackup(backup, storage);

    expect(state[STORAGE_KEY]).toEqual([]);
    expect(state[SETTINGS_KEY]).toEqual({
      ...DEFAULT_APP_SETTINGS,
      saveTabsBehavior: "close-tabs"
    });
  });

  it("rejects malformed, unsupported, or unsafe backups", () => {
    const validBackup = {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt: "2026-09-03T02:00:00.000Z",
      folders: [sessionFolder],
      settings: DEFAULT_APP_SETTINGS
    };

    expect(() => parseTabSaveBackup("not-json")).toThrow("Invalid backup JSON");
    expect(() => parseTabSaveBackup(JSON.stringify({ ...validBackup, version: 2 }))).toThrow("Invalid or unsupported");
    expect(() => parseTabSaveBackup(JSON.stringify({
      ...validBackup,
      folders: [{
        ...sessionFolder,
        tabs: [{ id: "unsafe", title: "Unsafe", url: "javascript:alert(1)" }]
      }]
    }))).toThrow("Invalid or unsupported");
  });
});
