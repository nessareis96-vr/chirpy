import * as argon2 from "argon2";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { BadRequestError, UnauthorizedError } from "./errors.js";
import type { Request } from "express";
import { randomBytes } from "node:crypto";

type TokenPayload = Pick<JwtPayload, "iss" | "sub" | "iat" | "exp">;

export async function hashPassword(password: string): Promise<string> {
  return await argon2.hash(password);
}

export async function checkPasswordHash(
  password: string,
  hash: string,
): Promise<boolean> {
  return await argon2.verify(hash, password);
}

export function makeJWT(
  userID: string,
  expiresIn: number,
  secret: string,
): string {
  const issuedAt = Math.floor(Date.now() / 1000);

  const payload: TokenPayload = {
    iss: "chirpy",
    sub: userID,
    iat: issuedAt,
    exp: issuedAt + expiresIn,
  };

  return jwt.sign(payload, secret, {
    algorithm: "HS256",
  });
}

export function validateJWT(
  tokenString: string,
  secret: string,
): string {
  try {
    const payload = jwt.verify(tokenString, secret, {
      algorithms: ["HS256"],
      issuer: "chirpy",
    });

    if (
      typeof payload === "string" ||
      typeof payload.sub !== "string" ||
      payload.sub.length === 0
    ) {
      throw new UnauthorizedError("Invalid token");
    }

    return payload.sub;
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }
}
export function extractBearerToken(
  authorization: string | undefined,
): string {
  if (!authorization) {
    throw new BadRequestError("Missing Authorization header");
  }

  const parts = authorization.trim().split(/\s+/);

  if (
    parts.length !== 2 ||
    parts[0] !== "Bearer" ||
    !parts[1]
  ) {
    throw new BadRequestError("Invalid Authorization header");
  }

  return parts[1];
}

export function getBearerToken(req: Request): string {
  const authorization = req.get("Authorization");

  return extractBearerToken(authorization);
}

export function makeRefreshToken(): string {
  return randomBytes(32).toString("hex");
}
export function getAPIKey(req: Request): string {
  const authorization = req.get("Authorization");

  if (!authorization) {
    throw new UnauthorizedError("Missing API key");
  }

  const parts = authorization.trim().split(/\s+/);

  if (
    parts.length !== 2 ||
    parts[0] !== "ApiKey" ||
    !parts[1]
  ) {
    throw new UnauthorizedError("Invalid API key header");
  }

  return parts[1];
}