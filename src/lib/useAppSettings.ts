import { useEffect, useState } from "react";

import {
  SETTINGS_KEY,
  applyLanguage,
  applyTheme,
  getSettings,
  normalizeSettings,
  saveSettings,
  DEFAULT_APP_SETTINGS,
  type AppSettings
} from "./settings";

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function refresh() {
    try {
      const nextSettings = await getSettings();

      setSettings(nextSettings);
      setError(false);
    } catch (caughtError) {
      console.error(caughtError);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  async function update(partialSettings: Partial<AppSettings>) {
    try {
      const nextSettings = await saveSettings(partialSettings);

      setSettings(nextSettings);
      setError(false);
      return nextSettings;
    } catch (caughtError) {
      console.error(caughtError);
      throw caughtError;
    }
  }

  useEffect(() => {
    void refresh();

    const listener: Parameters<typeof chrome.storage.onChanged.addListener>[0] = (changes, areaName) => {
      if (areaName !== "local" || !changes[SETTINGS_KEY]) {
        return;
      }

      setSettings(normalizeSettings(changes[SETTINGS_KEY].newValue));
    };

    chrome.storage.onChanged.addListener(listener);

    return () => {
      chrome.storage.onChanged.removeListener(listener);
    };
  }, []);

  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  useEffect(() => {
    applyLanguage(settings.language);
  }, [settings.language]);

  useEffect(() => {
    if (settings.theme !== "system" || typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const syncSystemTheme = () => applyTheme("system");

    syncSystemTheme();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncSystemTheme);

      return () => {
        mediaQuery.removeEventListener("change", syncSystemTheme);
      };
    }

    mediaQuery.addListener(syncSystemTheme);

    return () => {
      mediaQuery.removeListener(syncSystemTheme);
    };
  }, [settings.theme]);

  return { error, loading, refresh, settings, update };
}
