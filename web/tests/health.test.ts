import { describe, expect, it } from "vitest";

describe("GET /api/health", () => {
  it("answers ok after touching the database, and is never cached", async () => {
    const { GET } = await import("@/app/api/health/route");
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });
});
