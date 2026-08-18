import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deactivateTutor, listTutors } from "../api/adminClient";
import { isUnauthorized } from "../api/client";
import type { Tutor } from "../types/tutor";
import { useApiKey } from "./ApiKeyContext";

export function TutorListPage() {
  const { apiKey, invalidateApiKey } = useApiKey();
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (key: string) => {
      setLoading(true);
      try {
        setTutors(await listTutors(key));
        setError(null);
      } catch (err) {
        if (isUnauthorized(err)) {
          invalidateApiKey("Chave de administrador inválida. Informe a chave correta.");
          return;
        }
        setError(err instanceof Error ? err.message : "Erro ao carregar tutores.");
      } finally {
        setLoading(false);
      }
    },
    [invalidateApiKey]
  );

  useEffect(() => {
    if (apiKey) {
      load(apiKey);
    }
  }, [apiKey, load]);

  async function handleDeactivate(id: string) {
    if (!apiKey) return;
    try {
      await deactivateTutor(apiKey, id);
      await load(apiKey);
    } catch (err) {
      if (isUnauthorized(err)) {
        invalidateApiKey("Chave de administrador inválida. Informe a chave correta.");
        return;
      }
      setError(err instanceof Error ? err.message : "Erro ao desativar tutor.");
    }
  }

  return (
    <div>
      <header className="page-header">
        <h1>Tutores</h1>
        <Link to="/admin/tutors/new">+ Novo tutor</Link>
      </header>

      {loading && <p>Carregando...</p>}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}

      {!loading && tutors.length === 0 && !error && <p>Nenhum tutor cadastrado ainda.</p>}

      {tutors.length > 0 && (
        <table className="tutor-table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {tutors.map((tutor) => (
              <tr key={tutor.id}>
                <td>{tutor.title}</td>
                <td>
                  <span className={`status-badge status-${tutor.status}`}>{tutor.status}</span>
                </td>
                <td className="row-actions">
                  <Link to={`/admin/tutors/${tutor.id}`}>Editar</Link>
                  <Link to={`/admin/tutors/${tutor.id}/embed`}>Embed</Link>
                  {tutor.status === "active" && (
                    <button type="button" onClick={() => handleDeactivate(tutor.id)}>
                      Desativar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
