import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../src/api/client";
import { TutorListPage } from "../src/admin/TutorListPage";
import type { Tutor } from "../src/types/tutor";

const listTutorsMock = vi.fn();
const activateTutorMock = vi.fn();
const deactivateTutorMock = vi.fn();
const invalidateApiKeyMock = vi.fn();

vi.mock("../src/api/adminClient", () => ({
  listTutors: (...args: unknown[]) => listTutorsMock(...args),
  activateTutor: (...args: unknown[]) => activateTutorMock(...args),
  deactivateTutor: (...args: unknown[]) => deactivateTutorMock(...args),
}));

vi.mock("../src/admin/ApiKeyContext", () => ({
  useApiKey: () => ({
    apiKey: "wrong-admin-key",
    authError: null,
    setApiKey: vi.fn(),
    clearApiKey: vi.fn(),
    invalidateApiKey: invalidateApiKeyMock,
  }),
}));

function renderTutorList() {
  return render(
    <MemoryRouter>
      <TutorListPage />
    </MemoryRouter>
  );
}

function inactiveTutor(): Tutor {
  return {
    id: "tutor-1",
    title: "Tutor Inativo",
    short_description: "",
    status: "inactive",
    system_instructions: "x",
    embed_token: "token",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    sources: [],
  };
}

describe("TutorListPage", () => {
  beforeEach(() => {
    listTutorsMock.mockReset();
    activateTutorMock.mockReset();
    deactivateTutorMock.mockReset();
    invalidateApiKeyMock.mockReset();
  });

  it("invalidates the stored key on a 401 instead of showing the authenticated screen", async () => {
    listTutorsMock.mockRejectedValueOnce(
      new ApiError(401, "Chave de administrador ausente ou inválida.")
    );

    renderTutorList();

    // Este é o bug reportado: com uma chave invalida, a pagina nao deve tratar o 401
    // como "lista vazia" nem exibir a mensagem crua de erro — ela deve pedir para o
    // ApiKeyGate (componente pai, nao renderizado neste teste isolado) assumir de novo.
    await waitFor(() => expect(invalidateApiKeyMock).toHaveBeenCalledTimes(1));
    expect(invalidateApiKeyMock).toHaveBeenCalledWith(expect.stringContaining("inválida"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows 'Ativar' (not 'Desativar') for an inactive tutor and reactivates it", async () => {
    listTutorsMock.mockResolvedValueOnce([inactiveTutor()]);
    activateTutorMock.mockResolvedValueOnce({ ...inactiveTutor(), status: "active" });
    listTutorsMock.mockResolvedValueOnce([{ ...inactiveTutor(), status: "active" }]);
    const user = userEvent.setup();

    renderTutorList();

    // Âncoras de início/fim (^$) evitam que este matcher também capture "Desativar"
    // caso os dois botões um dia coexistam na mesma linha.
    const activateButton = await screen.findByRole("button", { name: /^ativar$/i });
    expect(screen.queryByRole("button", { name: /desativar/i })).not.toBeInTheDocument();

    await user.click(activateButton);

    await waitFor(() =>
      expect(activateTutorMock).toHaveBeenCalledWith("wrong-admin-key", "tutor-1")
    );
    expect(listTutorsMock).toHaveBeenCalledTimes(2);
  });
});
