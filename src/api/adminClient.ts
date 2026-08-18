import { apiFetch } from "./client";
import type { EmbedSnippet, Tutor, TutorCreateInput, TutorUpdateInput } from "../types/tutor";

function authHeaders(apiKey: string): HeadersInit {
  return { "X-Admin-Api-Key": apiKey };
}

export function listTutors(apiKey: string): Promise<Tutor[]> {
  return apiFetch<Tutor[]>("/api/admin/tutors", { headers: authHeaders(apiKey) });
}

export function getTutor(apiKey: string, id: string): Promise<Tutor> {
  return apiFetch<Tutor>(`/api/admin/tutors/${id}`, { headers: authHeaders(apiKey) });
}

export function createTutor(apiKey: string, data: TutorCreateInput): Promise<Tutor> {
  return apiFetch<Tutor>("/api/admin/tutors", {
    method: "POST",
    headers: authHeaders(apiKey),
    body: JSON.stringify(data),
  });
}

export function updateTutor(apiKey: string, id: string, data: TutorUpdateInput): Promise<Tutor> {
  return apiFetch<Tutor>(`/api/admin/tutors/${id}`, {
    method: "PATCH",
    headers: authHeaders(apiKey),
    body: JSON.stringify(data),
  });
}

export function deactivateTutor(apiKey: string, id: string): Promise<Tutor> {
  return apiFetch<Tutor>(`/api/admin/tutors/${id}/deactivate`, {
    method: "POST",
    headers: authHeaders(apiKey),
  });
}

export function getEmbedSnippet(apiKey: string, id: string): Promise<EmbedSnippet> {
  return apiFetch<EmbedSnippet>(`/api/admin/tutors/${id}/embed-snippet`, {
    headers: authHeaders(apiKey),
  });
}
