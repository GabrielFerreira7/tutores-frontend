import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
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
});
