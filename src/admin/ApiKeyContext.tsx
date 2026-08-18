import { createContext, ReactNode, useContext, useState } from "react";

const STORAGE_KEY = "tutores_admin_api_key";

interface ApiKeyContextValue {
  apiKey: string | null;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
}

const ApiKeyContext = createContext<ApiKeyContextValue | undefined>(undefined);

export function ApiKeyProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKeyState] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY)
  );

  function setApiKey(key: string) {
    localStorage.setItem(STORAGE_KEY, key);
    setApiKeyState(key);
  }

  function clearApiKey() {
    localStorage.removeItem(STORAGE_KEY);
    setApiKeyState(null);
  }

  return (
    <ApiKeyContext.Provider value={{ apiKey, setApiKey, clearApiKey }}>
      {children}
    </ApiKeyContext.Provider>
  );
}

export function useApiKey(): ApiKeyContextValue {
  const ctx = useContext(ApiKeyContext);
  if (!ctx) {
    throw new Error("useApiKey deve ser usado dentro de um ApiKeyProvider");
  }
  return ctx;
}
