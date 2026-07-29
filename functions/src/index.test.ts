import { describe, expect, it, vi } from "vitest";
import { healthCheck } from "./index.js";

type Req = Parameters<typeof healthCheck>[0];
type Res = Parameters<typeof healthCheck>[1];

function createMockResponse(): Res {
  const res = {} as Res;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe("healthCheck", () => {
  it("responds with 200 and an ok status payload", () => {
    const req = {} as Req;
    const res = createMockResponse();

    healthCheck(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: "ok", service: "96-order-functions" });
  });
});
