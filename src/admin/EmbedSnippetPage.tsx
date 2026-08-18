import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getEmbedSnippet } from "../api/adminClient";
import { isUnauthorized } from "../api/client";
import type { EmbedSnippet } from "../types/tutor";
import { useApiKey } from "./ApiKeyContext";

export function EmbedSnippetPage() {
  const { apiKey, invalidateApiKey } = useApiKey();
  const { tutorId } = useParams();
  const [snippet, setSnippet] = useState<EmbedSnippet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!apiKey || !tutorId) return;
    getEmbedSnippet(apiKey, tutorId)
      .then(setSnippet)
      .catch((err) => {
        if (isUnauthorized(err)) {
          invalidateApiKey("Chave de administrador inválida. Informe a chave correta.");
          return;
        }
        setError(err instanceof Error ? err.message : "Erro ao gerar snippet.");
      });
  }, [apiKey, tutorId, invalidateApiKey]);

  async function handleCopy() {
    if (!snippet) return;
    await navigator.clipboard.writeText(snippet.iframe_snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <p>
        <Link to="/admin/tutors">&larr; Voltar</Link>
      </p>
      <h1>Snippet de embed</h1>
      <p>Cole este trecho no HTML do site integrador para incorporar o widget de chat:</p>

      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}

      {snippet && (
        <>
          <textarea readOnly value={snippet.iframe_snippet} rows={4} className="snippet-textarea" />
          <button type="button" onClick={handleCopy}>
            {copied ? "Copiado!" : "Copiar"}
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
