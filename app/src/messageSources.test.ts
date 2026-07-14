import { describe, expect, it } from "vitest";
import { isAfterIdUnsupported, mergeMessages, messageKey, type SourceMessage } from "./messageSources";

const message = (
  source_id: string,
  id: string,
  created_at: string,
  body = source_id + "-" + id,
): SourceMessage => ({
  id,
  source_id,
  source_label: source_id,
  team: "yuzu",
  from: "alice",
  to: "bob",
  body,
  created_at,
});

describe("mergeMessages", () => {
  it("keeps colliding database ids as separate composite keys", () => {
    const merged = mergeMessages(
      [message("win", "42", "2026-07-14T00:00:00Z")],
      [message("mac", "42", "2026-07-14T00:00:01Z")],
    );
    expect(merged.map(messageKey)).toEqual(["win:42", "mac:42"]);
  });

  it("sorts by timestamp then source and opaque id for stable ties", () => {
    const merged = mergeMessages([], [
      message("win", "10", "2026-07-14T00:00:01Z"),
      message("mac", "2", "2026-07-14T00:00:01Z"),
      message("mac", "1", "2026-07-14T00:00:01Z"),
      message("win", "9", "2026-07-13T23:59:59Z"),
    ]);
    expect(merged.map(messageKey)).toEqual(["win:9", "mac:1", "mac:2", "win:10"]);
  });

  it("detects cores that predate the forward cursor", () => {
    expect(isAfterIdUnsupported("Unknown option: --after-id")).toBe(true);
    expect(isAfterIdUnsupported("ssh connection failed")).toBe(false);
  });

  it("deduplicates overlapping live-poll pages", () => {
    const original = message("mac", "7", "2026-07-14T00:00:00Z", "old");
    const refreshed = { ...original, body: "new" };
    const merged = mergeMessages([original], [refreshed]);
    expect(merged).toHaveLength(1);
    expect(merged[0].body).toBe("new");
  });
});
