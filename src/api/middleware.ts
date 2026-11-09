import type { Request, Response, NextFunction } from "express";
import { config } from "../config.js";

export function middlewareLogResponses(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const { method, url } = req;

  res.on("finish", () => {
    const statusCode = res.statusCode;

    if (statusCode !== 200) {
      console.log(`[NON-OK] ${method} ${url} - Status: ${statusCode}`);
    }
  });

  next();
}

export function middlewareMetricsInc(
  _req: Request,
  _res: Response,
  next: NextFunction,
): void {
  config.fileserverHits += 1;
  next();
}