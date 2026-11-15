import { describe, it, expect, beforeAll } from "vitest";
import jwt from "jsonwebtoken";
import {
  hashPassword,
  checkPasswordHash,
  makeJWT,
  validateJWT,
  extractBearerToken,
  getAPIKey,
} from "./auth.js";
import type { Request } from "express";
import { BadRequestError, UnauthorizedError } from "./errors.js";

describe("Password Hashing", () => {
  const password = "correctPassword123!";
  let hash: string;

  beforeAll(async () => {
    hash = await hashPassword(password);
  });

  it("accepts the correct password", async () => {
    const result = await checkPasswordHash(password, hash);

    expect(result).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const result = await checkPasswordHash("wrongPassword", hash);

    expect(result).toBe(false);
  });
});

describe("JWT", () => {
  const userID = "123e4567-e89b-12d3-a456-426614174000";
  const secret = "secret-used-only-in-unit-tests";

  it("creates a valid token and returns the user ID", () => {
    const token = makeJWT(userID, 3600, secret);

    expect(validateJWT(token, secret)).toBe(userID);
  });

  it("includes the expected payload and expiration interval", () => {
    const before = Math.floor(Date.now() / 1000);
    const token = makeJWT(userID, 3600, secret);
    const after = Math.floor(Date.now() / 1000);

    const payload = jwt.verify(token, secret);

    if (
      typeof payload === "string" ||
      typeof payload.iat !== "number"
    ) {
      throw new Error("Unexpected token payload");
    }

    expect(payload.iss).toBe("chirpy");
    expect(payload.sub).toBe(userID);
    expect(payload.iat).toBeGreaterThanOrEqual(before);
    expect(payload.iat).toBeLessThanOrEqual(after);
    expect(payload.exp).toBe(payload.iat + 3600);
  });

  it("rejects an expired token", () => {
    const token = makeJWT(userID, -60, secret);

    expect(() => validateJWT(token, secret))
      .toThrow(UnauthorizedError);
  });

  it("rejects a token signed with a different secret", () => {
    const token = makeJWT(userID, 3600, "different-secret");

    expect(() => validateJWT(token, secret))
      .toThrow(UnauthorizedError);
  });

  it("rejects a malformed token", () => {
    expect(() => validateJWT("invalid-token", secret))
      .toThrow(UnauthorizedError);
  });

  it("rejects a token without a user ID", () => {
    const token = jwt.sign(
      { iss: "chirpy" },
      secret,
      { algorithm: "HS256", expiresIn: 3600 },
    );

    expect(() => validateJWT(token, secret))
      .toThrow(UnauthorizedError);
  });

  it("rejects a token from another issuer", () => {
    const token = jwt.sign(
      { iss: "another-app", sub: userID },
      secret,
      { algorithm: "HS256", expiresIn: 3600 },
    );

    expect(() => validateJWT(token, secret))
      .toThrow(UnauthorizedError);
  });
});

describe("Bearer Tokens", () => {
  it("extracts the token from a valid header", () => {
    const token = extractBearerToken("Bearer abc.def.ghi");

    expect(token).toBe("abc.def.ghi");
  });

  it("removes surrounding whitespace", () => {
    const token = extractBearerToken("  Bearer abc.def.ghi  ");

    expect(token).toBe("abc.def.ghi");
  });

  it("accepts multiple spaces between scheme and token", () => {
    const token = extractBearerToken("Bearer   abc.def.ghi");

    expect(token).toBe("abc.def.ghi");
  });

  it("rejects a missing header", () => {
    expect(() => extractBearerToken(undefined))
      .toThrow(BadRequestError);
  });

  it("rejects an empty header", () => {
    expect(() => extractBearerToken(""))
      .toThrow(BadRequestError);
  });

  it("rejects a whitespace-only header", () => {
    expect(() => extractBearerToken("   "))
      .toThrow(BadRequestError);
  });

  it("rejects another authentication scheme", () => {
    expect(() => extractBearerToken("Basic abc.def.ghi"))
      .toThrow(BadRequestError);
  });

  it("rejects a missing token", () => {
    expect(() => extractBearerToken("Bearer"))
      .toThrow(BadRequestError);
  });

  it("rejects a whitespace-only token", () => {
    expect(() => extractBearerToken("Bearer   "))
      .toThrow(BadRequestError);
  });

  it("rejects extra parts after the token", () => {
    expect(() => extractBearerToken("Bearer abc.def.ghi extra"))
      .toThrow(BadRequestError);
  });
});

describe("API Keys", () => {
  function requestWithAuthorization(
    authorization: string | undefined,
  ): Request {
    return {
      get: (header: string) =>
        header.toLowerCase() === "authorization"
          ? authorization
          : undefined,
    } as Request;
  }

  it("extracts the API key", () => {
    const req = requestWithAuthorization("ApiKey test-key");

    expect(getAPIKey(req)).toBe("test-key");
  });

  it("handles surrounding and repeated whitespace", () => {
    const req = requestWithAuthorization("  ApiKey   test-key  ");

    expect(getAPIKey(req)).toBe("test-key");
  });

  it("rejects a missing header", () => {
    const req = requestWithAuthorization(undefined);

    expect(() => getAPIKey(req)).toThrow(UnauthorizedError);
  });

  it("rejects another authentication scheme", () => {
    const req = requestWithAuthorization("Bearer test-key");

    expect(() => getAPIKey(req)).toThrow(UnauthorizedError);
  });

  it("rejects an empty key", () => {
    const req = requestWithAuthorization("ApiKey   ");

    expect(() => getAPIKey(req)).toThrow(UnauthorizedError);
  });

  it("rejects extra parts", () => {
    const req = requestWithAuthorization("ApiKey test-key extra");

    expect(() => getAPIKey(req)).toThrow(UnauthorizedError);
  });
});
