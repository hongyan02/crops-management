import { Hono } from "hono";
import { cors } from "hono/cors";

import type { AppBindings } from "./context";
import { requireRole, requestContextMiddleware, sessionAuthMiddleware } from "./middleware/auth";
import { handleApiError } from "./response";
import { customLogger } from "../middleware/logger";
import { buyersRoute } from "./buyers/route";
import { priceOverviewRoute } from "./price-overview/route";
import { pricesRoute } from "./prices/route";
import { productsRoute } from "./products/route";
import { qualityOverviewRoute } from "./quality-overview/route";
import { qualityMetricsRoute } from "./quality-metrics/route";
import { suppliersRoute } from "./suppliers/route";

const app = new Hono<AppBindings>().basePath("/api");

app.onError((error, c) => handleApiError(c, error));

app.use(
  "*",
  cors({
    origin: "http://localhost:3000",
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  }),
);

app.get("/health", (c) => c.text("Hono AI SDK example server is running!"));

app.use("*", requestContextMiddleware);
app.use("*", customLogger());
app.use("*", sessionAuthMiddleware);
app.use("*", requireRole("admin"));

// Business routes
app.route("/products", productsRoute);
app.route("/prices", pricesRoute);
app.route("/price-overview", priceOverviewRoute);
app.route("/quality-overview", qualityOverviewRoute);
app.route("/quality-metrics", qualityMetricsRoute);
app.route("/suppliers", suppliersRoute);
app.route("/buyers", buyersRoute);

export { app };

export type AppType = typeof app;
