import { describe, expect, it } from "vitest";
import { verifySameOriginRequest } from "@/lib/csrf";

function makeRequest(headers: Record<string, string>): Request {
  return new Request("http://localhost:3000/api/auth/session", { method: "POST", headers });
}

describe("verifySameOriginRequest", () => {
  it("allows a request whose Origin host matches the request's Host header", () => {
    const request = makeRequest({ origin: "http://127.0.0.1:3000", host: "127.0.0.1:3000" });
    expect(verifySameOriginRequest(request)).toBe(true);
  });

  it("denies a request whose Origin host does not match the Host header", () => {
    const request = makeRequest({ origin: "https://evil.example.com", host: "127.0.0.1:3000" });
    expect(verifySameOriginRequest(request)).toBe(false);
  });

  it("is not fooled by request.url reporting a different hostname than the Host header", () => {
    // Regression test: under `next start`, request.url can report "localhost"
    // regardless of the Host header the client actually sent.
    const request = makeRequest({ origin: "http://127.0.0.1:3000", host: "127.0.0.1:3000" });
    expect(new URL(request.url).host).toBe("localhost:3000");
    expect(verifySameOriginRequest(request)).toBe(true);
  });

  it("falls back to Sec-Fetch-Site when Origin is absent", () => {
    expect(verifySameOriginRequest(makeRequest({ "sec-fetch-site": "same-origin" }))).toBe(true);
    expect(verifySameOriginRequest(makeRequest({ "sec-fetch-site": "none" }))).toBe(true);
    expect(verifySameOriginRequest(makeRequest({ "sec-fetch-site": "cross-site" }))).toBe(false);
  });

  it("denies a request with neither Origin nor Sec-Fetch-Site", () => {
    expect(verifySameOriginRequest(makeRequest({}))).toBe(false);
  });
});
