import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../src/api/client";
import { TutorListPage } from "../src/admin/TutorListPage";

const listTutorsMock = vi.fn();
const invalidateApiKeyMock = vi.fn();

vi.mock("../src/api/adminClient", () => ({
  listTutors: (...args: unknown[]) => listTutorsMock(...args),
  deactivateTutor: vi.fn(),
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

describe("TutorListPage", () => {
  it("invalidates the stored key on a 401 instead of showing the authenticated screen", async () => {
    listTutorsMock.mockRejectedValueOnce(new ApiError(401, "Chave de administrador ausente ou inválida."));

    renderTutorList();

    // Este é o bug reportado: com uma chave invalida, a pagina nao deve tratar o 401
    // como "lista vazia" nem exibir a mensagem crua de erro — ela deve pedir para o
    // ApiKeyGate (componente pai, nao renderizado neste teste isolado) assumir de novo.
    await waitFor(() => expect(invalidateApiKeyMock).toHaveBeenCalledTimes(1));
    expect(invalidateApiKeyMock).toHaveBeenCalledWith(expect.stringContaining("inválida"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
