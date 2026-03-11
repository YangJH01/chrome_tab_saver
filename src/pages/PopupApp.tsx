import { useEffect, useRef, useState } from "react";

import { UndoCountdownRing } from "../components/UndoCountdownRing";
import {
  getLocale,
  getMessages,
  getRestoreModeLabelByLanguage
} from "../lib/i18n";
import { restoreFolderTabs } from "../lib/restore";
import {
  buildFolderFromTabs,
  deleteTabFromFolder,
  deleteFolder,
  formatFolderTimestamp,
  formatStoredTimestamp,
  getFolderSkipCounts,
  saveFolder,
  type TabFolder
} from "../lib/storage";
import { useAppSettings } from "../lib/useAppSettings";
import {
  getNextVisibleFolderCount,
  getVisibleFolders,
  INITIAL_VISIBLE_FOLDER_COUNT,
  toggleExpandedFolder
} from "../lib/popupFolders";
import { useFolders } from "../lib/useFolders";

const ChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
);
const ChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
);
const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
);
const SaveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
);

export function createAfterSaveCleanupPlan(tabs: Pick<chrome.tabs.Tab, "id" | "windowId">[]) {
  const tabIdsToClose = tabs.flatMap((tab) => (typeof tab.id === "number" ? [tab.id] : []));
  const placeholderWindowId = tabIdsToClose.length > 0
    ? tabs.find((tab) => typeof tab.windowId === "number")?.windowId ?? null
    : null;

  return {
    placeholderWindowId,
    tabIdsToClose
  };
}

export function PopupApp() {
  const { error: loadError, folders, refresh } = useFolders();
  const { error: settingsError, settings } = useAppSettings();
  const messages = getMessages(settings.language);
  const locale = getLocale(settings.language);
  const [folderName, setFolderName] = useState(() => formatFolderTimestamp());
  const [saving, setSaving] = useState(false);
  const [busyFolderId, setBusyFolderId] = useState<string | null>(null);
  const [expandedFolderId, setExpandedFolderId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_FOLDER_COUNT);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [undoMessage, setUndoMessage] = useState<string | null>(null);
  const [undoAction, setUndoAction] = useState<(() => Promise<void>) | null>(null);
  const [undoSequence, setUndoSequence] = useState(0);
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<(() => Promise<void>) | null>(null);
  const undoTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setVisibleCount((count) => Math.max(count, INITIAL_VISIBLE_FOLDER_COUNT));
    setExpandedFolderId((id) => (id && folders.some((folder) => folder.id === id) ? id : null));
  }, [folders]);

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

  async function handleUndo() {
    if (!undoAction) return;
    const action = undoAction;
    if (undoTimerRef.current !== null) window.clearTimeout(undoTimerRef.current);
    setUndoMessage(null);
    setUndoAction(null);
    setFeedback(null);
    setError(null);
    try {
      await action();
      await refresh();
    } catch (caughtError) {
      console.error(caughtError);
      setError(messages.undoFailed);
    }
  }

  function openConfirm(message: string, action: () => Promise<void>) {
    setConfirmMessage(message);
    setConfirmAction(() => action);
  }

  function closeConfirm() {
    setConfirmMessage(null);
    setConfirmAction(null);
  }

  async function handleConfirm() {
    if (!confirmAction) return;

    const action = confirmAction;

    closeConfirm();
    await action();
  }

  async function handleSave() {
    setSaving(true);
    setFeedback(null);
    setError(null);
    try {
      const tabs = await chrome.tabs.query({ currentWindow: true });
      const folder = buildFolderFromTabs(tabs, folderName);

      if (!folder) {
        setError(messages.noTabsToSave);
        return;
      }

      await saveFolder(folder);
      await refresh();
      setFolderName(formatFolderTimestamp());

      if (settings.saveTabsBehavior === "close-tabs") {
        const cleanupPlan = createAfterSaveCleanupPlan(tabs);

        if (cleanupPlan.placeholderWindowId !== null) {
          await chrome.tabs.create({ active: false, windowId: cleanupPlan.placeholderWindowId });
        }

        if (cleanupPlan.tabIdsToClose.length > 0) {
          await chrome.tabs.remove(cleanupPlan.tabIdsToClose);
        }

        setFeedback(messages.saveSuccessAndClosed(folder.tabs.length));
        return;
      }

      setFeedback(messages.saveSuccess(folder.tabs.length));
    } catch (caughtError) {
      console.error(caughtError);
      setError(messages.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  async function handleRestore(folder: TabFolder) {
    setBusyFolderId(folder.id);
    setFeedback(null);
    setError(null);
    try {
      await restoreFolderTabs(folder, settings.defaultRestoreMode);
      setFeedback(messages.restoreSuccess(folder.name, getRestoreModeLabelByLanguage(settings.defaultRestoreMode, settings.language)));
    } catch (caughtError) {
      console.error(caughtError);
      setError(messages.restoreFailed);
    } finally {
      setBusyFolderId(null);
    }
  }

  async function handleDelete(folder: TabFolder) {
    openConfirm(messages.deleteFolderConfirm(folder.name), async () => {
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
        setExpandedFolderId((currentFolderId) => (currentFolderId === folder.id ? null : currentFolderId));
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

  async function handleOpenTabInCurrent(url: string, folderId: string) {
    setBusyFolderId(folderId);
    setFeedback(null);
    setError(null);

    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (activeTab?.id) {
        await chrome.tabs.update(activeTab.id, { url });
      } else {
        await chrome.tabs.create({ url });
      }
    } catch (caughtError) {
      console.error(caughtError);
      setError(messages.openInCurrentFailed);
    } finally {
      setBusyFolderId(null);
    }
  }

  const visibleFolders = getVisibleFolders(folders, visibleCount);
  const hasMore = visibleCount < folders.length;

  return (
    <main className="popup-shell">
      <section className="panel hero-panel">
        <p className="popup-kicker">{messages.popupKicker}</p>
        <h1 className="popup-title">Tab Save</h1>
        <p className="hero-copy">{messages.popupHeroCopy}</p>

        <div className="inline-field">
          <label>{messages.sessionName}</label>
          <div className="input-group">
            <input
              className="text-input"
              value={folderName}
              onChange={(event) => setFolderName(event.target.value)}
              placeholder={messages.sessionNamePlaceholder}
            />
            <button className="primary-button save-button" onClick={() => void handleSave()} disabled={saving} aria-label={messages.save}>
              {saving ? "..." : <SaveIcon />}
            </button>
          </div>
        </div>

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
      </section>

      <section className="panel recent-panel">
        <div className="section-heading popup-section-heading">
          <div>
            <p className="popup-section-kicker">{messages.recentFoldersKicker}</p>
            <h2 className="popup-section-title">{messages.recentFoldersTitle}</h2>
          </div>
          <button className="ghost-button compact-action-button" onClick={() => void chrome.runtime.openOptionsPage()}>
            {messages.manage}
          </button>
        </div>

        <ul className="folder-preview-list">
          {visibleFolders.map((folder) => {
            const isExpanded = expandedFolderId === folder.id;
            const { duplicateCount, nonRestorableCount } = getFolderSkipCounts(folder);
            return (
              <li key={folder.id} className="folder-preview-item">
                <div className="folder-preview-row">
                  <button
                    className="folder-toggle-button"
                    onClick={() => setExpandedFolderId((currentFolderId) => toggleExpandedFolder(currentFolderId, folder.id))}
                  >
                    <span className="folder-toggle-glyph">{isExpanded ? <ChevronDown /> : <ChevronRight />}</span>
                    <strong title={folder.name}>{folder.name}</strong>
                  </button>
                  <div className="folder-preview-actions">
                    <button className="secondary-button compact-action-button" onClick={() => void handleRestore(folder)}>
                      {messages.open}
                    </button>
                    <button className="ghost-button icon-action-button" onClick={() => void handleDelete(folder)} aria-label={messages.delete}>
                      <XIcon />
                    </button>
                  </div>
                </div>
                <div className="folder-preview-meta">
                  <span>{messages.tabsCount(folder.tabs.length)}</span>
                  <span>{formatStoredTimestamp(folder.createdAt, locale)}</span>
                  {duplicateCount > 0 ? <span>{messages.duplicateExcluded(duplicateCount)}</span> : null}
                  {nonRestorableCount > 0 ? <span>{messages.nonRestorableExcluded(nonRestorableCount)}</span> : null}
                </div>

                {isExpanded && (
                  <ul className="tab-list">
                    {folder.tabs.map((tab) => (
                      <li key={tab.id} className="tab-item">
                        {tab.favIconUrl ? <img className="favicon" src={tab.favIconUrl} alt="" /> : <div className="favicon favicon-fallback" />}
                        <div className="tab-content">
                          <button
                            className="tab-link-button"
                            onClick={() => void handleOpenTabInCurrent(tab.url, folder.id)}
                            disabled={busyFolderId === folder.id}
                            title={tab.title}
                          >
                            {tab.title}
                          </button>
                        </div>
                        <button
                          className="ghost-button icon-action-button"
                          onClick={() => void handleDeleteTab(folder, tab.id)}
                          disabled={busyFolderId === folder.id}
                          aria-label={messages.removeTabAria(tab.title)}
                        >
                          <XIcon />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>

        {hasMore && (
          <button className="ghost-button more-button" onClick={() => setVisibleCount((count) => getNextVisibleFolderCount(count, folders.length))}>
            {messages.loadMore}
          </button>
        )}
      </section>

      {confirmMessage && (
        <div className="confirm-overlay" role="presentation" onClick={closeConfirm}>
          <div className="confirm-dialog" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <p className="confirm-title">{messages.confirmTitle}</p>
            <p className="confirm-copy">{confirmMessage}</p>
            <div className="confirm-actions">
              <button className="ghost-button compact-action-button" onClick={closeConfirm}>
                {messages.cancel}
              </button>
              <button className="danger-button compact-action-button" onClick={() => void handleConfirm()}>
                {messages.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
