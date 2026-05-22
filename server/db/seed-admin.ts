async function main() {
  process.env.BETTER_AUTH_ALLOW_SIGN_UP = "true";

  const [{ or, eq }, { bootstrapAdminSchema }, { auth }, { db }, { user }] = await Promise.all([
    import("drizzle-orm"),
    import("../../src/lib/validation/auth"),
    import("../auth"),
    import("./index"),
    import("./schema"),
  ]);

  const parsed = bootstrapAdminSchema.safeParse({
    username: process.env.ADMIN_BOOTSTRAP_USERNAME,
    displayName: process.env.ADMIN_BOOTSTRAP_NAME,
    email: process.env.ADMIN_BOOTSTRAP_EMAIL,
    password: process.env.ADMIN_BOOTSTRAP_PASSWORD,
  });

  if (!parsed.success) {
    console.error("Bootstrap admin env is invalid.");
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
  }

  const existing = await db
    .select({
      username: user.username,
      email: user.email,
    })
    .from(user)
    .where(or(eq(user.username, parsed.data.username), eq(user.email, parsed.data.email)))
    .limit(1)
    .then((rows) => rows[0]);

  if (existing) {
    console.log(`Bootstrap admin already exists for ${existing.username ?? existing.email}.`);
    return;
  }

  await auth.api.signUpEmail({
    body: {
      name: parsed.data.displayName,
      email: parsed.data.email,
      password: parsed.data.password,
      username: parsed.data.username,
      displayUsername: parsed.data.displayName,
      role: "admin",
      status: "active",
    },
  });

  console.log(`Created bootstrap admin "${parsed.data.username}".`);
}

main().catch((error) => {
  console.error("Failed to seed bootstrap admin.");
  console.error(error);
  process.exit(1);
});
