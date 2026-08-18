export interface Source {
  id: string;
  label: string;
  url: string;
}

export type TutorStatus = "active" | "inactive";

export interface Tutor {
  id: string;
  title: string;
  short_description: string;
  status: TutorStatus;
  system_instructions: string;
  embed_token: string;
  created_at: string;
  updated_at: string;
  sources: Source[];
}

export interface SourceInput {
  label: string;
  url: string;
}

export interface TutorCreateInput {
  title: string;
  short_description: string;
  system_instructions: string;
  sources: SourceInput[];
}

export interface TutorUpdateInput extends Partial<TutorCreateInput> {
  status?: TutorStatus;
}

export interface EmbedSnippet {
  tutor_id: string;
  embed_url: string;
  iframe_snippet: string;
}
