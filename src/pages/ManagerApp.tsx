import { useEffect, useRef, useState } from "react";

import { UndoCountdownRing } from "../components/UndoCountdownRing";
import {
  getLanguageLabel,
  getMessages,
  getLocale,
  getRestoreModeLabelByLanguage,
  getSaveTabsBehaviorLabel,
  getThemeLabel
} from "../lib/i18n";
import { type RestoreMode, restoreFolderTabs } from "../lib/restore";
import {
  type LanguageCode,
  type SaveTabsBehavior,
  type ThemeMode
} from "../lib/settings";
import {
  deleteFolder,
  formatStoredTimestamp,
  renameFolder,
  saveFolder,
  type TabFolder
} from "../lib/storage";
import { useAppSettings } from "../lib/useAppSettings";
import { useFolders } from "../lib/useFolders";

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
  const [draftNames, setDraftNames] = useState<Record<string, string>>({});
  const [restoreModes, setRestoreModes] = useState<Record<string, RestoreMode>>({});
  const [expandedFolderId, setExpandedFolderId] = useState<string | null>(null);
  const [busyFolderId, setBusyFolderId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [undoMessage, setUndoMessage] = useState<string | null>(null);
  const [undoAction, setUndoAction] = useState<(() => Promise<void>) | null>(null);
  const [undoSequence, setUndoSequence] = useState(0);
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<(() => Promise<void>) | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const undoTimerRef = useRef<number | null>(null);
  const previousDefaultRestoreModeRef = useRef(settings.defaultRestoreMode);

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

      for (const folder of folders) {
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

      for (const folder of folders) {
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

  async function handleRename(folder: TabFolder) {
    setBusyFolderId(folder.id);
    setFeedback(null);
    setError(null);
    try {
      await renameFolder(folder.id, draftNames[folder.id] ?? folder.name);
      await refresh();
      setFeedback(messages.renameSuccess(folder.name));
    } catch (caughtError) {
      console.error(caughtError);
      setError(messages.renameFailed);
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

  async function handleRestore(folder: TabFolder) {
    setBusyFolderId(folder.id);
    setFeedback(null);
    setError(null);
    try {
      const mode = restoreModes[folder.id] ?? settings.defaultRestoreMode;
      await restoreFolderTabs(folder, mode);
      setFeedback(messages.sessionRestoreSuccess(folder.name, getRestoreModeLabelByLanguage(mode, settings.language)));
    } catch (caughtError) {
      console.error(caughtError);
      setError(messages.restoreFailed);
    } finally {
      setBusyFolderId(null);
    }
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
      {!loading && folders.length === 0 && (
        <div className="empty-panel">
          <p className="empty-state">{messages.noSavedSessions}</p>
        </div>
      )}

      <section className="folder-grid">
        {folders.map((folder) => {
          const isBusy = busyFolderId === folder.id;
          const isExpanded = expandedFolderId === folder.id;

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
                <button className="primary-button" onClick={() => void handleRestore(folder)} disabled={isBusy}>
                  <span>{messages.restoreNow}</span>
                </button>
                <button className="ghost-button" onClick={() => setExpandedFolderId(isExpanded ? null : folder.id)} aria-label={messages.managerTitle}>
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
                    </li>
                  ))}
                </ul>
              )}
            </article>
          );
        })}
      </section>

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
          </div>
        </div>
      )}

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
