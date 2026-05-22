import { Hono } from "hono";

import * as controller from "./controller";

const pricesRoute = new Hono();

pricesRoute.get("/", controller.list);
pricesRoute.post("/", controller.create);
pricesRoute.get("/history", controller.history);

export { pricesRoute };
