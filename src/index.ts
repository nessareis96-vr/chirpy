import express from "express";
import { handlerReadiness } from "./api/readiness.js";
import { middlewareLogResponses, middlewareMetricsInc } from "./api/middleware.js";
import { handlerMetrics, handlerReset } from "./api/metrics.js";

const app = express();
const port = 8080;

app.use(middlewareLogResponses);

app.get("/api/healthz", handlerReadiness);
app.get("/admin/metrics", handlerMetrics);
app.get("/admin/reset", handlerReset);

app.use("/app", middlewareMetricsInc, express.static("./src/app"));

app.listen(port, () => {
  console.log(`Servidor do Chirpy rodando em http://localhost:${port}`);
});