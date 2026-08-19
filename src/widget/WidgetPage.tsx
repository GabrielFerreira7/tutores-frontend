import { FormEvent, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { getChatHistory, getPublicTutorInfo, sendChatMessage } from "../api/publicClient";

interface DisplayMessage {
  role: "user" | "assistant";
  content: string;
}

function sessionStorageKey(tutorId: string): string {
  return `tutores_widget_session_${tutorId}`;
}

// O widget roda dentro de um <iframe> cross-origin em qualquer site integrador. Navegadores
// com bloqueio de armazenamento de terceiros (aba anônima do Chrome por padrão, Safari com
// ITP) lançam SecurityError ao tocar em localStorage nesse contexto — sem o try/catch, isso
// derrubava o widget inteiro para uma tela em branco. Aqui a conversa continua funcionando
// dentro da sessão atual, só não sobrevive a um reload do iframe.
function readStoredSessionId(tutorId: string): string | null {
  try {
    return localStorage.getItem(sessionStorageKey(tutorId));
  } catch {
    return null;
  }
}

function writeStoredSessionId(tutorId: string, sessionId: string): void {
  try {
    localStorage.setItem(sessionStorageKey(tutorId), sessionId);
  } catch {
    // Armazenamento indisponível — a sessão fica só em memória para este carregamento.
  }
}

function clearStoredSessionId(tutorId: string): void {
  try {
    localStorage.removeItem(sessionStorageKey(tutorId));
  } catch {
    // Nada a limpar se nunca foi possível escrever.
  }
}

export function WidgetPage() {
  const [searchParams] = useSearchParams();
  const tutorId = searchParams.get("tutorId") ?? "";
  const token = searchParams.get("token") ?? "";

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tutorTitle, setTutorTitle] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tutorId || !token) return;

    getPublicTutorInfo({ tutorId, embedToken: token })
      .then((info) => setTutorTitle(info.title))
      .catch(() => {
        // Sem nome de tutor não é uma falha fatal para o widget — segue sem cabeçalho.
      });

    const storedSessionId = readStoredSessionId(tutorId);
    if (!storedSessionId) return;

    setSessionId(storedSessionId);
    getChatHistory({ tutorId, embedToken: token, sessionId: storedSessionId })
      .then((history) => {
        setMessages(history.messages.map((m) => ({ role: m.role, content: m.content })));
      })
      .catch(() => {
        clearStoredSessionId(tutorId);
        setSessionId(null);
      });
  }, [tutorId, token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(event: FormEvent) {
    event.preventDefault();
    const message = input.trim();
    if (!message || !tutorId || !token || sending) return;

    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setInput("");
    setSending(true);
    setError(null);

    try {
      const response = await sendChatMessage({ tutorId, embedToken: token, sessionId, message });
      setSessionId(response.session_id);
      writeStoredSessionId(tutorId, response.session_id);
      setMessages((prev) => [...prev, { role: "assistant", content: response.reply }]);
    } catch (err) {
      // A mensagem otimista é desfeita e o texto volta pro campo — evita que o usuário
      // veja a pergunta "enviada" quando na verdade falhou, sem jeito claro de reenviar.
      setMessages((prev) => prev.slice(0, -1));
      setInput(message);
      setError(err instanceof Error ? err.message : "Não foi possível enviar a mensagem.");
    } finally {
      setSending(false);
    }
  }

  if (!tutorId || !token) {
    return (
      <div className="widget widget-error-state">
        Parâmetros de embed ausentes. O iframe precisa de <code>tutorId</code> e <code>token</code>{" "}
        na URL.
      </div>
    );
  }

  return (
    <div className="widget">
      {tutorTitle && (
        <div className="widget-header">
          <span className="widget-header-title">{tutorTitle}</span>
        </div>
      )}
      <div className="widget-messages">
        {messages.length === 0 && (
          <p className="widget-hint">Envie uma mensagem para começar a conversa.</p>
        )}
        {messages.map((message, index) => (
          <div key={index} className={`widget-message widget-message-${message.role}`}>
            {message.role === "assistant" ? (
              <ReactMarkdown>{message.content}</ReactMarkdown>
            ) : (
              message.content
            )}
          </div>
        ))}
        {sending && (
          <div className="widget-message widget-message-assistant" role="status" aria-live="polite">
            Digitando...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p role="alert" className="widget-error">
          {error}
        </p>
      )}

      <form className="widget-input" onSubmit={handleSend}>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Digite sua mensagem..."
          disabled={sending}
          aria-label="Mensagem"
        />
        <button type="submit" disabled={sending || !input.trim()}>
          Enviar
        </button>
      </form>
    </div>
  );
}
