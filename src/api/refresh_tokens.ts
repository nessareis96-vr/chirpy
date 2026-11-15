import type { Request, Response, NextFunction } from "express";
import { getBearerToken, makeJWT } from "../auth.js";
import { config } from "../config.js";
import {
  getValidRefreshToken,
  revokeRefreshToken,
} from "../db/queries/refresh_tokens.js";
import { UnauthorizedError } from "../errors.js";

function requireRefreshToken(req: Request): string {
  try {
    return getBearerToken(req);
  } catch {
    throw new UnauthorizedError("Missing or invalid refresh token");
  }
}

export async function handlerRefresh(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const refreshToken = requireRefreshToken(req);
    const record = await getValidRefreshToken(refreshToken);

    if (!record) {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }

    const token = makeJWT(
      record.userId,
      3600,
      config.api.jwtSecret,
    );

    res.status(200).json({ token });
  } catch (err) {
    next(err);
  }
}

export async function handlerRevoke(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const refreshToken = requireRefreshToken(req);

    await revokeRefreshToken(refreshToken);

    res.status(204).end();
  } catch (err) {
    next(err);
  }
}