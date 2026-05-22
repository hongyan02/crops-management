import type { UserRole, UserStatus } from "@server/db/schema/auth";

export type ApiActor = {
  userId: string;
  sessionId: string;
  role: UserRole;
  status: UserStatus;
  email: string;
  name: string;
};

export type AppBindings = {
  Variables: {
    actor: ApiActor;
    requestId: string;
  };
};
