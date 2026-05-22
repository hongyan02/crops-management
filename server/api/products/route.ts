import { Hono } from "hono";

import * as controller from "./controller";

const productsRoute = new Hono();

productsRoute.get("/", controller.list);
productsRoute.get("/:id", controller.getById);
productsRoute.get("/:id/metrics", controller.listMetrics);
productsRoute.post("/", controller.create);
productsRoute.put("/:id", controller.update);
productsRoute.put("/:id/metrics", controller.updateMetrics);
productsRoute.delete("/:id", controller.remove);

export { productsRoute };
