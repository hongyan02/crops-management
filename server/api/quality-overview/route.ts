import { Hono } from "hono";

import * as controller from "./controller";

const qualityOverviewRoute = new Hono();

qualityOverviewRoute.get("/", controller.list);

export { qualityOverviewRoute };
