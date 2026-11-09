import type { Request, Response } from "express";

export function handlerReadiness(_req: Request, res: Response): void {
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.send("OK");
}