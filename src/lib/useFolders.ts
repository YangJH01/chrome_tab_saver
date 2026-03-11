import { startTransition, useEffect, useState } from "react";

import { STORAGE_KEY, getFolders, type TabFolder } from "./storage";

export function useFolders() {
  const [folders, setFolders] = useState<TabFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function refresh() {
    try {
      const nextFolders = await getFolders();

      setError(false);
      startTransition(() => {
        setFolders(nextFolders);
      });
    } catch (caughtError) {
      console.error(caughtError);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();

    const listener: Parameters<typeof chrome.storage.onChanged.addListener>[0] = (changes, areaName) => {
      if (areaName !== "local" || !changes[STORAGE_KEY]) {
        return;
      }

      void refresh();
    };

    chrome.storage.onChanged.addListener(listener);

    return () => {
      chrome.storage.onChanged.removeListener(listener);
    };
  }, []);

  return { error, folders, loading, refresh };
}
