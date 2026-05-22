# Vellum Workbench

基于 Next.js 16、Better Auth、Drizzle ORM 和 Hono 的后台工作台。

## 当前架构

- `src/app`
  - 页面、布局、Route Handlers、`proxy.ts` 对应的前置跳转体验
- `server/auth`
  - Better Auth 配置、角色归一化、服务端 session 读取
- `server/api`
  - Hono BFF
  - 统一请求上下文、认证/授权中间件、错误响应封装
- `server/db`
  - SQLite / Drizzle 连接、schema、迁移与辅助脚本
- `src/features/*`
  - 按业务域拆分的前端功能模块

## 认证与权限

- 用户认证完全由 Better Auth 承担
- 当前后台业务 API 统一要求 `admin` 角色
- 页面层的 `proxy.ts` 和服务端 layout 只负责体验层跳转
- 真正的鉴权边界在 Hono API 中间件

当前角色模型：

- `admin`
- `member`

兼容说明：

- 历史 `super_admin` 会在运行时被视为 `admin`
- 可运行 `pnpm db:normalize:roles` 将历史角色值写回数据库

## 业务 API 约定

- 成功响应：`{ success: true, data, meta? }`
- 失败响应：`{ success: false, data: null, error }`
- 认证失败：`401`
- 权限不足：`403`
- 参数或引用错误：`400`
- 删除冲突或被引用资源：`409`

## 前端分层约定

- `buyers`、`suppliers` 各自拥有自己的页面容器、query/mutation 和业务动作
- `partners` 只保留纯共享类型、schema 和无数据副作用的 UI 组件
- 列表页统一走服务端分页与搜索，不再本地拉全量后再过滤

## 常用脚本

```bash
pnpm dev
pnpm lint
pnpm build
pnpm db:migrate
pnpm db:seed:admin
pnpm db:normalize:roles
pnpm db:audit:relations
```

## 数据关系体检

在决定是否给业务关系补数据库外键前，先运行：

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
