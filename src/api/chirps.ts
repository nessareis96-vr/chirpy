import type { Request, Response, NextFunction } from "express";
import {
  createChirp,
  getAllChirps,
  getChirpById,
  deleteChirp,
} from "../db/queries/chirps.js";
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
} from "../errors.js";
import { getBearerToken, validateJWT } from "../auth.js";
import { config } from "../config.js";

export async function handlerCreateChirp(
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
      throw new UnauthorizedError("Invalid or missing authentication token");
    }

    const body = req.body?.body;

    if (typeof body !== "string") {
      throw new BadRequestError("Body must be a string");
    }

    if (body.length > 140) {
      throw new BadRequestError("Chirp is too long. Max length is 140");
    }

    const forbiddenWords = new Set([
      "kerfuffle",
      "sharbert",
      "fornax",
    ]);

    const cleanedBody = body
      .split(" ")
      .map((word) => {
        return forbiddenWords.has(word.toLowerCase()) ? "****" : word;
      })
      .join(" ");

    const chirp = await createChirp({
      body: cleanedBody,
      userId,
    });

    if (!chirp) {
      throw new Error("Failed to create chirp");
    }

    res.status(201).json({
      id: chirp.id,
      createdAt: chirp.createdAt,
      updatedAt: chirp.updatedAt,
      body: chirp.body,
      userId: chirp.userId,
    });
  } catch (err) {
    next(err);
  }
}

export async function handlerGetChirps(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authorId = req.query.authorId;
    const sort = req.query.sort ?? "asc";

    if (authorId !== undefined) {
      const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (
        typeof authorId !== "string" ||
        !uuidPattern.test(authorId)
      ) {
        throw new BadRequestError("authorId must be a valid UUID");
      }
    }

    if (sort !== "asc" && sort !== "desc") {
      throw new BadRequestError("sort must be asc or desc");
    }

    const chirps = await getAllChirps(authorId);

    chirps.sort((a, b) => {
      const difference =
        a.createdAt.getTime() - b.createdAt.getTime();

      return sort === "asc" ? difference : -difference;
    });

    res.status(200).json(chirps);
  } catch (err) {
    next(err);
  }
}

export async function handlerGetChirp(
  req: Request<{ chirpId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { chirpId } = req.params;

    const chirp = await getChirpById(chirpId);

    if (!chirp) {
      throw new NotFoundError("Chirp not found");
    }

    res.status(200).json(chirp);
  } catch (err) {
    next(err);
  }
}
export async function handlerDeleteChirp(
  req: Request<{ chirpId: string }>,
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

    const { chirpId } = req.params;
    const chirp = await getChirpById(chirpId);

    if (!chirp) {
      throw new NotFoundError("Chirp not found");
    }

    if (chirp.userId !== userId) {
      throw new ForbiddenError("You can only delete your own chirps");
    }

    const deletedChirp = await deleteChirp(chirpId, userId);

    if (!deletedChirp) {
      throw new NotFoundError("Chirp not found");
    }

    res.status(204).end();
  } catch (err) {
    next(err);
  }
}