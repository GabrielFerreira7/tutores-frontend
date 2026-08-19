import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createTutor, getTutor, updateTutor } from "../api/adminClient";
import { isUnauthorized } from "../api/client";
import type { SourceInput } from "../types/tutor";
import { useApiKey } from "./ApiKeyContext";
import { Spinner } from "./Spinner";

export function TutorFormPage() {
  const { apiKey, invalidateApiKey } = useApiKey();
  const { tutorId } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(tutorId);

  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [systemInstructions, setSystemInstructions] = useState("");
  const [sources, setSources] = useState<SourceInput[]>([]);
  const [loading, setLoading] = useState(isEditing);
  // Erro de carregamento (edição) impede renderizar o formulário — submetê-lo vazio
  // apagaria o conteúdo real do tutor. Erro de submissão é só exibido inline, com o
  // formulário (e o que o usuário já digitou) intactos para tentar de novo.
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!apiKey || !tutorId) return;
    let cancelled = false;
    setLoading(true);
    getTutor(apiKey, tutorId)
      .then((tutor) => {
        if (cancelled) return;
        setTitle(tutor.title);
        setShortDescription(tutor.short_description);
        setSystemInstructions(tutor.system_instructions);
        setSources(tutor.sources.map((s) => ({ label: s.label, url: s.url })));
      })
      .catch((err) => {
        if (cancelled) return;
        if (isUnauthorized(err)) {
          invalidateApiKey("Chave de administrador inválida. Informe a chave correta.");
          return;
        }
        setLoadError(err instanceof Error ? err.message : "Erro ao carregar tutor.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiKey, tutorId, invalidateApiKey]);

  function addSource() {
    setSources((prev) => [...prev, { label: "", url: "" }]);
  }

  function updateSourceField(index: number, field: keyof SourceInput, value: string) {
    setSources((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  }

  function removeSource(index: number) {
    setSources((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!apiKey) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setSubmitError("O título não pode ficar em branco.");
      return;
    }

    setSaving(true);
    setSubmitError(null);
    try {
      const payload = {
        title: trimmedTitle,
        short_description: shortDescription.trim(),
        system_instructions: systemInstructions.trim(),
        sources: sources.map((s) => ({ label: s.label.trim(), url: s.url.trim() })),
      };
      if (isEditing && tutorId) {
        await updateTutor(apiKey, tutorId, payload);
      } else {
        await createTutor(apiKey, payload);
      }
      navigate("/admin/tutors");
    } catch (err) {
      if (isUnauthorized(err)) {
        invalidateApiKey("Chave de administrador inválida. Informe a chave correta.");
        return;
      }
      setSubmitError(err instanceof Error ? err.message : "Erro ao salvar tutor.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <Spinner />;
  }

  if (loadError) {
    return (
      <div>
        <h1>Editar tutor</h1>
        <p role="alert" className="form-error">
          {loadError}
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1>{isEditing ? "Editar tutor" : "Novo tutor"}</h1>
      <form onSubmit={handleSubmit} className="tutor-form">
        <label>
          Título
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            maxLength={200}
          />
        </label>

        <label>
          Descrição curta
          <input
            value={shortDescription}
            onChange={(event) => setShortDescription(event.target.value)}
            maxLength={500}
          />
        </label>

        <label>
          Instruções do sistema (persona, tom, comportamento)
          <textarea
            value={systemInstructions}
            onChange={(event) => setSystemInstructions(event.target.value)}
            required
            rows={6}
          />
        </label>

        <fieldset className="sources-fieldset">
          <legend>Fontes de conhecimento (URLs públicas de texto/JSON)</legend>
          {sources.map((source, index) => (
            <div key={index} className="source-row">
              <input
                placeholder="Rótulo"
                value={source.label}
                onChange={(event) => updateSourceField(index, "label", event.target.value)}
                required
              />
              <input
                placeholder="https://exemplo.com/documento.txt"
                value={source.url}
                onChange={(event) => updateSourceField(index, "url", event.target.value)}
                required
                type="url"
              />
              <button type="button" onClick={() => removeSource(index)} aria-label="Remover fonte">
                Remover
              </button>
            </div>
          ))}
          <button type="button" onClick={addSource}>
            + Adicionar fonte
          </button>
        </fieldset>

        {submitError && (
          <p role="alert" className="form-error">
            {submitError}
          </p>
        )}

        <button type="submit" disabled={saving}>
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </form>
    </div>
  );
}
