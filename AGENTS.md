<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# Stack Rules

- Framework: Next.js

- State Management:
  - Zustand for global state

  - React hooks for local component state

  - Zod validation data

- UI:
  - Prefer shadcn/ui components
  - Tansctack Table for Table component
  - React-hook-form for Form component
  - TailwindCSS for styling

- Database:
  - Drizzle ORM

- Authentication:
  - Better Auth

# Architecture Rules

- Server Components by default

- Use Client Components only when interactivity is required

- Keep business logic out of React components

- API route handlers should remain thin

- Database access must be isolated in `/server/db`

- Authentication logic must be isolated in `/server/auth`
<!-- END:nextjs-agent-rules -->

# 设计风格

@DESIGN.md
