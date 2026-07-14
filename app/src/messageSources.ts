export type MessageSource = {
  id: string;
  label: string;
  read_only: boolean;
};

export type SourceMember = {
  source_id: string;
  source_label: string;
  read_only: boolean;
  name: string;
  types: string[];
  project: string;
};

export type SourceMessage = {
  id: string;
  source_id: string;
  source_label: string;
  team: string;
  from: string;
  to: string;
  body: string;
  created_at: string;
};

export const messageKey = (message: SourceMessage) => message.source_id + ":" + message.id;

export const isAfterIdUnsupported = (error: unknown) =>
  /Unknown option:\s*--after-id/.test(String(error));

const compareOpaqueIds = (left: string, right: string) =>
  left.localeCompare(right, undefined, { numeric: true });

export const compareMessages = (left: SourceMessage, right: SourceMessage) =>
  left.created_at.localeCompare(right.created_at) ||
  left.source_id.localeCompare(right.source_id) ||
  compareOpaqueIds(left.id, right.id);

export function mergeMessages(current: SourceMessage[], incoming: SourceMessage[]) {
  const byKey = new Map(current.map((message) => [messageKey(message), message]));
  for (const message of incoming) byKey.set(messageKey(message), message);
  return [...byKey.values()].sort(compareMessages);
}
