import type { Request, Response, NextFunction } from "express";
import type { users } from "../db/schema.js";
import {
  createUser,
  getUserByEmail,
  updateUser,
} from "../db/queries/users.js";
import {
  hashPassword,
  checkPasswordHash,
  makeJWT,
  makeRefreshToken,
  getBearerToken,
  validateJWT,
} from "../auth.js";
import { BadRequestError, UnauthorizedError } from "../errors.js";
import { config } from "../config.js";
import { createRefreshToken } from "../db/queries/refresh_tokens.js";

type User = typeof users.$inferSelect;
export type UserResponse = Omit<User, "hashedPassword">;

function toUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    email: user.email,
    isChirpyRed: user.isChirpyRed,
  };
}

export async function handlerCreateUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const email = req.body?.email;
    const password = req.body?.password;

    if (
      typeof email !== "string" ||
      email.trim().length === 0 ||
      email.length > 256
    ) {
      throw new BadRequestError(
        "Email must be a non-empty string of at most 256 characters",
      );
    }

    if (typeof password !== "string" || password.length === 0) {
      throw new BadRequestError("Password must be a non-empty string");
    }

    const hashedPassword = await hashPassword(password);

    const user = await createUser({
      email,
      hashedPassword,
    });

    if (!user) {
      throw new BadRequestError("User already exists");
    }

    res.status(201).json(toUserResponse(user));
  } catch (err) {
    next(err);
  }
}

export async function handlerLogin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const email = req.body?.email;
    const password = req.body?.password;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      email.length === 0 ||
      password.length === 0
    ) {
      throw new UnauthorizedError("incorrect email or password");
    }

    const user = await getUserByEmail(email).catch(() => {
      throw new UnauthorizedError("incorrect email or password");
    });

    if (!user) {
      throw new UnauthorizedError("incorrect email or password");
    }

    const passwordMatches = await checkPasswordHash(
      password,
      user.hashedPassword,
    ).catch(() => {
      throw new UnauthorizedError("incorrect email or password");
    });

    if (!passwordMatches) {
      throw new UnauthorizedError("incorrect email or password");
    }

    // Access token: sempre válido por uma hora.
    const token = makeJWT(user.id, 3600, config.api.jwtSecret);

    // Refresh token: válido por 60 dias.
    const refreshToken = makeRefreshToken();
    const sixtyDaysInMilliseconds = 60 * 24 * 60 * 60 * 1000;

    const savedRefreshToken = await createRefreshToken({
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + sixtyDaysInMilliseconds),
      revokedAt: null,
    });

    if (!savedRefreshToken) {
      throw new Error("Failed to save refresh token");
    }

    res.status(200).json({
      ...toUserResponse(user),
      token,
      refreshToken: savedRefreshToken.token,
    });
  } catch (err) {
    next(err);
  }
}

export async function handlerUpdateUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    let userId: string;

    try {
      const token = getBearerToken(req);
      userId = validateJWT(token, config.api.jwtSecret);
    } catch {
      throw new UnauthorizedError("Invalid or missing access token");
    }

    const email = req.body?.email;
    const password = req.body?.password;

    if (
      typeof email !== "string" ||
      email.trim().length === 0 ||
      email.length > 256
    ) {
      throw new BadRequestError(
        "Email must be a non-empty string of at most 256 characters",
      );
    }

    if (typeof password !== "string" || password.length === 0) {
      throw new BadRequestError("Password must be a non-empty string");
    }

    const hashedPassword = await hashPassword(password);

    const user = await updateUser(userId, email, hashedPassword);

    if (!user) {
      throw new UnauthorizedError("User no longer exists");
    }

    res.status(200).json(toUserResponse(user));
  } catch (err) {
    next(err);
  }
}