import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WidgetPage } from "../src/widget/WidgetPage";

const sendChatMessageMock = vi.fn();
const getChatHistoryMock = vi.fn();

vi.mock("../src/api/publicClient", () => ({
  sendChatMessage: (...args: unknown[]) => sendChatMessageMock(...args),
  getChatHistory: (...args: unknown[]) => getChatHistoryMock(...args),
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
  getChatHistoryMock.mockResolvedValue({ session_id: "s1", messages: [] });
});

describe("WidgetPage", () => {
  it("shows a message when tutorId/token are missing from the URL", () => {
    renderWidget("");

    expect(screen.getByText(/parâmetros de embed ausentes/i)).toBeInTheDocument();
  });

  it("sends a message and renders the tutor's reply", async () => {
    sendChatMessageMock.mockResolvedValueOnce({ session_id: "session-1", reply: "Olá! Como posso ajudar?" });
    const user = userEvent.setup();

    renderWidget("?tutorId=tutor-1&token=embed-token");

    await user.type(screen.getByLabelText(/mensagem/i), "Oi, tudo bem?");
    await user.click(screen.getByRole("button", { name: /enviar/i }));

    expect(await screen.findByText("Olá! Como posso ajudar?")).toBeInTheDocument();
    expect(sendChatMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({ tutorId: "tutor-1", embedToken: "embed-token", message: "Oi, tudo bem?" })
    );
  });

  it("shows an error when sending the message fails", async () => {
    sendChatMessageMock.mockRejectedValueOnce(new Error("tutor indisponível"));
    const user = userEvent.setup();

    renderWidget("?tutorId=tutor-1&token=embed-token");

    await user.type(screen.getByLabelText(/mensagem/i), "Oi");
    await user.click(screen.getByRole("button", { name: /enviar/i }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("tutor indisponível"));
  });
});
