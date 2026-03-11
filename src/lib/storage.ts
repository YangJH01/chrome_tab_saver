export const STORAGE_KEY = "tabFolders";

export type SavedTab = {
  id: string;
  title: string;
  url: string;
  favIconUrl?: string;
};

export type TabFolder = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  source: "current-window";
  skippedCount: number;
  duplicateCount?: number;
  tabs: SavedTab[];
};

type ChromeTabSnapshot = Pick<chrome.tabs.Tab, "favIconUrl" | "title" | "url">;

export type StorageAreaLike = {
  get: (keys?: string | string[] | Record<string, unknown> | null) => Promise<Record<string, unknown>>;
  set: (items: Record<string, unknown>) => Promise<void>;
};

function defaultStorageArea(): StorageAreaLike {
  return chrome.storage.local;
}

function sortFolders(folders: TabFolder[]): TabFolder[] {
  return [...folders].sort((left, right) => {
    const byCreatedAt = Date.parse(right.createdAt) - Date.parse(left.createdAt);

    if (byCreatedAt !== 0) {
      return byCreatedAt;
    }

    return Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
  });
}

function isSavedTab(value: unknown): value is SavedTab {
  if (!value || typeof value !== "object") {
    return false;
  }

  const tab = value as Partial<SavedTab>;
  return typeof tab.id === "string" && typeof tab.title === "string" && typeof tab.url === "string";
}

function isTabFolder(value: unknown): value is TabFolder {
  if (!value || typeof value !== "object") {
    return false;
  }

  const folder = value as Partial<TabFolder>;
  return (
    typeof folder.id === "string" &&
    typeof folder.name === "string" &&
    typeof folder.createdAt === "string" &&
    typeof folder.updatedAt === "string" &&
    folder.source === "current-window" &&
    typeof folder.skippedCount === "number" &&
    (typeof folder.duplicateCount === "undefined" || typeof folder.duplicateCount === "number") &&
    Array.isArray(folder.tabs) &&
    folder.tabs.every(isSavedTab)
  );
}

export function normalizeStoredFolders(value: unknown): TabFolder[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return sortFolders(value.filter(isTabFolder));
}

export function formatFolderTimestamp(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function formatStoredTimestamp(isoString: string, locale = "ko-KR"): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(isoString));
}

export function normalizeFolderName(name: string, fallbackLabel = formatFolderTimestamp()): string {
  const trimmed = name.trim();

  return trimmed.length > 0 ? trimmed : fallbackLabel;
}

export function isRestorableUrl(url?: string | null): url is string {
  return typeof url === "string" && /^https?:\/\//i.test(url);
}

export function getFolderSkipCounts(folder: TabFolder): {
  duplicateCount: number;
  nonRestorableCount: number;
} {
  const duplicateCount = folder.duplicateCount ?? 0;

  return {
    duplicateCount,
    nonRestorableCount: Math.max(0, folder.skippedCount - duplicateCount)
  };
}

export function buildFolderFromTabs(
  tabs: ChromeTabSnapshot[],
  requestedName: string,
  options?: {
    createId?: () => string;
    now?: Date;
  }
): TabFolder | null {
  const now = options?.now ?? new Date();
  const createId = options?.createId ?? (() => crypto.randomUUID());
  const folderId = createId();
  const seenUrls = new Set<string>();
  const restorableTabs: SavedTab[] = [];
  let nonRestorableCount = 0;
  let duplicateCount = 0;

  for (const tab of tabs) {
    if (!isRestorableUrl(tab.url)) {
      nonRestorableCount += 1;
      continue;
    }

    if (seenUrls.has(tab.url)) {
      duplicateCount += 1;
      continue;
    }

    seenUrls.add(tab.url);
    restorableTabs.push({
      id: `${folderId}:${restorableTabs.length}`,
      title: tab.title?.trim() || tab.url,
      url: tab.url,
      favIconUrl: tab.favIconUrl || undefined
    });
  }

  if (restorableTabs.length === 0) {
    return null;
  }

  const timestamp = now.toISOString();

  return {
    id: folderId,
    name: normalizeFolderName(requestedName, formatFolderTimestamp(now)),
    createdAt: timestamp,
    updatedAt: timestamp,
    source: "current-window",
    skippedCount: nonRestorableCount + duplicateCount,
    duplicateCount,
    tabs: restorableTabs
  };
}

export async function getFolders(storageArea: StorageAreaLike = defaultStorageArea()): Promise<TabFolder[]> {
  const stored = await storageArea.get(STORAGE_KEY);

  return normalizeStoredFolders(stored[STORAGE_KEY]);
}

async function writeFolders(
  folders: TabFolder[],
  storageArea: StorageAreaLike = defaultStorageArea()
): Promise<TabFolder[]> {
  const sortedFolders = sortFolders(folders);

  await storageArea.set({ [STORAGE_KEY]: sortedFolders });

  return sortedFolders;
}

export async function saveFolder(
  folder: TabFolder,
  storageArea: StorageAreaLike = defaultStorageArea()
): Promise<TabFolder[]> {
  const folders = await getFolders(storageArea);

  return writeFolders([folder, ...folders.filter((existingFolder) => existingFolder.id !== folder.id)], storageArea);
}

export async function renameFolder(
  folderId: string,
  name: string,
  storageArea: StorageAreaLike = defaultStorageArea(),
  now = new Date()
): Promise<TabFolder[]> {
  const folders = await getFolders(storageArea);
  const fallbackLabel = formatFolderTimestamp(now);
  const nextFolders = folders.map((folder) =>
    folder.id === folderId
      ? {
          ...folder,
          name: normalizeFolderName(name, fallbackLabel),
          updatedAt: now.toISOString()
        }
      : folder
  );

  return writeFolders(nextFolders, storageArea);
}

export async function deleteFolder(
  folderId: string,
  storageArea: StorageAreaLike = defaultStorageArea()
): Promise<TabFolder[]> {
  const folders = await getFolders(storageArea);

  return writeFolders(
    folders.filter((folder) => folder.id !== folderId),
    storageArea
  );
}

export async function deleteTabFromFolder(
  folderId: string,
  tabId: string,
  storageArea: StorageAreaLike = defaultStorageArea(),
  now = new Date()
): Promise<TabFolder[]> {
  const folders = await getFolders(storageArea);
  const nextFolders = folders.flatMap((folder) => {
    if (folder.id !== folderId) {
      return [folder];
    }

    const nextTabs = folder.tabs.filter((tab) => tab.id !== tabId);

    if (nextTabs.length === 0) {
      return [];
    }

    return [
      {
        ...folder,
        tabs: nextTabs,
        updatedAt: now.toISOString()
      }
    ];
  });

  return writeFolders(nextFolders, storageArea);
}
