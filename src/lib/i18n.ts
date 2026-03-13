import { type LanguageCode, type SaveTabsBehavior } from "./settings";
import { type RestoreMode } from "./restore";

type TranslationDictionary = {
  popupKicker: string;
  popupHeroCopy: string;
  sessionName: string;
  sessionNamePlaceholder: string;
  noTabsToSave: string;
  saveFailed: string;
  saveSuccess: (count: number) => string;
  saveSuccessAndClosed: (count: number) => string;
  undoFailed: string;
  undo: string;
  restoreSuccess: (name: string, modeLabel: string) => string;
  restoreFailed: string;
  deleteFolderConfirm: (name: string) => string;
  deleteSuccess: (name: string) => string;
  deleteLastTab: (name: string) => string;
  deleteTabSuccess: (title: string) => string;
  deleteFailed: string;
  deleteTabFailed: string;
  openInCurrentFailed: string;
  recentFoldersKicker: string;
  recentFoldersTitle: string;
  manage: string;
  open: string;
  loadMore: string;
  tabsCount: (count: number) => string;
  duplicateExcluded: (count: number) => string;
  nonRestorableExcluded: (count: number) => string;
  removeTabAria: (title: string) => string;
  confirmTitle: string;
  cancel: string;
  delete: string;
  managerTitle: string;
  managerSubtitle: string;
  refresh: string;
  openGlobalSettings: string;
  loading: string;
  noSavedSessions: string;
  renameLabel: string;
  save: string;
  savedAt: string;
  restoreMode: string;
  restoreNow: string;
  renameSuccess: (name: string) => string;
  renameFailed: string;
  sessionRestoreSuccess: (name: string, modeLabel: string) => string;
  globalSettingsKicker: string;
  globalSettingsTitle: string;
  closeSettings: string;
  defaultRestoreModeTitle: string;
  defaultRestoreModeDescription: string;
  newTabTitle: string;
  newTabDescription: string;
  currentTabTitle: string;
  currentTabDescription: string;
  defaultRestoreModeSaved: (label: string) => string;
  defaultRestoreModeFailed: string;
  themeTitle: string;
  themeDescription: string;
  themeSaved: (label: string) => string;
  themeFailed: string;
  themeSystem: string;
  themeLight: string;
  themeDark: string;
  languageTitle: string;
  languageDescription: string;
  languageSaved: (label: string) => string;
  languageFailed: string;
  languageKorean: string;
  languageEnglish: string;
  languageKoreanDescription: string;
  languageEnglishDescription: string;
  saveTabsBehaviorTitle: string;
  saveTabsBehaviorDescription: string;
  saveTabsKeep: string;
  saveTabsKeepDescription: string;
  saveTabsClose: string;
  saveTabsCloseDescription: string;
  saveTabsBehaviorSaved: (label: string) => string;
  saveTabsBehaviorFailed: string;
  settingsLoadFailed: string;
  foldersLoadFailed: string;
  favoriteFoldersKicker: string;
  favoriteFoldersTitle: string;
  favoriteFoldersSubtitle: string;
  addFavoriteFolder: string;
  favoriteFoldersEmpty: string;
  updatedAt: string;
  favoriteFolderEmptyHint: string;
  sessionsKicker: string;
  sessionsTitle: string;
  sessionsSubtitle: string;
  createFavoriteFolderTitle: string;
  favoriteFolderName: string;
  favoriteFolderNamePlaceholder: string;
  create: string;
  favoriteFolderCreateSuccess: (name: string) => string;
  favoriteFolderCreateFailed: string;
  addTabs: string;
  addTabsKicker: string;
  addTabsDialogTitle: (name: string) => string;
  addTabsDialogDescription: string;
  selectedTabsCount: (selectedCount: number, totalCount: number) => string;
  currentWindowTabsLoadFailed: string;
  currentWindowTabsEmpty: string;
  untitledTab: string;
  nonRestorableTab: string;
  nonRestorableBadge: string;
  addSelectedTabs: string;
  favoriteTabsSaveFailed: string;
  favoriteFolderUnavailable: string;
  selectTabsToAdd: string;
  duplicateTabsTitle: string;
  duplicateTabsConfirm: (name: string, count: number) => string;
  skipDuplicates: string;
  overwrite: string;
  favoriteTabsSaved: (addedCount: number, updatedCount: number) => string;
  favoriteTabsSkippedDuplicates: (count: number) => string;
  favoriteTabsSkippedSelectionDuplicates: (count: number) => string;
  favoriteTabsSkippedNonRestorable: (count: number) => string;
  favoriteTabsUnchanged: string;
};

const translations: Record<LanguageCode, TranslationDictionary> = {
  ko: {
    popupKicker: "Session Capture",
    popupHeroCopy: "현재 창의 모든 탭을 세션으로 저장하세요.",
    sessionName: "세션 이름",
    sessionNamePlaceholder: "세션 이름을 입력하세요",
    noTabsToSave: "저장할 수 있는 탭이 없습니다.",
    saveFailed: "저장에 실패했습니다.",
    saveSuccess: (count) => `${count}개 탭 저장됨`,
    saveSuccessAndClosed: (count) => `${count}개 탭을 저장하고 새 탭 하나만 남겨 정리했습니다.`,
    undoFailed: "실행 취소에 실패했습니다.",
    undo: "실행 취소",
    restoreSuccess: (name, modeLabel) => `"${name}" 세션을 ${modeLabel} 방식으로 복원했습니다.`,
    restoreFailed: "복원에 실패했습니다.",
    deleteFolderConfirm: (name) => `"${name}" 폴더를 삭제할까요?`,
    deleteSuccess: (name) => `"${name}" 삭제됨`,
    deleteLastTab: (name) => `"${name}" 폴더의 마지막 탭 삭제됨`,
    deleteTabSuccess: (title) => `"${title}" 탭 삭제됨`,
    deleteFailed: "삭제에 실패했습니다.",
    deleteTabFailed: "탭 삭제에 실패했습니다.",
    openInCurrentFailed: "탭 열기에 실패했습니다.",
    recentFoldersKicker: "Recent Folders",
    recentFoldersTitle: "최근 저장",
    manage: "관리",
    open: "열기",
    loadMore: "더 보기",
    tabsCount: (count) => `${count}개 탭`,
    duplicateExcluded: (count) => `중복 ${count}개 제외`,
    nonRestorableExcluded: (count) => `복원 불가 ${count}개 제외`,
    removeTabAria: (title) => `${title} 탭 삭제`,
    confirmTitle: "확인",
    cancel: "취소",
    delete: "삭제",
    managerTitle: "라이브러리",
    managerSubtitle: "저장된 모든 탭 세션을 관리하고 복원하세요.",
    refresh: "새로고침",
    openGlobalSettings: "전역 설정",
    loading: "로딩 중...",
    noSavedSessions: "저장된 세션이 없습니다.",
    renameLabel: "이름 수정",
    save: "저장",
    savedAt: "저장 시각",
    restoreMode: "복원 방식",
    restoreNow: "지금 복원하기",
    renameSuccess: (name) => `"${name}" 이름이 변경되었습니다.`,
    renameFailed: "이름 변경에 실패했습니다.",
    sessionRestoreSuccess: (name, modeLabel) => `"${name}" 세션을 ${modeLabel} 방식으로 복원했습니다.`,
    globalSettingsKicker: "Global Settings",
    globalSettingsTitle: "전역 설정",
    closeSettings: "전역 설정 닫기",
    defaultRestoreModeTitle: "기본 복원 방식",
    defaultRestoreModeDescription: "팝업에서 열 때와 관리 페이지의 기본 콤보박스 값에 같이 적용됩니다.",
    newTabTitle: "새 탭",
    newTabDescription: "현재 창에 새 탭으로 복원",
    currentTabTitle: "현재 탭",
    currentTabDescription: "활성 탭을 첫 페이지로 바꾸고 옆에 이어서 복원",
    defaultRestoreModeSaved: (label) => `기본 복원 방식이 ${label}으로 설정되었습니다.`,
    defaultRestoreModeFailed: "기본 복원 방식을 저장하지 못했습니다.",
    themeTitle: "테마",
    themeDescription: "팝업과 관리 페이지 전체에 즉시 반영되며, 시스템을 고르면 OS 테마를 따라갑니다.",
    themeSaved: (label) => `테마가 ${label} 모드로 변경되었습니다.`,
    themeFailed: "테마를 저장하지 못했습니다.",
    themeSystem: "시스템",
    themeLight: "라이트",
    themeDark: "다크",
    languageTitle: "언어",
    languageDescription: "앱에서 표시할 기본 언어를 선택합니다.",
    languageSaved: (label) => `언어 기본값이 ${label}로 저장되었습니다.`,
    languageFailed: "언어 설정을 저장하지 못했습니다.",
    languageKorean: "한국어",
    languageEnglish: "영어",
    languageKoreanDescription: "기본 UI 언어를 한국어로 저장",
    languageEnglishDescription: "기본 UI 언어를 영어로 저장",
    saveTabsBehaviorTitle: "저장 후 탭 처리",
    saveTabsBehaviorDescription: "세션 저장 직후 현재 탭들을 그대로 둘지, 닫고 새 탭 하나만 남길지 정합니다.",
    saveTabsKeep: "탭 유지",
    saveTabsKeepDescription: "저장 후에도 현재 탭들을 그대로 둡니다.",
    saveTabsClose: "탭 정리",
    saveTabsCloseDescription: "저장 직후 현재 탭들을 닫고 새 탭 하나만 남깁니다.",
    saveTabsBehaviorSaved: (label) => `저장 후 탭 처리가 ${label}로 설정되었습니다.`,
    saveTabsBehaviorFailed: "저장 후 탭 처리 설정을 저장하지 못했습니다.",
    settingsLoadFailed: "전역 설정을 불러오지 못했습니다.",
    foldersLoadFailed: "저장된 탭 폴더를 불러오지 못했습니다.",
    favoriteFoldersKicker: "Favorite Folders",
    favoriteFoldersTitle: "즐겨찾기 폴더",
    favoriteFoldersSubtitle: "빈 폴더를 만들고 현재 창의 탭 중 필요한 것만 골라 담아 두세요.",
    addFavoriteFolder: "폴더 추가",
    favoriteFoldersEmpty: "아직 만든 즐겨찾기 폴더가 없습니다.",
    updatedAt: "최근 수정",
    favoriteFolderEmptyHint: "아직 저장된 탭이 없습니다. `탭 추가`로 현재 창의 탭을 골라 넣어 보세요.",
    sessionsKicker: "Saved Sessions",
    sessionsTitle: "저장된 세션",
    sessionsSubtitle: "기존처럼 현재 창 전체를 저장한 세션을 관리하고 복원합니다.",
    createFavoriteFolderTitle: "즐겨찾기 폴더 만들기",
    favoriteFolderName: "폴더 이름",
    favoriteFolderNamePlaceholder: "폴더 이름을 입력하세요",
    create: "확인",
    favoriteFolderCreateSuccess: (name) => `"${name}" 폴더가 생성되었습니다.`,
    favoriteFolderCreateFailed: "즐겨찾기 폴더 생성에 실패했습니다.",
    addTabs: "탭 추가",
    addTabsKicker: "Current Window Tabs",
    addTabsDialogTitle: (name) => `"${name}"에 탭 추가`,
    addTabsDialogDescription: "현재 창의 탭을 골라 즐겨찾기 폴더에 추가합니다.",
    selectedTabsCount: (selectedCount, totalCount) => `${selectedCount}개 선택 / ${totalCount}개 가능`,
    currentWindowTabsLoadFailed: "현재 창 탭 목록을 불러오지 못했습니다.",
    currentWindowTabsEmpty: "현재 창에 표시할 탭이 없습니다.",
    untitledTab: "제목 없는 탭",
    nonRestorableTab: "저장할 수 없는 탭",
    nonRestorableBadge: "저장 불가",
    addSelectedTabs: "선택한 탭 추가",
    favoriteTabsSaveFailed: "즐겨찾기 폴더에 탭을 추가하지 못했습니다.",
    favoriteFolderUnavailable: "선택한 즐겨찾기 폴더를 찾을 수 없습니다.",
    selectTabsToAdd: "추가할 탭을 하나 이상 선택하세요.",
    duplicateTabsTitle: "중복 탭 발견",
    duplicateTabsConfirm: (name, count) => `"${name}" 폴더에 이미 있는 탭이 ${count}개 있습니다. 덮어쓸까요?`,
    skipDuplicates: "건너뛰기",
    overwrite: "덮어쓰기",
    favoriteTabsSaved: (addedCount, updatedCount) => {
      if (addedCount > 0 && updatedCount > 0) {
        return `${addedCount}개 추가, ${updatedCount}개 덮어씀`;
      }

      if (addedCount > 0) {
        return `${addedCount}개 탭 추가됨`;
      }

      if (updatedCount > 0) {
        return `${updatedCount}개 기존 탭 덮어씀`;
      }

      return "변경된 탭이 없습니다.";
    },
    favoriteTabsSkippedDuplicates: (count) => `중복 ${count}개 건너뜀`,
    favoriteTabsSkippedSelectionDuplicates: (count) => `선택 목록 내 중복 ${count}개 제외`,
    favoriteTabsSkippedNonRestorable: (count) => `저장 불가 ${count}개 제외`,
    favoriteTabsUnchanged: "변경된 탭이 없습니다."
  },
  en: {
    popupKicker: "Session Capture",
    popupHeroCopy: "Save every tab in the current window as a reusable session.",
    sessionName: "Session name",
    sessionNamePlaceholder: "Enter a session name",
    noTabsToSave: "There are no restorable tabs to save.",
    saveFailed: "Failed to save the session.",
    saveSuccess: (count) => `Saved ${count} tab${count === 1 ? "" : "s"}.`,
    saveSuccessAndClosed: (count) => `Saved ${count} tab${count === 1 ? "" : "s"} and left one fresh tab open.`,
    undoFailed: "Failed to undo the action.",
    undo: "Undo",
    restoreSuccess: (name, modeLabel) => `Restored "${name}" using ${modeLabel}.`,
    restoreFailed: "Failed to restore the session.",
    deleteFolderConfirm: (name) => `Delete the "${name}" folder?`,
    deleteSuccess: (name) => `Deleted "${name}".`,
    deleteLastTab: (name) => `Removed the last tab from "${name}".`,
    deleteTabSuccess: (title) => `Deleted "${title}".`,
    deleteFailed: "Failed to delete the folder.",
    deleteTabFailed: "Failed to delete the tab.",
    openInCurrentFailed: "Failed to open the tab.",
    recentFoldersKicker: "Recent Folders",
    recentFoldersTitle: "Recent Saves",
    manage: "Manage",
    open: "Open",
    loadMore: "Load more",
    tabsCount: (count) => `${count} tab${count === 1 ? "" : "s"}`,
    duplicateExcluded: (count) => `${count} duplicate${count === 1 ? "" : "s"} excluded`,
    nonRestorableExcluded: (count) => `${count} non-restorable tab${count === 1 ? "" : "s"} excluded`,
    removeTabAria: (title) => `Delete ${title}`,
    confirmTitle: "Confirm",
    cancel: "Cancel",
    delete: "Delete",
    managerTitle: "Library",
    managerSubtitle: "Manage and restore every saved tab session.",
    refresh: "Refresh",
    openGlobalSettings: "Global settings",
    loading: "Loading...",
    noSavedSessions: "There are no saved sessions.",
    renameLabel: "Rename",
    save: "Save",
    savedAt: "Saved at",
    restoreMode: "Restore mode",
    restoreNow: "Restore now",
    renameSuccess: (name) => `Renamed "${name}".`,
    renameFailed: "Failed to rename the folder.",
    sessionRestoreSuccess: (name, modeLabel) => `Restored "${name}" using ${modeLabel}.`,
    globalSettingsKicker: "Global Settings",
    globalSettingsTitle: "Global Settings",
    closeSettings: "Close global settings",
    defaultRestoreModeTitle: "Default restore mode",
    defaultRestoreModeDescription: "Used by popup restores and as the default value in the manager combo boxes.",
    newTabTitle: "New tab",
    newTabDescription: "Restore into new tabs in the current window",
    currentTabTitle: "Current tab",
    currentTabDescription: "Replace the active tab first, then open the rest beside it",
    defaultRestoreModeSaved: (label) => `Default restore mode saved as ${label}.`,
    defaultRestoreModeFailed: "Failed to save the default restore mode.",
    themeTitle: "Theme",
    themeDescription: "Applied immediately to both popup and manager. System follows the OS theme.",
    themeSaved: (label) => `Theme changed to ${label}.`,
    themeFailed: "Failed to save the theme.",
    themeSystem: "System",
    themeLight: "Light",
    themeDark: "Dark",
    languageTitle: "Language",
    languageDescription: "Choose the default language used in the app.",
    languageSaved: (label) => `Default language saved as ${label}.`,
    languageFailed: "Failed to save the language setting.",
    languageKorean: "Korean",
    languageEnglish: "English",
    languageKoreanDescription: "Use Korean as the default UI language",
    languageEnglishDescription: "Use English as the default UI language",
    saveTabsBehaviorTitle: "After saving tabs",
    saveTabsBehaviorDescription: "Choose whether the current window tabs stay open or are cleared down to one fresh tab right after saving.",
    saveTabsKeep: "Keep tabs",
    saveTabsKeepDescription: "Leave the current window tabs open after saving.",
    saveTabsClose: "Clear tabs",
    saveTabsCloseDescription: "Close the current window tabs after saving and leave one fresh tab open.",
    saveTabsBehaviorSaved: (label) => `After-save tab behavior saved as ${label}.`,
    saveTabsBehaviorFailed: "Failed to save the after-save tab behavior.",
    settingsLoadFailed: "Failed to load global settings.",
    foldersLoadFailed: "Failed to load saved tab folders.",
    favoriteFoldersKicker: "Favorite Folders",
    favoriteFoldersTitle: "Favorite folders",
    favoriteFoldersSubtitle: "Create empty folders and keep only the tabs you hand-pick from the current window.",
    addFavoriteFolder: "Add folder",
    favoriteFoldersEmpty: "There are no favorite folders yet.",
    updatedAt: "Updated",
    favoriteFolderEmptyHint: "No tabs saved yet. Use Add tabs to pick from the current window.",
    sessionsKicker: "Saved Sessions",
    sessionsTitle: "Saved sessions",
    sessionsSubtitle: "These keep the existing full-window save flow and restore controls.",
    createFavoriteFolderTitle: "Create favorite folder",
    favoriteFolderName: "Folder name",
    favoriteFolderNamePlaceholder: "Enter a folder name",
    create: "Create",
    favoriteFolderCreateSuccess: (name) => `Created "${name}".`,
    favoriteFolderCreateFailed: "Failed to create the favorite folder.",
    addTabs: "Add tabs",
    addTabsKicker: "Current Window Tabs",
    addTabsDialogTitle: (name) => `Add tabs to "${name}"`,
    addTabsDialogDescription: "Pick the tabs from the current window that belong in this folder.",
    selectedTabsCount: (selectedCount, totalCount) => `${selectedCount} selected / ${totalCount} available`,
    currentWindowTabsLoadFailed: "Failed to load the current window tabs.",
    currentWindowTabsEmpty: "There are no tabs to show from the current window.",
    untitledTab: "Untitled tab",
    nonRestorableTab: "This tab cannot be saved",
    nonRestorableBadge: "Unavailable",
    addSelectedTabs: "Add selected tabs",
    favoriteTabsSaveFailed: "Failed to add tabs to the favorite folder.",
    favoriteFolderUnavailable: "The selected favorite folder is no longer available.",
    selectTabsToAdd: "Select at least one tab to add.",
    duplicateTabsTitle: "Duplicate tabs found",
    duplicateTabsConfirm: (name, count) => `${count} tab${count === 1 ? "" : "s"} already exist in "${name}". Overwrite them?`,
    skipDuplicates: "Skip duplicates",
    overwrite: "Overwrite",
    favoriteTabsSaved: (addedCount, updatedCount) => {
      if (addedCount > 0 && updatedCount > 0) {
        return `Added ${addedCount} and overwrote ${updatedCount}.`;
      }

      if (addedCount > 0) {
        return `Added ${addedCount} tab${addedCount === 1 ? "" : "s"}.`;
      }

      if (updatedCount > 0) {
        return `Overwrote ${updatedCount} tab${updatedCount === 1 ? "" : "s"}.`;
      }

      return "Nothing changed.";
    },
    favoriteTabsSkippedDuplicates: (count) => `Skipped ${count} existing duplicate${count === 1 ? "" : "s"}.`,
    favoriteTabsSkippedSelectionDuplicates: (count) => `Ignored ${count} duplicate${count === 1 ? "" : "s"} inside the selection.`,
    favoriteTabsSkippedNonRestorable: (count) => `Excluded ${count} non-restorable tab${count === 1 ? "" : "s"}.`,
    favoriteTabsUnchanged: "Nothing changed."
  }
};

export function getMessages(language: LanguageCode): TranslationDictionary {
  return translations[language];
}

export function getLocale(language: LanguageCode): string {
  return language === "en" ? "en-US" : "ko-KR";
}

export function getRestoreModeLabelByLanguage(mode: RestoreMode, language: LanguageCode): string {
  const messages = getMessages(language);
  return mode === "current-tab" ? messages.currentTabTitle : messages.newTabTitle;
}

export function getThemeLabel(theme: "system" | "light" | "dark", language: LanguageCode): string {
  const messages = getMessages(language);
  if (theme === "system") return messages.themeSystem;
  if (theme === "dark") return messages.themeDark;
  return messages.themeLight;
}

export function getLanguageLabel(language: LanguageCode, uiLanguage: LanguageCode): string {
  const messages = getMessages(uiLanguage);
  return language === "en" ? messages.languageEnglish : messages.languageKorean;
}

export function getSaveTabsBehaviorLabel(behavior: SaveTabsBehavior, language: LanguageCode): string {
  const messages = getMessages(language);
  return behavior === "close-tabs" ? messages.saveTabsClose : messages.saveTabsKeep;
}
