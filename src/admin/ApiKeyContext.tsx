import { createContext, ReactNode, useContext, useState } from "react";

const STORAGE_KEY = "tutores_admin_api_key";

interface ApiKeyContextValue {
  apiKey: string | null;
  authError: string | null;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  invalidateApiKey: (message: string) => void;
}

const ApiKeyContext = createContext<ApiKeyContextValue | undefined>(undefined);

export function ApiKeyProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKeyState] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY)
  );
  const [authError, setAuthError] = useState<string | null>(null);

  function setApiKey(key: string) {
    localStorage.setItem(STORAGE_KEY, key);
    setApiKeyState(key);
    setAuthError(null);
  }

  function clearApiKey() {
    localStorage.removeItem(STORAGE_KEY);
    setApiKeyState(null);
    setAuthError(null);
  }

  // Called when the backend rejects the stored key (401): drop it and send the user
  // back to the gate instead of leaving an authenticated-looking screen half-broken.
  function invalidateApiKey(message: string) {
    localStorage.removeItem(STORAGE_KEY);
    setApiKeyState(null);
    setAuthError(message);
  }

  return (
    <ApiKeyContext.Provider value={{ apiKey, authError, setApiKey, clearApiKey, invalidateApiKey }}>
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
