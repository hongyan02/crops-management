import { auth } from "@server/auth";
import { toNextJsHandler } from "better-auth/next-js";

const { GET, POST, PATCH, PUT, DELETE } = toNextJsHandler(auth);

export { GET, POST, PATCH, PUT, DELETE };
