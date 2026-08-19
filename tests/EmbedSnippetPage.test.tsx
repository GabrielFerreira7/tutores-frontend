import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EmbedSnippetPage } from "../src/admin/EmbedSnippetPage";

const getEmbedSnippetMock = vi.fn();
// Hoisted para fora do factory do vi.mock: se "invalidateApiKey" fosse recriado a cada
// chamada de useApiKey(), a identidade mudaria em todo render, o useEffect de
// EmbedSnippetPage (que depende dela) reexecutaria infinitamente e esgotaria o
// mockResolvedValueOnce, fazendo getEmbedSnippet(...) retornar undefined e o .then()
// seguinte explodir com "Cannot read properties of undefined".
const invalidateApiKeyMock = vi.fn();

vi.mock("../src/api/adminClient", () => ({
  getEmbedSnippet: (...args: unknown[]) => getEmbedSnippetMock(...args),
}));

vi.mock("../src/admin/ApiKeyContext", () => ({
  useApiKey: () => ({
    apiKey: "test-admin-key",
    authError: null,
    setApiKey: vi.fn(),
    clearApiKey: vi.fn(),
    invalidateApiKey: invalidateApiKeyMock,
  }),
}));

function renderEmbedPage() {
  return render(
    <MemoryRouter initialEntries={["/admin/tutors/tutor-1/embed"]}>
      <Routes>
        <Route path="/admin/tutors/:tutorId/embed" element={<EmbedSnippetPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("EmbedSnippetPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the direct URL as a clickable link that opens in a new tab", async () => {
    const embedUrl = "http://localhost:5173/widget?tutorId=tutor-1&token=abc123";
    getEmbedSnippetMock.mockResolvedValueOnce({
      tutor_id: "tutor-1",
      embed_url: embedUrl,
      iframe_snippet: `<iframe src="${embedUrl}"></iframe>`,
    });

    renderEmbedPage();

    const link = await screen.findByRole("link", { name: embedUrl });
    expect(link).toHaveAttribute("href", embedUrl);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("copies the snippet when the clipboard API is available", async () => {
    getEmbedSnippetMock.mockResolvedValueOnce({
      tutor_id: "tutor-1",
      embed_url: "http://localhost:5173/widget?tutorId=tutor-1&token=abc123",
      iframe_snippet: '<iframe src="..."></iframe>',
    });
    const user = userEvent.setup();
    // Precisa vir depois de userEvent.setup(): ele instala seu próprio stub de
    // navigator.clipboard (para suportar .paste()/.copy()), que substituiria o nosso
    // se a ordem fosse invertida.
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });

    renderEmbedPage();

    await user.click(await screen.findByRole("button", { name: /copiar/i }));

    await waitFor(() => expect(screen.getByRole("button")).toHaveTextContent("Copiado!"));
    expect(writeText).toHaveBeenCalledWith('<iframe src="..."></iframe>');
  });

  it("shows a manual fallback instead of crashing when the clipboard API is unavailable", async () => {
    getEmbedSnippetMock.mockResolvedValueOnce({
      tutor_id: "tutor-1",
      embed_url: "http://localhost:5173/widget?tutorId=tutor-1&token=abc123",
      iframe_snippet: '<iframe src="..."></iframe>',
    });
    const user = userEvent.setup();
    vi.stubGlobal("navigator", { ...navigator, clipboard: undefined });

    renderEmbedPage();

    await user.click(await screen.findByRole("button", { name: /copiar/i }));

    await waitFor(() =>
      expect(screen.getByRole("button")).toHaveTextContent(/selecione o texto manualmente/i)
    );
  });
});
