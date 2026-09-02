import { type ChangeEvent, type KeyboardEvent, useEffect, useRef, useState } from "react";

import { UndoCountdownRing } from "../components/UndoCountdownRing";
import {
  createTabSaveBackup,
  importTabSaveBackup,
  parseTabSaveBackup,
  serializeTabSaveBackup
} from "../lib/backup";
import {
  getLanguageLabel,
  getMessages,
  getLocale,
  getRestoreModeLabelByLanguage,
  getSaveTabsBehaviorLabel,
  getThemeLabel
} from "../lib/i18n";
import { type RestoreMode, restoreFolderTabs } from "../lib/restore";
import { cleanupTabsInCurrentWindow } from "../lib/tabCleanup";
import {
  addTabsToFavoriteFolder,
  createFavoriteFolder,
  deleteTabFromFolder,
  deleteFolder,
  formatStoredTimestamp,
  isFavoriteFolder,
  isRestorableUrl,
  isSessionFolder,
  previewTabsForFavoriteFolder,
  renameFolder,
  saveFolder,
  type AddTabsToFavoriteFolderResult,
  type FavoriteTabFolder,
  type TabFolder
} from "../lib/storage";
import {
  type LanguageCode,
  type SaveTabsBehavior,
  type ThemeMode
} from "../lib/settings";
import { useAppSettings } from "../lib/useAppSettings";
import { useFolders } from "../lib/useFolders";

type ConfirmTone = "danger" | "primary";

type ConfirmState = {
  title: string;
  message: string;
  confirmLabel: string;
  tone: ConfirmTone;
  action: () => Promise<void>;
};

type SelectableCurrentTab = {
  key: string;
  tab: chrome.tabs.Tab;
  selectable: boolean;
};

type DuplicateResolutionState = {
  folderId: string;
  tabs: chrome.tabs.Tab[];
  duplicateCount: number;
};

function buildFavoriteAddFeedback(
  result: AddTabsToFavoriteFolderResult,
  messages: ReturnType<typeof getMessages>
): string {
  const parts: string[] = [];

  if (result.addedCount > 0 || result.updatedCount > 0) {
    parts.push(messages.favoriteTabsSaved(result.addedCount, result.updatedCount));
  }
  if (result.skippedDuplicateCount > 0) {
    parts.push(messages.favoriteTabsSkippedDuplicates(result.skippedDuplicateCount));
  }
  if (result.skippedSelectionDuplicateCount > 0) {
    parts.push(messages.favoriteTabsSkippedSelectionDuplicates(result.skippedSelectionDuplicateCount));
  }
  if (result.skippedNonRestorableCount > 0) {
    parts.push(messages.favoriteTabsSkippedNonRestorable(result.skippedNonRestorableCount));
  }

  return parts.join(" ").trim() || messages.favoriteTabsUnchanged;
}

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
);
const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
);
const ListIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
);
const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3.25"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 8.92 4.6H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c0 .67.39 1.27 1 1.51H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
);
const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2.5"/><path d="M12 19.5V22"/><path d="m4.93 4.93 1.77 1.77"/><path d="m17.3 17.3 1.77 1.77"/><path d="M2 12h2.5"/><path d="M19.5 12H22"/><path d="m4.93 19.07 1.77-1.77"/><path d="m17.3 6.7 1.77-1.77"/></svg>
);
const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3c0 4.97 4.03 9 9 9 .27 0 .53-.01.79-.04v.83z"/></svg>
);
const MonitorIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8"/><path d="M12 16v4"/></svg>
);
const LanguageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h12"/><path d="M10 5c0 6-2 10-6 14"/><path d="M8 11h8"/><path d="m14 19 4-10 4 10"/><path d="m15.5 15h5"/></svg>
);
const StackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 4 7l8 4 8-4-8-4Z"/><path d="m4 12 8 4 8-4"/><path d="m4 17 8 4 8-4"/></svg>
);
const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);

export function ManagerApp() {
  const { error: loadError, folders, loading, refresh } = useFolders();
  const { error: settingsError, settings, update } = useAppSettings();
  const messages = getMessages(settings.language);
  const locale = getLocale(settings.language);
  const sessionFolders = folders.filter(isSessionFolder);
  const favoriteFolders = folders.filter(isFavoriteFolder);
  const [draftNames, setDraftNames] = useState<Record<string, string>>({});
  const [restoreModes, setRestoreModes] = useState<Record<string, RestoreMode>>({});
  const [expandedFolderIds, setExpandedFolderIds] = useState<string[]>([]);
  const [busyFolderId, setBusyFolderId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [undoMessage, setUndoMessage] = useState<string | null>(null);
  const [undoAction, setUndoAction] = useState<(() => Promise<void>) | null>(null);
  const [undoSequence, setUndoSequence] = useState(0);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [createFavoriteOpen, setCreateFavoriteOpen] = useState(false);
  const [newFavoriteName, setNewFavoriteName] = useState("");
  const [pickerFolderId, setPickerFolderId] = useState<string | null>(null);
  const [pickerTabs, setPickerTabs] = useState<SelectableCurrentTab[]>([]);
  const [selectedTabKeys, setSelectedTabKeys] = useState<string[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [pickerBusy, setPickerBusy] = useState(false);
  const [duplicateResolution, setDuplicateResolution] = useState<DuplicateResolutionState | null>(null);
  const [backupBusy, setBackupBusy] = useState(false);
  const backupInputRef = useRef<HTMLInputElement>(null);
  const undoTimerRef = useRef<number | null>(null);
  const previousDefaultRestoreModeRef = useRef(settings.defaultRestoreMode);

  const pickerFolder = pickerFolderId ? favoriteFolders.find((folder) => folder.id === pickerFolderId) ?? null : null;
  const selectedCount = selectedTabKeys.length;
  const selectableCount = pickerTabs.filter((candidate) => candidate.selectable).length;
  const selectableTabKeys = pickerTabs.filter((candidate) => candidate.selectable).map((candidate) => candidate.key);
  const hasSelectedTabs = selectedTabKeys.length > 0;

  useEffect(() => {
    setDraftNames((currentDraftNames) => {
      const nextDraftNames: Record<string, string> = {};

      for (const folder of folders) {
        nextDraftNames[folder.id] = currentDraftNames[folder.id] ?? folder.name;
      }

      return nextDraftNames;
    });
    setRestoreModes((currentRestoreModes) => {
      const nextRestoreModes: Record<string, RestoreMode> = {};

      for (const folder of sessionFolders) {
        nextRestoreModes[folder.id] = currentRestoreModes[folder.id] ?? settings.defaultRestoreMode;
      }

      return nextRestoreModes;
    });
  }, [folders, settings.defaultRestoreMode]);

  useEffect(() => {
    const previousDefaultRestoreMode = previousDefaultRestoreModeRef.current;

    if (previousDefaultRestoreMode === settings.defaultRestoreMode) {
      return;
    }

    setRestoreModes((currentRestoreModes) => {
      const nextRestoreModes: Record<string, RestoreMode> = {};

      for (const folder of sessionFolders) {
        const currentRestoreMode = currentRestoreModes[folder.id];

        nextRestoreModes[folder.id] =
          !currentRestoreMode || currentRestoreMode === previousDefaultRestoreMode
            ? settings.defaultRestoreMode
            : currentRestoreMode;
      }

      return nextRestoreModes;
    });

    previousDefaultRestoreModeRef.current = settings.defaultRestoreMode;
  }, [folders, settings.defaultRestoreMode]);

  useEffect(() => {
    setExpandedFolderIds((currentFolderIds) => currentFolderIds.filter((folderId) => folders.some((folder) => folder.id === folderId)));
  }, [folders]);

  useEffect(() => {
    if (!pickerFolderId) {
      return;
    }

    if (!folders.some((folder) => folder.id === pickerFolderId && isFavoriteFolder(folder))) {
      closePicker();
    }
  }, [folders, pickerFolderId]);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current !== null) window.clearTimeout(undoTimerRef.current);
    };
  }, []);

  function queueUndoAction(message: string, action: () => Promise<void>) {
    if (undoTimerRef.current !== null) window.clearTimeout(undoTimerRef.current);
    setUndoMessage(message);
    setUndoAction(() => action);
    setUndoSequence((currentSequence) => currentSequence + 1);
    undoTimerRef.current = window.setTimeout(() => {
      setUndoMessage(null);
      setUndoAction(null);
      undoTimerRef.current = null;
    }, 5000);
  }

  function openConfirm(title: string, message: string, confirmLabel: string, tone: ConfirmTone, action: () => Promise<void>) {
    setConfirmState({ title, message, confirmLabel, tone, action });
  }

  function closeConfirm() {
    setConfirmState(null);
  }

  function closeCreateFavorite() {
    setCreateFavoriteOpen(false);
    setNewFavoriteName("");
  }

  function closePicker() {
    setPickerFolderId(null);
    setPickerTabs([]);
    setSelectedTabKeys([]);
    setPickerError(null);
    setPickerLoading(false);
    setPickerBusy(false);
    setDuplicateResolution(null);
  }

  async function handleUndo() {
    if (!undoAction) return;
    const restoreAction = undoAction;
    if (undoTimerRef.current !== null) window.clearTimeout(undoTimerRef.current);
    setUndoMessage(null);
    setUndoAction(null);
    setFeedback(null);
    setError(null);
    try {
      await restoreAction();
      await refresh();
    } catch (caughtError) {
      console.error(caughtError);
      setError(messages.undoFailed);
    }
  }

  async function handleConfirm() {
    if (!confirmState) return;

    const action = confirmState.action;

    closeConfirm();
    await action();
  }

  async function handleRename(folder: TabFolder) {
    setBusyFolderId(folder.id);
    setFeedback(null);
    setError(null);
    try {
      await renameFolder(folder.id, draftNames[folder.id] ?? folder.name);
      await refresh();
      setFeedback(messages.renameSuccess(draftNames[folder.id] ?? folder.name));
    } catch (caughtError) {
      console.error(caughtError);
      setError(messages.renameFailed);
    } finally {
      setBusyFolderId(null);
    }
  }

  async function handleDelete(folder: TabFolder) {
    openConfirm(messages.confirmTitle, messages.deleteFolderConfirm(folder.name), messages.delete, "danger", async () => {
      setBusyFolderId(folder.id);
      setFeedback(null);
      setError(null);
      try {
        await deleteFolder(folder.id);
        await refresh();
        queueUndoAction(messages.deleteSuccess(folder.name), async () => {
          await saveFolder(folder);
        });
      } catch (caughtError) {
        console.error(caughtError);
        setError(messages.deleteFailed);
      } finally {
        setBusyFolderId(null);
      }
    });
  }

  async function handleDeleteTab(folder: TabFolder, tabId: string) {
    const deletedTab = folder.tabs.find((tab) => tab.id === tabId);

    if (!deletedTab) return;

    setBusyFolderId(folder.id);
    setFeedback(null);
    setError(null);
    try {
      const nextFolders = await deleteTabFromFolder(folder.id, tabId);

      await refresh();

      if (!nextFolders.some((candidateFolder) => candidateFolder.id === folder.id)) {
        setExpandedFolderIds((currentFolderIds) => currentFolderIds.filter((folderId) => folderId !== folder.id));
        queueUndoAction(messages.deleteLastTab(folder.name), async () => {
          await saveFolder(folder);
        });
        return;
      }

      queueUndoAction(messages.deleteTabSuccess(deletedTab.title), async () => {
        await saveFolder(folder);
      });
    } catch (caughtError) {
      console.error(caughtError);
      setError(messages.deleteTabFailed);
    } finally {
      setBusyFolderId(null);
    }
  }

  function toggleExpandedFolder(folderId: string) {
    setExpandedFolderIds((currentFolderIds) => (
      currentFolderIds.includes(folderId)
        ? currentFolderIds.filter((currentFolderId) => currentFolderId !== folderId)
        : [...currentFolderIds, folderId]
    ));
  }

  async function handleRestore(folder: TabFolder, mode: RestoreMode) {
    setBusyFolderId(folder.id);
    setFeedback(null);
    setError(null);
    try {
      await restoreFolderTabs(folder, mode);
      setFeedback(messages.sessionRestoreSuccess(folder.name, getRestoreModeLabelByLanguage(mode, settings.language)));
    } catch (caughtError) {
      console.error(caughtError);
      setError(messages.restoreFailed);
    } finally {
      setBusyFolderId(null);
    }
  }

  async function handleCreateFavorite() {
    setBusyFolderId("create-favorite");
    setFeedback(null);
    setError(null);
    try {
      const folder = createFavoriteFolder(newFavoriteName);

      await saveFolder(folder);
      await refresh();
      closeCreateFavorite();
      setFeedback(messages.favoriteFolderCreateSuccess(folder.name));
    } catch (caughtError) {
      console.error(caughtError);
      setError(messages.favoriteFolderCreateFailed);
    } finally {
      setBusyFolderId(null);
    }
  }

  async function handleOpenTabPicker(folder: FavoriteTabFolder) {
    setPickerFolderId(folder.id);
    setPickerLoading(true);
    setPickerError(null);
    setPickerTabs([]);
    setSelectedTabKeys([]);
    setDuplicateResolution(null);
    try {
      const tabs = await chrome.tabs.query({ currentWindow: true });

      setPickerTabs(
        tabs.map((tab, index) => ({
          key: typeof tab.id === "number" ? String(tab.id) : `current-window-tab-${index}`,
          tab,
          selectable: isRestorableUrl(tab.url)
        }))
      );
    } catch (caughtError) {
      console.error(caughtError);
      setPickerError(messages.currentWindowTabsLoadFailed);
    } finally {
      setPickerLoading(false);
    }
  }

  async function applyFavoriteTabs(folderId: string, tabs: chrome.tabs.Tab[], overwriteDuplicates: boolean) {
    setBusyFolderId(folderId);
    setPickerBusy(true);
    setFeedback(null);
    setError(null);
    setPickerError(null);
    try {
      const result = await addTabsToFavoriteFolder(folderId, tabs, { overwriteDuplicates });

      if (settings.favoriteTabsBehavior === "close-tabs") {
        await cleanupTabsInCurrentWindow(
          pickerTabs.map((candidate) => candidate.tab),
          tabs
        );
      }

      await refresh();
      closePicker();
      setFeedback(buildFavoriteAddFeedback(result, messages));
    } catch (caughtError) {
      console.error(caughtError);
      setError(messages.favoriteTabsSaveFailed);
    } finally {
      setBusyFolderId(null);
      setPickerBusy(false);
    }
  }

  async function handleSubmitTabPicker() {
    if (!pickerFolder) {
      setPickerError(messages.favoriteFolderUnavailable);
      return;
    }

    const selectedTabs = pickerTabs
      .filter((candidate) => candidate.selectable && selectedTabKeys.includes(candidate.key))
      .map((candidate) => candidate.tab);

    if (selectedTabs.length === 0) {
      setPickerError(messages.selectTabsToAdd);
      return;
    }

    const preview = previewTabsForFavoriteFolder(pickerFolder, selectedTabs);

    if (preview.duplicateCount > 0) {
      setDuplicateResolution({
        folderId: pickerFolder.id,
        tabs: selectedTabs,
        duplicateCount: preview.duplicateCount
      });
      return;
    }

    await applyFavoriteTabs(pickerFolder.id, selectedTabs, false);
  }

  async function handleDefaultRestoreModeChange(mode: RestoreMode) {
    setFeedback(null);
    setError(null);
    try {
      await update({ defaultRestoreMode: mode });
      setFeedback(messages.defaultRestoreModeSaved(getRestoreModeLabelByLanguage(mode, settings.language)));
    } catch (caughtError) {
      console.error(caughtError);
      setError(messages.defaultRestoreModeFailed);
    }
  }

  async function handleThemeChange(theme: ThemeMode) {
    setFeedback(null);
    setError(null);
    try {
      await update({ theme });
      setFeedback(messages.themeSaved(getThemeLabel(theme, settings.language)));
    } catch (caughtError) {
      console.error(caughtError);
      setError(messages.themeFailed);
    }
  }

  async function handleLanguageChange(language: LanguageCode) {
    setFeedback(null);
    setError(null);
    try {
      await update({ language });
      setFeedback(messages.languageSaved(getLanguageLabel(language, settings.language)));
    } catch (caughtError) {
      console.error(caughtError);
      setError(messages.languageFailed);
    }
  }

  async function handleSaveTabsBehaviorChange(saveTabsBehavior: SaveTabsBehavior) {
    setFeedback(null);
    setError(null);
    try {
      await update({ saveTabsBehavior });
      setFeedback(messages.saveTabsBehaviorSaved(getSaveTabsBehaviorLabel(saveTabsBehavior, settings.language)));
    } catch (caughtError) {
      console.error(caughtError);
      setError(messages.saveTabsBehaviorFailed);
    }
  }

  async function handleFavoriteTabsBehaviorChange(favoriteTabsBehavior: SaveTabsBehavior) {
    setFeedback(null);
    setError(null);
    try {
      await update({ favoriteTabsBehavior });
      setFeedback(messages.favoriteTabsBehaviorSaved(getSaveTabsBehaviorLabel(favoriteTabsBehavior, settings.language)));
    } catch (caughtError) {
      console.error(caughtError);
      setError(messages.favoriteTabsBehaviorFailed);
    }
  }

  async function handleExportBackup() {
    setBackupBusy(true);
    setFeedback(null);
    setError(null);

    try {
      const backup = await createTabSaveBackup();
      const blob = new Blob([serializeTabSaveBackup(backup)], { type: "application/json" });
      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      try {
        anchor.href = downloadUrl;
        anchor.download = `tab-save-backup-${backup.exportedAt.slice(0, 10)}.json`;
        anchor.click();
      } finally {
        URL.revokeObjectURL(downloadUrl);
      }

      setSettingsOpen(false);
      setFeedback(messages.backupExportSuccess);
    } catch (caughtError) {
      console.error(caughtError);
      setSettingsOpen(false);
      setError(messages.backupExportFailed);
    } finally {
      setBackupBusy(false);
    }
  }

  async function handleImportBackupFile(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    setBackupBusy(true);
    setFeedback(null);
    setError(null);

    try {
      const backup = parseTabSaveBackup(await file.text());
      const tabCount = backup.folders.reduce((count, folder) => count + folder.tabs.length, 0);

      setSettingsOpen(false);
      openConfirm(
        messages.backupImportConfirmTitle,
        messages.backupImportConfirm(backup.folders.length, tabCount),
        messages.backupImportConfirmAction,
        "primary",
        async () => {
          setBackupBusy(true);
          setFeedback(null);
          setError(null);

          try {
            await importTabSaveBackup(backup);
            await refresh();
            setFeedback(messages.backupImportSuccess(backup.folders.length, tabCount));
          } catch (caughtError) {
            console.error(caughtError);
            setError(messages.backupImportFailed);
          } finally {
            setBackupBusy(false);
          }
        }
      );
    } catch (caughtError) {
      console.error(caughtError);
      setSettingsOpen(false);
      setError(messages.backupImportInvalid);
    } finally {
      input.value = "";
      setBackupBusy(false);
    }
  }

  function handleCreateFavoriteKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeCreateFavorite();
      return;
    }

    if (event.key === "Enter" && busyFolderId !== "create-favorite") {
      event.preventDefault();
      void handleCreateFavorite();
    }
  }

  return (
    <main className="manager-shell">
      <header className="manager-header">
        <div>
          <h1 className="manager-title">{messages.managerTitle}</h1>
          <p className="manager-subtitle">{messages.managerSubtitle}</p>
        </div>
        <div className="toolbar-actions">
          <button className="ghost-button" onClick={() => void refresh()}>
            <RefreshIcon />
            <span>{messages.refresh}</span>
          </button>
          <button
            className="ghost-button icon-action-button settings-trigger"
            onClick={() => setSettingsOpen(true)}
            aria-label={messages.openGlobalSettings}
            title={messages.openGlobalSettings}
          >
            <SettingsIcon />
          </button>
        </div>
      </header>

      {feedback && <p className="message success">{feedback}</p>}
      {error && <p className="message error">{error}</p>}
      {loadError && <p className="message error">{messages.foldersLoadFailed}</p>}
      {settingsError && <p className="message error">{messages.settingsLoadFailed}</p>}
      {undoMessage && (
        <div className="message undo-message">
          <span className="undo-copy">{undoMessage}</span>
          <div className="undo-actions">
            <UndoCountdownRing durationMs={5000} progressKey={undoSequence} />
            <button className="secondary-button compact-action-button" onClick={() => void handleUndo()}>
              {messages.undo}
            </button>
          </div>
        </div>
      )}

      {loading && <p className="empty-state">{messages.loading}</p>}

      <section className="library-section">
        <div className="manager-section-heading">
          <div>
            <p className="popup-section-kicker">{messages.favoriteFoldersKicker}</p>
            <h2 className="manager-section-title">{messages.favoriteFoldersTitle}</h2>
            <p className="manager-section-copy">{messages.favoriteFoldersSubtitle}</p>
          </div>
          <button className="secondary-button" onClick={() => setCreateFavoriteOpen(true)}>
            {messages.addFavoriteFolder}
          </button>
        </div>

        {!loading && favoriteFolders.length === 0 && (
          <div className="empty-panel compact-empty-panel">
            <p className="empty-state">{messages.favoriteFoldersEmpty}</p>
          </div>
        )}

        <section className="folder-grid">
          {favoriteFolders.map((folder) => {
            const isBusy = busyFolderId === folder.id;
            const isExpanded = expandedFolderIds.includes(folder.id);

            return (
              <article key={folder.id} className="panel folder-card">
                <div className="folder-card-top">
                  <div className="folder-card-info">
                    <h2 title={folder.name}>{folder.name}</h2>
                  </div>
                  <span className="pill">{messages.tabsCount(folder.tabs.length)}</span>
                </div>

                <div className="inline-field">
                  <label>{messages.renameLabel}</label>
                  <div className="input-group">
                    <input
                      className="text-input"
                      value={draftNames[folder.id] ?? folder.name}
                      onChange={(event) => setDraftNames({ ...draftNames, [folder.id]: event.target.value })}
                    />
                    <button className="secondary-button" onClick={() => void handleRename(folder)} disabled={isBusy}>
                      {messages.save}
                    </button>
                  </div>
                </div>

                <dl className="meta-row">
                  <div className="meta-item">
                    <dt>{messages.savedAt}</dt>
                    <dd>{formatStoredTimestamp(folder.createdAt, locale)}</dd>
                  </div>
                  <div className="meta-item">
                    <dt>{messages.updatedAt}</dt>
                    <dd>{formatStoredTimestamp(folder.updatedAt, locale)}</dd>
                  </div>
                </dl>

                <div className="card-actions wide-card-actions">
                  <button className="secondary-button" onClick={() => void handleOpenTabPicker(folder)} disabled={isBusy}>
                    <span>{messages.addTabs}</span>
                  </button>
                  <button
                    className="primary-button restore-action-button"
                    onClick={() => void handleRestore(folder, settings.defaultRestoreMode)}
                    disabled={isBusy || folder.tabs.length === 0}
                  >
                    <span>{messages.restoreNow}</span>
                  </button>
                  <button className="ghost-button" onClick={() => toggleExpandedFolder(folder.id)} aria-label={messages.managerTitle}>
                    <ListIcon />
                  </button>
                  <button className="danger-button" onClick={() => void handleDelete(folder)} disabled={isBusy} aria-label={messages.delete}>
                    <TrashIcon />
                  </button>
                </div>

                {isExpanded && (
                  folder.tabs.length > 0 ? (
                    <ul className="tab-list">
                      {folder.tabs.map((tab) => (
                        <li key={tab.id} className="tab-item">
                          {tab.favIconUrl ? <img className="favicon" src={tab.favIconUrl} alt="" /> : <div className="favicon favicon-fallback" />}
                          <div className="tab-content">
                            <strong title={tab.title}>{tab.title}</strong>
                            <a href={tab.url} target="_blank" rel="noreferrer" title={tab.url}>{tab.url}</a>
                          </div>
                          <button
                            className="ghost-button icon-action-button"
                            onClick={() => void handleDeleteTab(folder, tab.id)}
                            disabled={isBusy}
                            aria-label={messages.removeTabAria(tab.title)}
                          >
                            <TrashIcon />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="folder-inline-empty">
                      <p>{messages.favoriteFolderEmptyHint}</p>
                    </div>
                  )
                )}
              </article>
            );
          })}
        </section>
      </section>

      <section className="library-section">
        <div className="manager-section-heading">
          <div>
            <p className="popup-section-kicker">{messages.sessionsKicker}</p>
            <h2 className="manager-section-title">{messages.sessionsTitle}</h2>
            <p className="manager-section-copy">{messages.sessionsSubtitle}</p>
          </div>
        </div>

        {!loading && sessionFolders.length === 0 && (
          <div className="empty-panel compact-empty-panel">
            <p className="empty-state">{messages.noSavedSessions}</p>
          </div>
        )}

        <section className="folder-grid">
          {sessionFolders.map((folder) => {
            const isBusy = busyFolderId === folder.id;
            const isExpanded = expandedFolderIds.includes(folder.id);

            return (
              <article key={folder.id} className="panel folder-card">
                <div className="folder-card-top">
                  <div className="folder-card-info">
                    <h2 title={folder.name}>{folder.name}</h2>
                  </div>
                  <span className="pill">{messages.tabsCount(folder.tabs.length)}</span>
                </div>

                <div className="inline-field">
                  <label>{messages.renameLabel}</label>
                  <div className="input-group">
                    <input
                      className="text-input"
                      value={draftNames[folder.id] ?? folder.name}
                      onChange={(event) => setDraftNames({ ...draftNames, [folder.id]: event.target.value })}
                    />
                    <button className="secondary-button" onClick={() => void handleRename(folder)} disabled={isBusy}>
                      {messages.save}
                    </button>
                  </div>
                </div>

                <dl className="meta-row">
                  <div className="meta-item">
                    <dt>{messages.savedAt}</dt>
                    <dd>{formatStoredTimestamp(folder.createdAt, locale)}</dd>
                  </div>
                  <div className="meta-item">
                    <dt>{messages.restoreMode}</dt>
                    <dd>
                      <select
                        className="select-input"
                        value={restoreModes[folder.id] ?? settings.defaultRestoreMode}
                        onChange={(event) => setRestoreModes({ ...restoreModes, [folder.id]: event.target.value as RestoreMode })}
                      >
                        <option value="new-tab">{messages.newTabTitle}</option>
                        <option value="current-tab">{messages.currentTabTitle}</option>
                      </select>
                    </dd>
                  </div>
                </dl>

                <div className="card-actions">
                  <button
                    className="primary-button restore-action-button"
                    onClick={() => void handleRestore(folder, restoreModes[folder.id] ?? settings.defaultRestoreMode)}
                    disabled={isBusy}
                  >
                    <span>{messages.restoreNow}</span>
                  </button>
                  <button className="ghost-button" onClick={() => toggleExpandedFolder(folder.id)} aria-label={messages.managerTitle}>
                    <ListIcon />
                  </button>
                  <button className="danger-button" onClick={() => void handleDelete(folder)} disabled={isBusy} aria-label={messages.delete}>
                    <TrashIcon />
                  </button>
                </div>

                {isExpanded && (
                  <ul className="tab-list">
                    {folder.tabs.map((tab) => (
                      <li key={tab.id} className="tab-item">
                        {tab.favIconUrl ? <img className="favicon" src={tab.favIconUrl} alt="" /> : <div className="favicon favicon-fallback" />}
                        <div className="tab-content">
                          <strong title={tab.title}>{tab.title}</strong>
                          <a href={tab.url} target="_blank" rel="noreferrer" title={tab.url}>{tab.url}</a>
                        </div>
                        <button
                          className="ghost-button icon-action-button"
                          onClick={() => void handleDeleteTab(folder, tab.id)}
                          disabled={isBusy}
                          aria-label={messages.removeTabAria(tab.title)}
                        >
                          <TrashIcon />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            );
          })}
        </section>
      </section>

      {createFavoriteOpen && (
        <div className="confirm-overlay" role="presentation" onClick={closeCreateFavorite}>
          <div className="confirm-dialog form-dialog" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <p className="confirm-title">{messages.createFavoriteFolderTitle}</p>
            <div className="inline-field">
              <label>{messages.favoriteFolderName}</label>
              <input
                autoFocus
                className="text-input"
                value={newFavoriteName}
                onChange={(event) => setNewFavoriteName(event.target.value)}
                onKeyDown={handleCreateFavoriteKeyDown}
                placeholder={messages.favoriteFolderNamePlaceholder}
              />
            </div>
            <div className="confirm-actions">
              <button className="ghost-button compact-action-button" onClick={closeCreateFavorite}>
                {messages.cancel}
              </button>
              <button
                className="primary-button compact-action-button"
                onClick={() => void handleCreateFavorite()}
                disabled={busyFolderId === "create-favorite"}
              >
                {messages.create}
              </button>
            </div>
          </div>
        </div>
      )}

      {pickerFolder && (
        <div className="confirm-overlay" role="presentation" onClick={closePicker}>
          <div className="selection-dialog" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="settings-header">
              <div>
                <p className="popup-section-kicker">{messages.addTabsKicker}</p>
                <h2 className="settings-title">{messages.addTabsDialogTitle(pickerFolder.name)}</h2>
              </div>
              <button className="ghost-button icon-action-button" onClick={closePicker} aria-label={messages.cancel}>
                <CloseIcon />
              </button>
            </div>

            <div className="selection-summary">
              <p className="manager-section-copy">{messages.addTabsDialogDescription}</p>
              <div className="selection-summary-actions">
                <span className="pill">{messages.selectedTabsCount(selectedCount, selectableCount)}</span>
                <button
                  className="ghost-button compact-action-button"
                  onClick={() => setSelectedTabKeys(hasSelectedTabs ? [] : selectableTabKeys)}
                  disabled={pickerBusy || pickerLoading || selectableCount === 0}
                >
                  {hasSelectedTabs ? messages.clearSelectedTabs : messages.selectAllTabs}
                </button>
              </div>
            </div>

            {pickerLoading ? <p className="empty-state">{messages.loading}</p> : null}
            {!pickerLoading && pickerTabs.length === 0 ? <p className="empty-state">{messages.currentWindowTabsEmpty}</p> : null}

            {!pickerLoading && pickerTabs.length > 0 && (
              <ul className="selection-list">
                {pickerTabs.map((candidate) => {
                  const checked = selectedTabKeys.includes(candidate.key);
                  const title = candidate.tab.title?.trim() || candidate.tab.url || messages.untitledTab;
                  const subtitle = candidate.tab.url || messages.nonRestorableTab;

                  return (
                    <li key={candidate.key}>
                      <label className={`selection-item ${candidate.selectable ? "" : "is-disabled"}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!candidate.selectable || pickerBusy}
                          onChange={() => setSelectedTabKeys((currentKeys) => (
                            checked ? currentKeys.filter((key) => key !== candidate.key) : [...currentKeys, candidate.key]
                          ))}
                        />
                        {candidate.tab.favIconUrl ? (
                          <img className="favicon selection-favicon" src={candidate.tab.favIconUrl} alt="" />
                        ) : (
                          <div className="favicon favicon-fallback selection-favicon" />
                        )}
                        <div className="selection-copy">
                          <strong title={title}>{title}</strong>
                          <span title={subtitle}>{subtitle}</span>
                        </div>
                        {!candidate.selectable ? <em>{messages.nonRestorableBadge}</em> : null}
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}

            {pickerError && <p className="message error">{pickerError}</p>}

            <div className="confirm-actions">
              <button className="ghost-button compact-action-button" onClick={closePicker}>
                {messages.cancel}
              </button>
              <button
                className="primary-button compact-action-button"
                onClick={() => void handleSubmitTabPicker()}
                disabled={pickerBusy || pickerLoading || selectableCount === 0}
              >
                {messages.addSelectedTabs}
              </button>
            </div>
          </div>
        </div>
      )}

      {duplicateResolution && pickerFolder && (
        <div className="confirm-overlay front-overlay" role="presentation" onClick={() => setDuplicateResolution(null)}>
          <div className="confirm-dialog" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <p className="confirm-title">{messages.duplicateTabsTitle}</p>
            <p className="confirm-copy">{messages.duplicateTabsConfirm(pickerFolder.name, duplicateResolution.duplicateCount)}</p>
            <div className="confirm-actions">
              <button className="ghost-button compact-action-button" onClick={() => setDuplicateResolution(null)}>
                {messages.cancel}
              </button>
              <button
                className="secondary-button compact-action-button"
                onClick={() => void applyFavoriteTabs(duplicateResolution.folderId, duplicateResolution.tabs, false)}
                disabled={pickerBusy}
              >
                {messages.skipDuplicates}
              </button>
              <button
                className="primary-button compact-action-button"
                onClick={() => void applyFavoriteTabs(duplicateResolution.folderId, duplicateResolution.tabs, true)}
                disabled={pickerBusy}
              >
                {messages.overwrite}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmState && (
        <div className="confirm-overlay" role="presentation" onClick={closeConfirm}>
          <div className="confirm-dialog" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <p className="confirm-title">{confirmState.title}</p>
            <p className="confirm-copy">{confirmState.message}</p>
            <div className="confirm-actions">
              <button className="ghost-button compact-action-button" onClick={closeConfirm}>
                {messages.cancel}
              </button>
              <button
                className={`${confirmState.tone === "danger" ? "danger-button" : "primary-button"} compact-action-button`}
                onClick={() => void handleConfirm()}
              >
                {confirmState.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {settingsOpen && (
        <div className="confirm-overlay" role="presentation" onClick={() => setSettingsOpen(false)}>
          <div className="settings-dialog" role="dialog" aria-modal="true" aria-label={messages.globalSettingsTitle} onClick={(event) => event.stopPropagation()}>
            <div className="settings-header">
              <div>
                <p className="popup-section-kicker">{messages.globalSettingsKicker}</p>
                <h2 className="settings-title">{messages.globalSettingsTitle}</h2>
              </div>
              <button className="ghost-button icon-action-button" onClick={() => setSettingsOpen(false)} aria-label={messages.closeSettings}>
                <CloseIcon />
              </button>
            </div>

            <section className="settings-section">
              <div className="settings-copy">
                <strong>{messages.defaultRestoreModeTitle}</strong>
                <p>{messages.defaultRestoreModeDescription}</p>
              </div>
              <div className="settings-choice-grid">
                <button
                  className={`setting-choice ${settings.defaultRestoreMode === "new-tab" ? "is-active" : ""}`}
                  onClick={() => void handleDefaultRestoreModeChange("new-tab")}
                >
                  <span>{messages.newTabTitle}</span>
                  <small>{messages.newTabDescription}</small>
                </button>
                <button
                  className={`setting-choice ${settings.defaultRestoreMode === "current-tab" ? "is-active" : ""}`}
                  onClick={() => void handleDefaultRestoreModeChange("current-tab")}
                >
                  <span>{messages.currentTabTitle}</span>
                  <small>{messages.currentTabDescription}</small>
                </button>
              </div>
            </section>

            <section className="settings-section">
              <div className="settings-copy">
                <strong>{messages.saveTabsBehaviorTitle}</strong>
                <p>{messages.saveTabsBehaviorDescription}</p>
              </div>
              <div className="settings-choice-grid">
                <button
                  className={`setting-choice ${settings.saveTabsBehavior === "keep-tabs" ? "is-active" : ""}`}
                  onClick={() => void handleSaveTabsBehaviorChange("keep-tabs")}
                >
                  <span className="setting-choice-title">
                    <StackIcon />
                    <span>{messages.saveTabsKeep}</span>
                  </span>
                  <small>{messages.saveTabsKeepDescription}</small>
                </button>
                <button
                  className={`setting-choice ${settings.saveTabsBehavior === "close-tabs" ? "is-active" : ""}`}
                  onClick={() => void handleSaveTabsBehaviorChange("close-tabs")}
                >
                  <span className="setting-choice-title">
                    <StackIcon />
                    <span>{messages.saveTabsClose}</span>
                  </span>
                  <small>{messages.saveTabsCloseDescription}</small>
                </button>
              </div>
            </section>

            <section className="settings-section">
              <div className="settings-copy">
                <strong>{messages.favoriteTabsBehaviorTitle}</strong>
                <p>{messages.favoriteTabsBehaviorDescription}</p>
              </div>
              <div className="settings-choice-grid">
                <button
                  className={`setting-choice ${settings.favoriteTabsBehavior === "keep-tabs" ? "is-active" : ""}`}
                  onClick={() => void handleFavoriteTabsBehaviorChange("keep-tabs")}
                >
                  <span className="setting-choice-title">
                    <StackIcon />
                    <span>{messages.saveTabsKeep}</span>
                  </span>
                  <small>{messages.favoriteTabsKeepDescription}</small>
                </button>
                <button
                  className={`setting-choice ${settings.favoriteTabsBehavior === "close-tabs" ? "is-active" : ""}`}
                  onClick={() => void handleFavoriteTabsBehaviorChange("close-tabs")}
                >
                  <span className="setting-choice-title">
                    <StackIcon />
                    <span>{messages.saveTabsClose}</span>
                  </span>
                  <small>{messages.favoriteTabsCloseDescription}</small>
                </button>
              </div>
            </section>

            <section className="settings-section">
              <div className="settings-copy">
                <strong>{messages.themeTitle}</strong>
                <p>{messages.themeDescription}</p>
              </div>
              <div className="theme-toggle-row">
                <button
                  className={`theme-option ${settings.theme === "system" ? "is-active" : ""}`}
                  onClick={() => void handleThemeChange("system")}
                  aria-label={messages.themeSystem}
                  title={messages.themeSystem}
                >
                  <MonitorIcon />
                  <span>{messages.themeSystem}</span>
                </button>
                <button
                  className={`theme-option ${settings.theme === "light" ? "is-active" : ""}`}
                  onClick={() => void handleThemeChange("light")}
                  aria-label={messages.themeLight}
                  title={messages.themeLight}
                >
                  <SunIcon />
                  <span>{messages.themeLight}</span>
                </button>
                <button
                  className={`theme-option ${settings.theme === "dark" ? "is-active" : ""}`}
                  onClick={() => void handleThemeChange("dark")}
                  aria-label={messages.themeDark}
                  title={messages.themeDark}
                >
                  <MoonIcon />
                  <span>{messages.themeDark}</span>
                </button>
              </div>
            </section>

            <section className="settings-section">
              <div className="settings-copy">
                <strong>{messages.languageTitle}</strong>
                <p>{messages.languageDescription}</p>
              </div>
              <div className="settings-choice-grid">
                <button
                  className={`setting-choice ${settings.language === "ko" ? "is-active" : ""}`}
                  onClick={() => void handleLanguageChange("ko")}
                >
                  <span className="setting-choice-title">
                    <LanguageIcon />
                    <span>{messages.languageKorean}</span>
                  </span>
                  <small>{messages.languageKoreanDescription}</small>
                </button>
                <button
                  className={`setting-choice ${settings.language === "en" ? "is-active" : ""}`}
                  onClick={() => void handleLanguageChange("en")}
                >
                  <span className="setting-choice-title">
                    <LanguageIcon />
                    <span>{messages.languageEnglish}</span>
                  </span>
                  <small>{messages.languageEnglishDescription}</small>
                </button>
              </div>
            </section>

            <section className="settings-section">
              <div className="settings-copy">
                <strong>{messages.backupTitle}</strong>
                <p>{messages.backupDescription}</p>
              </div>
              <div className="backup-actions">
                <button
                  className="secondary-button"
                  onClick={() => void handleExportBackup()}
                  disabled={backupBusy}
                >
                  {messages.backupExport}
                </button>
                <button
                  className="primary-button"
                  onClick={() => backupInputRef.current?.click()}
                  disabled={backupBusy}
                >
                  {messages.backupImport}
                </button>
                <input
                  ref={backupInputRef}
                  type="file"
                  accept="application/json,.json"
                  hidden
                  onChange={(event) => void handleImportBackupFile(event)}
                />
              </div>
            </section>
          </div>
        </div>
      )}
    </main>
  );
}
