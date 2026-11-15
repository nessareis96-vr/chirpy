import type { Request, Response, NextFunction } from "express";
import { config } from "../config.js";
import { deleteAllUsers } from "../db/queries/users.js";
import { ForbiddenError } from "../errors.js";

export function handlerMetrics(_req: Request, res: Response): void {
  res.set("Content-Type", "text/html; charset=utf-8");

  res.send(`<html>
  <body>
    <h1>Welcome, Chirpy Admin</h1>
    <p>Chirpy has been visited ${config.api.fileserverHits} times!</p>
  </body>
</html>`);
}

export async function handlerReset(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (config.api.platform !== "dev") {
      throw new ForbiddenError("Reset is only allowed in dev");
    }

    await deleteAllUsers();
    config.api.fileserverHits = 0;

    res.set("Content-Type", "text/plain; charset=utf-8");
    res.status(200).send("Hits: 0");
  } catch (err) {
    next(err);
  }
}