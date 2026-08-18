import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { TutorFormPage } from "../src/admin/TutorFormPage";

const createTutorMock = vi.fn();

vi.mock("../src/api/adminClient", () => ({
  createTutor: (...args: unknown[]) => createTutorMock(...args),
  getTutor: vi.fn(),
  updateTutor: vi.fn(),
}));

vi.mock("../src/admin/ApiKeyContext", () => ({
  useApiKey: () => ({ apiKey: "test-admin-key", setApiKey: vi.fn(), clearApiKey: vi.fn() }),
}));

function renderNewTutorForm() {
  return render(
    <MemoryRouter initialEntries={["/admin/tutors/new"]}>
      <Routes>
        <Route path="/admin/tutors/new" element={<TutorFormPage />} />
        <Route path="/admin/tutors" element={<p>Lista de tutores</p>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("TutorFormPage", () => {
  it("submits the filled fields to createTutor", async () => {
    createTutorMock.mockResolvedValueOnce({ id: "1" });
    const user = userEvent.setup();

    renderNewTutorForm();

    await user.type(screen.getByLabelText(/título/i), "Tutor de Física");
    await user.type(screen.getByLabelText(/instruções do sistema/i), "Seja claro e objetivo.");
    await user.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() => expect(createTutorMock).toHaveBeenCalledTimes(1));
    expect(createTutorMock).toHaveBeenCalledWith(
      "test-admin-key",
      expect.objectContaining({
        title: "Tutor de Física",
        system_instructions: "Seja claro e objetivo.",
        sources: [],
      })
    );
  });

  it("shows an error message when saving fails", async () => {
    createTutorMock.mockRejectedValueOnce(new Error("chave inválida"));
    const user = userEvent.setup();

    renderNewTutorForm();

    await user.type(screen.getByLabelText(/título/i), "Tutor de Física");
    await user.type(screen.getByLabelText(/instruções do sistema/i), "Seja claro.");
    await user.click(screen.getByRole("button", { name: /salvar/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("chave inválida");
  });

  it("adds and removes a knowledge source row", async () => {
    const user = userEvent.setup();
    renderNewTutorForm();

    await user.click(screen.getByRole("button", { name: /adicionar fonte/i }));
    expect(screen.getByPlaceholderText(/rótulo/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /remover fonte/i }));
    expect(screen.queryByPlaceholderText(/rótulo/i)).not.toBeInTheDocument();
  });
});
