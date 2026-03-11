import {
  DEFAULT_APP_SETTINGS,
  SETTINGS_KEY,
  getSettings,
  normalizeSettings,
  resolveTheme,
  saveSettings,
  type AppSettings
} from "../lib/settings";
import type { StorageAreaLike } from "../lib/storage";

function createMemoryStorage(seedSettings?: AppSettings): StorageAreaLike {
  const state: Record<string, unknown> = {
    [SETTINGS_KEY]: seedSettings ? structuredClone(seedSettings) : undefined
  };

  return {
    async get(keys) {
      if (typeof keys === "string") {
        return { [keys]: state[keys] };
      }

      return { [SETTINGS_KEY]: state[SETTINGS_KEY] };
    },
    async set(items) {
      Object.assign(state, items);
    }
  };
}

describe("settings helpers", () => {
  it("falls back to defaults when settings are missing or invalid", () => {
    expect(normalizeSettings(undefined)).toEqual(DEFAULT_APP_SETTINGS);
    expect(normalizeSettings({ defaultRestoreMode: "wrong", saveTabsBehavior: "archive", theme: "sepia" })).toEqual(DEFAULT_APP_SETTINGS);
  });

  it("reads stored settings", async () => {
    const settings = await getSettings(
      createMemoryStorage({
        defaultRestoreMode: "current-tab",
        language: "en",
        saveTabsBehavior: "close-tabs",
        theme: "dark"
      })
    );

    expect(settings).toEqual({
      defaultRestoreMode: "current-tab",
      language: "en",
      saveTabsBehavior: "close-tabs",
      theme: "dark"
    });
  });

  it("merges partial updates with existing settings", async () => {
    const storage = createMemoryStorage({
      defaultRestoreMode: "current-tab",
      language: "ko",
      saveTabsBehavior: "keep-tabs",
      theme: "light"
    });

    const settings = await saveSettings({ saveTabsBehavior: "close-tabs", theme: "dark" }, storage);

    expect(settings).toEqual({
      defaultRestoreMode: "current-tab",
      language: "ko",
      saveTabsBehavior: "close-tabs",
      theme: "dark"
    });
  });

  it("resolves system theme using the current OS preference", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });
});
