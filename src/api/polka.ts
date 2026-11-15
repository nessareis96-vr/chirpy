import type { Request, Response, NextFunction } from "express";
import { getAPIKey } from "../auth.js";
import { config } from "../config.js";
import { upgradeUserToChirpyRed } from "../db/queries/users.js";
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from "../errors.js";

export async function handlerPolkaWebhook(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const apiKey = getAPIKey(req);

    if (apiKey !== config.api.polkaKey) {
      throw new UnauthorizedError("Invalid API key");
    }

    if (req.body?.event !== "user.upgraded") {
      res.status(204).end();
      return;
    }

    const userId = req.body?.data?.userId;

    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (typeof userId !== "string" || !uuidPattern.test(userId)) {
      throw new BadRequestError("data.userId must be a valid UUID");
    }

    const user = await upgradeUserToChirpyRed(userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    res.status(204).end();
  } catch (err) {
    next(err);
  }
}