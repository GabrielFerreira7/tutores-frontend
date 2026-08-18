import { FormEvent, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getChatHistory, sendChatMessage } from "../api/publicClient";

interface DisplayMessage {
  role: "user" | "assistant";
  content: string;
}

function sessionStorageKey(tutorId: string): string {
  return `tutores_widget_session_${tutorId}`;
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
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tutorId || !token) return;
    const storedSessionId = localStorage.getItem(sessionStorageKey(tutorId));
    if (!storedSessionId) return;

    setSessionId(storedSessionId);
    getChatHistory({ tutorId, embedToken: token, sessionId: storedSessionId })
      .then((history) => {
        setMessages(history.messages.map((m) => ({ role: m.role, content: m.content })));
      })
      .catch(() => {
        localStorage.removeItem(sessionStorageKey(tutorId));
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
      localStorage.setItem(sessionStorageKey(tutorId), response.session_id);
      setMessages((prev) => [...prev, { role: "assistant", content: response.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar a mensagem.");
    } finally {
      setSending(false);
    }
  }

  if (!tutorId || !token) {
    return (
      <div className="widget widget-error-state">
        Parâmetros de embed ausentes. O iframe precisa de <code>tutorId</code> e{" "}
        <code>token</code> na URL.
      </div>
    );
  }

  return (
    <div className="widget">
      <div className="widget-messages">
        {messages.length === 0 && (
          <p className="widget-hint">Envie uma mensagem para começar a conversa.</p>
        )}
        {messages.map((message, index) => (
          <div key={index} className={`widget-message widget-message-${message.role}`}>
            {message.content}
          </div>
        ))}
        {sending && <div className="widget-message widget-message-assistant">Digitando...</div>}
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
