import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getEmbedSnippet } from "../api/adminClient";
import { isUnauthorized } from "../api/client";
import type { EmbedSnippet } from "../types/tutor";
import { useApiKey } from "./ApiKeyContext";
import { Spinner } from "./Spinner";

export function EmbedSnippetPage() {
  const { apiKey, invalidateApiKey } = useApiKey();
  const { tutorId } = useParams();
  const [snippet, setSnippet] = useState<EmbedSnippet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const copyResetTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!apiKey || !tutorId) return;
    setLoading(true);
    getEmbedSnippet(apiKey, tutorId)
      .then(setSnippet)
      .catch((err) => {
        if (isUnauthorized(err)) {
          invalidateApiKey("Chave de administrador inválida. Informe a chave correta.");
          return;
        }
        setError(err instanceof Error ? err.message : "Erro ao gerar snippet.");
      })
      .finally(() => setLoading(false));
  }, [apiKey, tutorId, invalidateApiKey]);

  useEffect(() => {
    return () => clearTimeout(copyResetTimer.current);
  }, []);

  async function handleCopy() {
    if (!snippet) return;
    try {
      // navigator.clipboard exige contexto seguro (HTTPS ou localhost) — indisponível,
      // por exemplo, ao acessar o dashboard por um IP de LAN durante uma demo.
      if (!navigator.clipboard) {
        throw new Error("Clipboard indisponível neste contexto (precisa de HTTPS ou localhost).");
      }
      await navigator.clipboard.writeText(snippet.iframe_snippet);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    } finally {
      clearTimeout(copyResetTimer.current);
      copyResetTimer.current = setTimeout(() => setCopyState("idle"), 2500);
    }
  }

  return (
    <div>
      <p>
        <Link to="/admin/tutors">&larr; Voltar</Link>
      </p>
      <h1>Snippet de embed</h1>
      <p>Cole este trecho no HTML do site integrador para incorporar o widget de chat:</p>

      {loading && <Spinner />}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}

      {snippet && (
        <>
          <label htmlFor="embed-snippet-textarea">Trecho HTML do iframe</label>
          <textarea
            id="embed-snippet-textarea"
            readOnly
            value={snippet.iframe_snippet}
            rows={4}
            className="snippet-textarea"
          />
          <button type="button" onClick={handleCopy}>
            {copyState === "copied"
              ? "Copiado!"
              : copyState === "failed"
                ? "Não foi possível copiar — selecione o texto manualmente"
                : "Copiar"}
          </button>
          <p>
            URL direta:{" "}
            <a href={snippet.embed_url} target="_blank" rel="noopener noreferrer">
              {snippet.embed_url}
            </a>
          </p>
        </>
      )}
    </div>
  );
}
