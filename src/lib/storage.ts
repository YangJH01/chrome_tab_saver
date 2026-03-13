export const STORAGE_KEY = "tabFolders";

export type SavedTab = {
  id: string;
  title: string;
  url: string;
  favIconUrl?: string;
};

type BaseTabFolder = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  tabs: SavedTab[];
};

export type SessionTabFolder = BaseTabFolder & {
  kind: "session";
  source: "current-window";
  skippedCount: number;
  duplicateCount?: number;
};

export type FavoriteTabFolder = BaseTabFolder & {
  kind: "favorite";
  source: "manual";
  skippedCount: 0;
  duplicateCount?: 0;
};

export type TabFolder = SessionTabFolder | FavoriteTabFolder;

type ChromeTabSnapshot = Pick<chrome.tabs.Tab, "favIconUrl" | "title" | "url">;

type FolderDateOptions = {
  createId?: () => string;
  now?: Date;
};

type FavoriteFolderAnalysis = {
  additions: SavedTab[];
  updates: SavedTab[];
  skippedNonRestorableCount: number;
  skippedSelectionDuplicateCount: number;
  duplicateCount: number;
};

export type FavoriteFolderAddPreview = {
  addableCount: number;
  duplicateCount: number;
  skippedNonRestorableCount: number;
  skippedSelectionDuplicateCount: number;
};

export type AddTabsToFavoriteFolderResult = {
  folders: TabFolder[];
  addedCount: number;
  updatedCount: number;
  skippedDuplicateCount: number;
  skippedNonRestorableCount: number;
  skippedSelectionDuplicateCount: number;
};

export type StorageAreaLike = {
  get: (keys?: string | string[] | Record<string, unknown> | null) => Promise<Record<string, unknown>>;
  set: (items: Record<string, unknown>) => Promise<void>;
};

function defaultStorageArea(): StorageAreaLike {
  return chrome.storage.local;
}

function isFolderKind(value: unknown): value is TabFolder["kind"] {
  return value === "session" || value === "favorite";
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

export function isSessionFolder(folder: TabFolder): folder is SessionTabFolder {
  return folder.kind === "session";
}

export function isFavoriteFolder(folder: TabFolder): folder is FavoriteTabFolder {
  return folder.kind === "favorite";
}

function migrateStoredFolder(value: unknown): TabFolder | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const folder = value as Partial<TabFolder> & { kind?: unknown };
  const kind = isFolderKind(folder.kind)
    ? folder.kind
    : folder.source === "manual"
      ? "favorite"
      : "session";

  if (
    typeof folder.id !== "string" ||
    typeof folder.name !== "string" ||
    typeof folder.createdAt !== "string" ||
    typeof folder.updatedAt !== "string" ||
    !Array.isArray(folder.tabs)
  ) {
    return null;
  }

  const restorableTabs = folder.tabs.filter(isSavedTab).filter((tab) => isRestorableUrl(tab.url));

  if (kind === "favorite") {
    return {
      id: folder.id,
      kind,
      name: folder.name,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
      source: "manual",
      skippedCount: 0,
      tabs: restorableTabs
    };
  }

  if (
    folder.source !== "current-window" ||
    typeof folder.skippedCount !== "number" ||
    (typeof folder.duplicateCount !== "undefined" && typeof folder.duplicateCount !== "number") ||
    restorableTabs.length === 0
  ) {
    return null;
  }

  return {
    id: folder.id,
    kind,
    name: folder.name,
    createdAt: folder.createdAt,
    updatedAt: folder.updatedAt,
    source: "current-window",
    skippedCount: folder.skippedCount,
    duplicateCount: folder.duplicateCount,
    tabs: restorableTabs
  };
}

function isTabFolder(value: unknown): value is TabFolder {
  return migrateStoredFolder(value) !== null;
}

export function normalizeStoredFolders(value: unknown): TabFolder[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return sortFolders(value.flatMap((folder) => {
    const migratedFolder = migrateStoredFolder(folder);

    return migratedFolder ? [migratedFolder] : [];
  }));
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
  options?: FolderDateOptions
): SessionTabFolder | null {
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
    kind: "session",
    name: normalizeFolderName(requestedName, formatFolderTimestamp(now)),
    createdAt: timestamp,
    updatedAt: timestamp,
    source: "current-window",
    skippedCount: nonRestorableCount + duplicateCount,
    duplicateCount,
    tabs: restorableTabs
  };
}

export function createFavoriteFolder(
  requestedName: string,
  options?: FolderDateOptions
): FavoriteTabFolder {
  const now = options?.now ?? new Date();
  const createId = options?.createId ?? (() => crypto.randomUUID());
  const timestamp = now.toISOString();

  return {
    id: createId(),
    kind: "favorite",
    name: normalizeFolderName(requestedName, formatFolderTimestamp(now)),
    createdAt: timestamp,
    updatedAt: timestamp,
    source: "manual",
    skippedCount: 0,
    tabs: []
  };
}

function buildSavedTab(tab: ChromeTabSnapshot, id: string): SavedTab {
  return {
    id,
    title: tab.title?.trim() || tab.url || "",
    url: tab.url ?? "",
    favIconUrl: tab.favIconUrl || undefined
  };
}

function analyzeFavoriteFolderTabs(
  folder: FavoriteTabFolder,
  tabs: ChromeTabSnapshot[],
  createTabId: (index: number) => string
): FavoriteFolderAnalysis {
  const existingTabsByUrl = new Map(folder.tabs.map((tab) => [tab.url, tab]));
  const seenSelectionUrls = new Set<string>();
  const additions: SavedTab[] = [];
  const updates: SavedTab[] = [];
  let skippedNonRestorableCount = 0;
  let skippedSelectionDuplicateCount = 0;

  for (const tab of tabs) {
    if (!isRestorableUrl(tab.url)) {
      skippedNonRestorableCount += 1;
      continue;
    }

    if (seenSelectionUrls.has(tab.url)) {
      skippedSelectionDuplicateCount += 1;
      continue;
    }

    seenSelectionUrls.add(tab.url);

    const candidate = buildSavedTab(tab, createTabId(additions.length + updates.length));

    if (existingTabsByUrl.has(candidate.url)) {
      updates.push(candidate);
      continue;
    }

    additions.push(candidate);
  }

  return {
    additions,
    updates,
    skippedNonRestorableCount,
    skippedSelectionDuplicateCount,
    duplicateCount: updates.length
  };
}

export function previewTabsForFavoriteFolder(
  folder: FavoriteTabFolder,
  tabs: ChromeTabSnapshot[]
): FavoriteFolderAddPreview {
  const analysis = analyzeFavoriteFolderTabs(folder, tabs, (index) => `${folder.id}:preview:${index}`);

  return {
    addableCount: analysis.additions.length,
    duplicateCount: analysis.duplicateCount,
    skippedNonRestorableCount: analysis.skippedNonRestorableCount,
    skippedSelectionDuplicateCount: analysis.skippedSelectionDuplicateCount
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

export async function addTabsToFavoriteFolder(
  folderId: string,
  tabs: ChromeTabSnapshot[],
  options?: {
    overwriteDuplicates?: boolean;
    storageArea?: StorageAreaLike;
    now?: Date;
    createTabId?: (index: number) => string;
  }
): Promise<AddTabsToFavoriteFolderResult> {
  const storageArea = options?.storageArea ?? defaultStorageArea();
  const now = options?.now ?? new Date();
  const overwriteDuplicates = options?.overwriteDuplicates ?? false;
  const folders = await getFolders(storageArea);
  const targetFolder = folders.find((folder) => folder.id === folderId);

  if (!targetFolder || !isFavoriteFolder(targetFolder)) {
    throw new Error("즐겨찾기 폴더를 찾을 수 없습니다.");
  }

  const createTabId = options?.createTabId ?? ((index: number) => `${folderId}:${crypto.randomUUID()}:${index}`);
  const analysis = analyzeFavoriteFolderTabs(targetFolder, tabs, createTabId);

  const updatedTabsByUrl = new Map(analysis.updates.map((tab) => [tab.url, tab]));
  const nextTabs = targetFolder.tabs.flatMap((tab) => {
    const replacement = updatedTabsByUrl.get(tab.url);

    if (!replacement || !overwriteDuplicates) {
      return [tab];
    }

    return [
      {
        ...tab,
        title: replacement.title,
        favIconUrl: replacement.favIconUrl
      }
    ];
  });

  const appliedUpdates = overwriteDuplicates ? analysis.updates.length : 0;
  const nextFolder =
    analysis.additions.length > 0 || appliedUpdates > 0
      ? {
          ...targetFolder,
          tabs: [...nextTabs, ...analysis.additions],
          updatedAt: now.toISOString()
        }
      : targetFolder;

  const nextFolders = folders.map((folder) => (folder.id === folderId ? nextFolder : folder));
  const storedFolders =
    nextFolder === targetFolder
      ? folders
      : await writeFolders(nextFolders, storageArea);

  return {
    folders: storedFolders,
    addedCount: analysis.additions.length,
    updatedCount: appliedUpdates,
    skippedDuplicateCount: overwriteDuplicates ? 0 : analysis.duplicateCount,
    skippedNonRestorableCount: analysis.skippedNonRestorableCount,
    skippedSelectionDuplicateCount: analysis.skippedSelectionDuplicateCount
  };
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
