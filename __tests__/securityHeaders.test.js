import security from "@/lib/security";

const { getSecurityHeaders } = security;

describe("getSecurityHeaders", () => {
  it("returns a strong set of security headers for the app", () => {
    const headers = getSecurityHeaders();

    expect(headers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "X-Frame-Options", value: "DENY" }),
        expect.objectContaining({ key: "X-Content-Type-Options", value: "nosniff" }),
        expect.objectContaining({ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }),
        expect.objectContaining({ key: "Permissions-Policy", value: expect.stringContaining("geolocation=()") }),
        expect.objectContaining({ key: "Cross-Origin-Opener-Policy", value: "same-origin" }),
      ])
    );

    expect(headers.some((header) => header.key === "X-Powered-By")).toBe(false);
  });
});
