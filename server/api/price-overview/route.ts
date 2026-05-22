import { Hono } from "hono";

import * as controller from "./controller";

const priceOverviewRoute = new Hono();

priceOverviewRoute.get("/", controller.list);

export { priceOverviewRoute };
