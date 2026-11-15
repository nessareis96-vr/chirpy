import express from "express";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import {
  handlerCreateUser,
  handlerLogin,
  handlerUpdateUser,
} from "./api/users.js";

import { config } from "./config.js";
import { handlerReadiness } from "./api/readiness.js";
import {
  middlewareLogResponses,
  middlewareMetricsInc,
} from "./api/middleware.js";
import { handlerMetrics, handlerReset } from "./api/metrics.js";
import {
  handlerCreateChirp,
  handlerGetChirps,
  handlerGetChirp,
  handlerDeleteChirp,
} from "./api/chirps.js";
import { middlewareErrorHandler } from "./api/errors.js";

import { handlerPolkaWebhook } from "./api/polka.js";

import {
  handlerRefresh,
  handlerRevoke,
} from "./api/refresh_tokens.js";

const migrationClient = postgres(config.db.url, { max: 1 });

try {
  await migrate(drizzle(migrationClient), config.db.migrationConfig);
} finally {
  await migrationClient.end();
}

const app = express();

app.use(middlewareLogResponses);
app.use(express.json());

app.get("/api/healthz", handlerReadiness);
app.post("/api/users", handlerCreateUser);
app.put("/api/users", handlerUpdateUser);
app.post("/api/login", handlerLogin);
app.post("/api/chirps", handlerCreateChirp);
app.get("/api/chirps", handlerGetChirps);
app.get("/api/chirps/:chirpId", handlerGetChirp);
app.delete("/api/chirps/:chirpId", handlerDeleteChirp);
app.post("/api/polka/webhooks", handlerPolkaWebhook);

app.get("/admin/metrics", handlerMetrics);
app.post("/admin/reset", handlerReset);

app.post("/api/refresh", handlerRefresh);
app.post("/api/revoke", handlerRevoke);

app.use("/app", middlewareMetricsInc, express.static("./src/app"));

app.use(middlewareErrorHandler);

app.listen(config.api.port, () => {
  console.log(
    `Servidor do Chirpy rodando em http://localhost:${config.api.port}`,
  );
});