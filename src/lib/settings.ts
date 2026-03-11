import { DEFAULT_RESTORE_MODE, type RestoreMode } from "./restore";
import type { StorageAreaLike } from "./storage";

export const SETTINGS_KEY = "tabSaveSettings";

export type ThemeMode = "light" | "dark" | "system";
export type LanguageCode = "ko" | "en";
export type SaveTabsBehavior = "keep-tabs" | "close-tabs";

export type AppSettings = {
  defaultRestoreMode: RestoreMode;
  language: LanguageCode;
  saveTabsBehavior: SaveTabsBehavior;
  theme: ThemeMode;
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  defaultRestoreMode: DEFAULT_RESTORE_MODE,
  language: "ko",
  saveTabsBehavior: "keep-tabs",
  theme: "system"
};

function defaultStorageArea(): StorageAreaLike {
  return chrome.storage.local;
}

function isThemeMode(value: unknown): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}

function isLanguageCode(value: unknown): value is LanguageCode {
  return value === "ko" || value === "en";
}

function isSaveTabsBehavior(value: unknown): value is SaveTabsBehavior {
  return value === "keep-tabs" || value === "close-tabs";
}

function isRestoreMode(value: unknown): value is RestoreMode {
  return value === "new-tab" || value === "current-tab";
}

export function normalizeSettings(value: unknown): AppSettings {
  if (!value || typeof value !== "object") {
    return DEFAULT_APP_SETTINGS;
  }

  const candidate = value as Partial<AppSettings>;

  return {
    defaultRestoreMode: isRestoreMode(candidate.defaultRestoreMode)
      ? candidate.defaultRestoreMode
      : DEFAULT_APP_SETTINGS.defaultRestoreMode,
    language: isLanguageCode(candidate.language) ? candidate.language : DEFAULT_APP_SETTINGS.language,
    saveTabsBehavior: isSaveTabsBehavior(candidate.saveTabsBehavior)
      ? candidate.saveTabsBehavior
      : DEFAULT_APP_SETTINGS.saveTabsBehavior,
    theme: isThemeMode(candidate.theme) ? candidate.theme : DEFAULT_APP_SETTINGS.theme
  };
}

export async function getSettings(storageArea: StorageAreaLike = defaultStorageArea()): Promise<AppSettings> {
  const stored = await storageArea.get(SETTINGS_KEY);

  return normalizeSettings(stored[SETTINGS_KEY]);
}

export async function saveSettings(
  partialSettings: Partial<AppSettings>,
  storageArea: StorageAreaLike = defaultStorageArea()
): Promise<AppSettings> {
  const currentSettings = await getSettings(storageArea);
  const nextSettings = normalizeSettings({ ...currentSettings, ...partialSettings });

  await storageArea.set({ [SETTINGS_KEY]: nextSettings });

  return nextSettings;
}

export function applyTheme(theme: ThemeMode, root: HTMLElement = document.documentElement): void {
  root.dataset.theme = resolveTheme(theme);
}

export function applyLanguage(language: LanguageCode, root: HTMLElement = document.documentElement): void {
  root.lang = language;
}

export function resolveTheme(theme: ThemeMode, prefersDark = getSystemPrefersDark()): Exclude<ThemeMode, "system"> {
  if (theme === "system") {
    return prefersDark ? "dark" : "light";
  }

  return theme;
}

function getSystemPrefersDark(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
    : false;
}
