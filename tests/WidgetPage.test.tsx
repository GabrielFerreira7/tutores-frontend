import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WidgetPage } from "../src/widget/WidgetPage";

const sendChatMessageMock = vi.fn();
const getChatHistoryMock = vi.fn();
const getPublicTutorInfoMock = vi.fn();

vi.mock("../src/api/publicClient", () => ({
  sendChatMessage: (...args: unknown[]) => sendChatMessageMock(...args),
  getChatHistory: (...args: unknown[]) => getChatHistoryMock(...args),
  getPublicTutorInfo: (...args: unknown[]) => getPublicTutorInfoMock(...args),
}));

function renderWidget(query: string) {
  return render(
    <MemoryRouter initialEntries={[`/widget${query}`]}>
      <Routes>
        <Route path="/widget" element={<WidgetPage />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.clear();
  sendChatMessageMock.mockReset();
  getChatHistoryMock.mockReset();
  getPublicTutorInfoMock.mockReset();
  getChatHistoryMock.mockResolvedValue({ session_id: "s1", messages: [] });
  getPublicTutorInfoMock.mockResolvedValue({
    id: "tutor-1",
    title: "Tutor de teste",
    short_description: "",
  });
});

describe("WidgetPage", () => {
  it("shows a message when tutorId/token are missing from the URL", () => {
    renderWidget("");

    expect(screen.getByText(/parâmetros de embed ausentes/i)).toBeInTheDocument();
  });

  it("sends a message and renders the tutor's reply", async () => {
    sendChatMessageMock.mockResolvedValueOnce({
      session_id: "session-1",
      reply: "Olá! Como posso ajudar?",
    });
    const user = userEvent.setup();

    renderWidget("?tutorId=tutor-1&token=embed-token");

    await user.type(screen.getByLabelText(/mensagem/i), "Oi, tudo bem?");
    await user.click(screen.getByRole("button", { name: /enviar/i }));

    expect(await screen.findByText("Olá! Como posso ajudar?")).toBeInTheDocument();
    expect(sendChatMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tutorId: "tutor-1",
        embedToken: "embed-token",
        message: "Oi, tudo bem?",
      })
    );
  });

  it("shows an error when sending the message fails, and restores the message for retry", async () => {
    sendChatMessageMock.mockRejectedValueOnce(new Error("tutor indisponível"));
    const user = userEvent.setup();

    renderWidget("?tutorId=tutor-1&token=embed-token");

    await user.type(screen.getByLabelText(/mensagem/i), "Oi");
    await user.click(screen.getByRole("button", { name: /enviar/i }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("tutor indisponível"));
    // A mensagem otimista some da lista e volta pro campo de input, em vez de ficar
    // marcada como "enviada" quando na verdade falhou.
    expect(screen.queryByText("Oi")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/mensagem/i)).toHaveValue("Oi");
  });

  it("shows the tutor title fetched from the public info endpoint", async () => {
    renderWidget("?tutorId=tutor-1&token=embed-token");

    expect(await screen.findByText("Tutor de teste")).toBeInTheDocument();
  });

  it("still renders the chat when localStorage throws (blocked third-party storage)", async () => {
    const originalGetItem = Storage.prototype.getItem;
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.getItem = () => {
      throw new DOMException("blocked", "SecurityError");
    };
    Storage.prototype.setItem = () => {
      throw new DOMException("blocked", "SecurityError");
    };

    try {
      sendChatMessageMock.mockResolvedValueOnce({ session_id: "session-1", reply: "Oi!" });
      const user = userEvent.setup();

      renderWidget("?tutorId=tutor-1&token=embed-token");
      expect(screen.getByLabelText(/mensagem/i)).toBeInTheDocument();

      await user.type(screen.getByLabelText(/mensagem/i), "Oi, tudo bem?");
      await user.click(screen.getByRole("button", { name: /enviar/i }));

      expect(await screen.findByText("Oi!")).toBeInTheDocument();
    } finally {
      Storage.prototype.getItem = originalGetItem;
      Storage.prototype.setItem = originalSetItem;
    }
  });
});
