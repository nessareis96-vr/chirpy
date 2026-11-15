import type { Request, Response, NextFunction } from "express";
import { BadRequestError } from "../errors.js";

export async function handlerValidateChirp(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body?.body;

    if (typeof body !== "string") {
      throw new BadRequestError("Body must be a string");
    }

    if (body.length > 140) {
      throw new BadRequestError(
        "Chirp is too long. Max length is 140",
      );
    }

    const forbiddenWords = new Set(["kerfuffle", "sharbert", "fornax"]);

    const cleanedBody = body
      .split(" ")
      .map((word) => {
        if (forbiddenWords.has(word.toLowerCase())) {
          return "****";
        }

        return word;
      })
      .join(" ");

    res.status(200).json({
      cleanedBody,
    });
  } catch (err) {
    next(err);
  }
}