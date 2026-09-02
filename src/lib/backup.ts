import {
  SETTINGS_KEY,
  getSettings,
  type AppSettings
} from "./settings";
import {
  STORAGE_KEY,
  getFolders,
  isRestorableUrl,
  normalizeStoredFolders,
  type StorageAreaLike,
  type TabFolder
} from "./storage";

export const BACKUP_FORMAT = "tab-save-backup";
export const BACKUP_VERSION = 1;

export type TabSaveBackup = {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  folders: TabFolder[];
  settings: AppSettings;
};

function defaultStorageArea(): StorageAreaLike {
  return chrome.storage.local;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isValidDate(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0;
}

function isValidSettings(value: unknown): value is AppSettings {
  if (!isRecord(value)) {
    return false;
  }

  return (
    (value.defaultRestoreMode === "new-tab" || value.defaultRestoreMode === "current-tab") &&
    (value.favoriteTabsBehavior === "keep-tabs" || value.favoriteTabsBehavior === "close-tabs") &&
    (value.language === "ko" || value.language === "en") &&
    (value.saveTabsBehavior === "keep-tabs" || value.saveTabsBehavior === "close-tabs") &&
    (value.theme === "system" || value.theme === "light" || value.theme === "dark")
  );
}

function isValidFolder(value: unknown): value is TabFolder {
  if (!isRecord(value) || !Array.isArray(value.tabs)) {
    return false;
  }

  if (
    typeof value.id !== "string" || value.id.length === 0 ||
    typeof value.name !== "string" || value.name.length === 0 ||
    !isValidDate(value.createdAt) ||
    !isValidDate(value.updatedAt)
  ) {
    return false;
  }

  const tabIds = new Set<string>();
  const validTabs = value.tabs.every((tab) => {
    if (
      !isRecord(tab) ||
      typeof tab.id !== "string" || tab.id.length === 0 ||
      typeof tab.title !== "string" ||
      !isRestorableUrl(typeof tab.url === "string" ? tab.url : undefined) ||
      (typeof tab.favIconUrl !== "undefined" && typeof tab.favIconUrl !== "string") ||
      tabIds.has(tab.id)
    ) {
      return false;
    }

    tabIds.add(tab.id);
    return true;
  });

  if (!validTabs) {
    return false;
  }

  if (value.kind === "favorite") {
    return (
      value.source === "manual" &&
      value.skippedCount === 0 &&
      (typeof value.duplicateCount === "undefined" || value.duplicateCount === 0)
    );
  }

  if (value.kind === "session") {
    return (
      value.source === "current-window" &&
      value.tabs.length > 0 &&
      isNonNegativeInteger(value.skippedCount) &&
      (typeof value.duplicateCount === "undefined" ||
        (isNonNegativeInteger(value.duplicateCount) && value.duplicateCount <= value.skippedCount))
    );
  }

  return false;
}

export async function createTabSaveBackup(
  storageArea: StorageAreaLike = defaultStorageArea(),
  now = new Date()
): Promise<TabSaveBackup> {
  const [folders, settings] = await Promise.all([
    getFolders(storageArea),
    getSettings(storageArea)
  ]);

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    folders,
    settings
  };
}

export function serializeTabSaveBackup(backup: TabSaveBackup): string {
  return `${JSON.stringify(backup, null, 2)}\n`;
}

export function parseTabSaveBackup(contents: string): TabSaveBackup {
  let candidate: unknown;

  try {
    candidate = JSON.parse(contents);
  } catch {
    throw new Error("Invalid backup JSON.");
  }

  if (
    !isRecord(candidate) ||
    candidate.format !== BACKUP_FORMAT ||
    candidate.version !== BACKUP_VERSION ||
    !isValidDate(candidate.exportedAt) ||
    !Array.isArray(candidate.folders) ||
    !candidate.folders.every(isValidFolder) ||
    !isValidSettings(candidate.settings)
  ) {
    throw new Error("Invalid or unsupported Tab Save backup.");
  }

  const folderIds = new Set(candidate.folders.map((folder) => folder.id));

  if (folderIds.size !== candidate.folders.length) {
    throw new Error("Backup contains duplicate folder IDs.");
  }

  const folders = normalizeStoredFolders(candidate.folders);

  if (folders.length !== candidate.folders.length) {
    throw new Error("Backup contains invalid folders.");
  }

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: candidate.exportedAt,
    folders,
    settings: candidate.settings
  };
}

export async function importTabSaveBackup(
  backup: TabSaveBackup,
  storageArea: StorageAreaLike = defaultStorageArea()
): Promise<void> {
  await storageArea.set({
    [STORAGE_KEY]: backup.folders,
    [SETTINGS_KEY]: backup.settings
  });
}
