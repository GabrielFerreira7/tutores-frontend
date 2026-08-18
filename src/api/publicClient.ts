import { apiFetch } from "./client";

export interface ChatResponse {
  session_id: string;
  reply: string;
}

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface ChatHistoryResponse {
  session_id: string;
  messages: ChatHistoryMessage[];
}

export interface PublicTutorInfo {
  id: string;
  title: string;
  short_description: string;
}

export function sendChatMessage(params: {
  tutorId: string;
  embedToken: string;
  sessionId: string | null;
  message: string;
}): Promise<ChatResponse> {
  return apiFetch<ChatResponse>("/api/public/chat", {
    method: "POST",
    body: JSON.stringify({
      tutor_id: params.tutorId,
      embed_token: params.embedToken,
      session_id: params.sessionId,
      message: params.message,
    }),
  });
}

export function getChatHistory(params: {
  tutorId: string;
  embedToken: string;
  sessionId: string;
}): Promise<ChatHistoryResponse> {
  const query = new URLSearchParams({ tutor_id: params.tutorId });
  return apiFetch<ChatHistoryResponse>(
    `/api/public/chat/${params.sessionId}/history?${query.toString()}`,
    { headers: { "X-Embed-Token": params.embedToken } }
  );
}

export function getPublicTutorInfo(params: {
  tutorId: string;
  embedToken: string;
}): Promise<PublicTutorInfo> {
  return apiFetch<PublicTutorInfo>(`/api/public/tutors/${params.tutorId}`, {
    headers: { "X-Embed-Token": params.embedToken },
  });
}
