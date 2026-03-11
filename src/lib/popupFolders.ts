import type { TabFolder } from "./storage";

export const INITIAL_VISIBLE_FOLDER_COUNT = 3;
export const LOAD_MORE_FOLDER_COUNT = 10;

export function getVisibleFolders(folders: TabFolder[], visibleCount: number): TabFolder[] {
  return folders.slice(0, Math.max(INITIAL_VISIBLE_FOLDER_COUNT, visibleCount));
}

export function getNextVisibleFolderCount(currentVisibleCount: number, totalFolders: number): number {
  return Math.min(Math.max(INITIAL_VISIBLE_FOLDER_COUNT, currentVisibleCount) + LOAD_MORE_FOLDER_COUNT, totalFolders);
}

export function toggleExpandedFolder(currentExpandedFolderId: string | null, folderId: string): string | null {
  return currentExpandedFolderId === folderId ? null : folderId;
}
