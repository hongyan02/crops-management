# Vellum Workbench

基于 Next.js 16、React 19、Better Auth、Drizzle ORM、PostgreSQL 和 Hono 的业务管理工作台。

当前模块覆盖产品目录、质量指标、供应商、采购商、价格管理、价格看板和产品质量总览。项目已从 SQLite 迁移到 PostgreSQL，当前只保留 PostgreSQL 迁移目录。

## 技术栈

- Framework: Next.js 16 App Router
- UI: React 19, Tailwind CSS 4, shadcn/ui 风格组件, Base UI, lucide-react
- State/Data: React hooks, TanStack Query, Axios
- Forms/Validation: react-hook-form, Zod, drizzle-zod
- API: Hono BFF mounted at `/api/[...route]`
- Auth: Better Auth, username + password, Drizzle adapter
- Database: PostgreSQL, Drizzle ORM, `pg`
- Charts: ECharts, echarts-for-react

## 本地启动

1. 安装依赖：

```bash
pnpm install
```

2. 准备环境变量：

```bash
cp .env.example .env
```

至少需要配置：

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/tradedb
BETTER_AUTH_SECRET=replace-this-with-a-long-random-secret
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_COOKIE_NAME=user_auth
DATABASE_POOL_MAX=10
```

3. 执行数据库迁移：

```bash
pnpm db:migrate
```

4. 创建管理员账号：

```bash
pnpm db:seed:admin
```

管理员初始化脚本读取这些变量：

```bash
ADMIN_BOOTSTRAP_USERNAME=paper.admin
ADMIN_BOOTSTRAP_NAME=Paper Admin
ADMIN_BOOTSTRAP_EMAIL=paper.admin@example.com
ADMIN_BOOTSTRAP_PASSWORD=replace-this-with-a-strong-password
```

5. 启动开发服务：

```bash
pnpm dev
```

默认使用 webpack 开发模式。需要测试 Turbopack 时可运行：

```bash
pnpm dev:turbo
```

## 常用脚本

```bash
pnpm dev
pnpm dev:turbo
pnpm lint
pnpm build
pnpm start
pnpm db:generate
pnpm db:migrate
pnpm db:seed:admin
pnpm db:normalize:roles
pnpm db:audit:relations
```

- `db:generate`: 根据当前 Drizzle schema 生成迁移。
- `db:migrate`: 应用 `server/db/pg-migrations` 中的 PostgreSQL 迁移。
- `db:seed:admin`: 创建或补齐管理员账号。
- `db:normalize:roles`: 将历史角色值归一化。
- `db:audit:relations`: 检查业务关系是否存在孤儿数据。

## 项目结构

```text
src/app                 Next.js 页面、布局、Route Handlers
src/actions             Server Actions
src/components          通用 UI 与工作台壳层组件
src/config              前端 API 配置
src/features            按业务域拆分的前端模块
src/hooks               通用客户端 hooks
src/lib                 请求、分页、工具函数与校验
server/api              Hono BFF、路由、控制器和业务服务
server/auth             Better Auth 配置、角色和 session helper
server/db               PostgreSQL 连接、Drizzle schema、迁移与维护脚本
server/middleware       服务端中间件
```

## 路由

页面路由：

- `/`: 首页入口
- `/sign-in`: 登录页
- `/sign-up`: 注册关闭提示页
- `/403`: 无权限页
- `/dashboard`: 工作台入口
- `/products`: 基础信息
- `/quality`: 产品质量总览
- `/prices`: 价格管理
- `/price-overview`: 价格看板
- `/suppliers`: 供应商管理
- `/buyers`: 采购商管理

API Route Handlers：

- `/api/auth/[...all]`: Better Auth
- `/api/[...route]`: Hono BFF

Hono 业务 API：

- `GET /api/health`
- `/api/products`
- `/api/quality-metrics`
- `/api/quality-overview`
- `/api/prices`
- `/api/price-overview`
- `/api/suppliers`
- `/api/buyers`

## 架构约定

- Server Components 默认优先；只有交互、表单、图表和客户端数据请求才使用 Client Components。
- 前端页面保持 `src/app -> src/features -> hooks/queries/services -> src/lib/request` 的方向。
- `src/features/catalog` 承载跨模块共享的产品目录读侧能力。
- `src/features/products` 保留产品管理页面和写侧操作。
- `src/features/partners` 只放供应商/采购商共享的无副作用 UI 和 schema。
- API route handler 只负责把请求交给 Hono；业务 API 保持 `route -> controller -> services`。
- 数据库访问集中在 `server/db` 和 `server/api/*/services.ts`，不要在 React 组件里直接访问数据库。
- 认证逻辑集中在 `server/auth`，业务 API 的实际权限边界在 Hono 中间件。

## 认证与权限

- 用户认证由 Better Auth 承担。
- 登录方式为用户名 + 密码。
- 默认关闭公开注册；`/sign-up` 仅展示关闭提示。
- 当前后台业务 API 统一要求 `admin` 角色。
- 页面层的 `proxy.ts` 和受保护 layout 负责跳转体验。
- 真正的 API 鉴权在 `server/api/middleware/auth.ts`。

角色模型：

- `admin`
- `member`

兼容说明：

- 历史 `super_admin` 会在运行时视为 `admin`。
- 可运行 `pnpm db:normalize:roles` 将历史角色值写回数据库。

## API 响应约定

成功响应：

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

失败响应：

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误说明",
    "details": {}
  }
}
```

状态码约定：

- `400`: 参数或引用错误
- `401`: 未登录
- `403`: 权限不足
- `404`: 资源不存在
- `409`: 删除冲突或被引用资源
- `500`: 服务端错误

## 数据库与迁移

当前数据库为 PostgreSQL。

- Drizzle schema: `server/db/schema`
- 当前迁移目录: `server/db/pg-migrations`
- 迁移入口: `server/db/migrate.ts`
- 连接配置: `server/db/config.ts`

历史 SQLite 迁移目录和 SQLite 到 PostgreSQL 的一次性迁移脚本已清理。不要再新增 `server/db/migrations` 或 `db:migrate:data` 入口。

在决定是否补数据库外键前，先运行：

```bash
pnpm db:audit:relations
```

它会检查这些表是否存在孤儿数据：

- `product_metrics`
- `buyer_products`
- `buyer_requirements`
- `supplier_products`
- `supplier_quality`

只有体检干净、删除语义明确后，才适合进入下一轮外键迁移。

## Vercel 部署

- `DATABASE_URL` 必须指向 PostgreSQL 连接串，例如 `postgresql://user:password@host:5432/tradedb`。
- `DATABASE_POOL_MAX` 可调整连接池上限，默认值为 `10`。
- `BETTER_AUTH_SECRET` 必须使用生产级随机值。
- `BETTER_AUTH_URL` 必须指向线上域名。
- `BETTER_AUTH_COOKIE_NAME` 需要与 `proxy.ts` 读取逻辑保持一致，默认是 `user_auth`。
- 不要依赖仓库里的 `.env` 作为生产配置，生产变量应在 Vercel Project Settings -> Environment Variables 中维护。
- 部署后先运行数据库迁移，再访问业务页面。

## 维护清单

- 新增业务模块时，同步补齐 `src/features/*`、`server/api/*`、`src/config/api.ts` 和导航配置。
- 新增 API 时保持统一响应 envelope，不要在 controller 里绕过 `server/api/response.ts`。
- 新增数据库表时使用 `server/db/pg-migrations`，不要恢复旧 SQLite 迁移目录。
- 新增列表页时优先服务端分页、搜索和筛选，不要一次性拉全量后前端过滤。
- 删除主数据前先确认引用约束和 `409` 语义，必要时先运行 `pnpm db:audit:relations`。
