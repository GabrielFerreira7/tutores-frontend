import { FormEvent, ReactNode, useState } from "react";
import { useApiKey } from "./ApiKeyContext";

export function ApiKeyGate({ children }: { children: ReactNode }) {
  const { apiKey, authError, setApiKey } = useApiKey();
  const [input, setInput] = useState("");

  if (apiKey) {
    return <>{children}</>;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (input.trim()) {
      setApiKey(input.trim());
    }
  }

  return (
    <div className="api-key-gate">
      <h1>Acesso administrativo</h1>
      <p>Informe a chave de administrador (ADMIN_API_KEY) configurada no backend.</p>
      {authError && (
        <p role="alert" className="form-error">
          {authError}
        </p>
      )}
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Admin API key"
          aria-label="Admin API key"
          autoFocus
        />
        <button type="submit">Entrar</button>
      </form>
    </div>
  );
}
