import { Hono } from "hono";

import * as controller from "./controller";

const buyersRoute = new Hono();

buyersRoute.get("/", controller.list);
buyersRoute.post("/", controller.create);
buyersRoute.put("/:id", controller.update);
buyersRoute.get("/:id/products", controller.listProducts);
buyersRoute.put("/:id/products", controller.updateProducts);
buyersRoute.get("/:id/products/:productId/requirements", controller.listRequirements);
buyersRoute.put("/:id/products/:productId/requirements", controller.updateRequirements);

export { buyersRoute };
