import { Hono } from "hono";

import * as controller from "./controller";

const qualityMetricsRoute = new Hono();

qualityMetricsRoute.get("/", controller.list);
qualityMetricsRoute.get("/:id", controller.getById);
qualityMetricsRoute.post("/", controller.create);
qualityMetricsRoute.put("/:id", controller.update);
qualityMetricsRoute.delete("/:id", controller.remove);

export { qualityMetricsRoute };
