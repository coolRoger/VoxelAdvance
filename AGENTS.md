# AI Agent 项目开发指南

本文件是 AI Agent 在此仓库中工作的首要约定。修改代码前先阅读相关源码、配置与本文件；不要依据其他框架的经验猜测 Solid 2 的行为。

## 项目基线

- 运行时与包管理器：Bun
- 应用框架：SolidJS 2.x，全栈模式，流式 SSR
- 构建工具：Vite 8
- 路由：`@solidjs/router` 2.x + `filesystem-routing`
- 样式：Panda CSS 1.x + Tailwind CSS 4 + DaisyUI 5
- 无头组件：Ark UI Solid；仓库保留 Park UI 配置
- 图标：`lucide-solid`
- 校验：Zod 4
- 格式化与静态检查：Biome 2
- 测试：Vitest 4 + Solid Testing Library
- 路径别名：`@/*` 指向 `src/*`，`styled-system/*` 指向生成目录

依赖的实际安装版本以 `package.json` 和 lockfile 为准。遇到 RC、Next API 时，优先查看仓库源码、类型定义和已安装包文档，不要套用旧版 SolidStart 或 React Router API。

## 开始工作前

1. 阅读 `package.json`、`vite.config.ts`、目标文件及其直接依赖。
2. 用搜索确认仓库已有实现，不重复创建工具、组件或数据访问层。
3. 查看 `git diff`，保留用户已有改动，不重写无关文件。
4. 先确定改动属于客户端、服务端还是共享代码，再选择依赖和目录。
5. 对多文件或行为变化较大的任务，先列出最小改动方案，再编码。

禁止为了“顺手优化”扩大范围。不要升级依赖、替换技术栈、改生成文件或重构无关代码，除非任务明确要求。

## 目录与职责

```text
src/
├── routes/             # 页面路由与 API method handlers
├── lib/                # 可复用业务逻辑、session 与工具
├── App.tsx             # 应用根节点和全局布局
├── Document.tsx        # SSR HTML 文档壳
├── router.ts           # 路由唯一实例
├── middleware.ts       # 所有请求前置中间件链
├── server-config.ts    # server functions / single-flight 配置
└── index.css           # Tailwind、DaisyUI 与全局样式入口
panda.config.ts         # Panda CSS 配置
styled-system/          # Panda 生成代码；不要手工修改
file-routes.d.ts        # 自动生成；不要手工修改
solid-env.d.ts          # 自动生成；不要手工修改
```

新模块应靠近其使用场景。只有被多个功能复用的逻辑才进入通用目录。服务端敏感逻辑应集中在明确的 server-only 模块中，避免从客户端可达的模块导入。

## Solid 2 编码模型

Solid 不是 React。组件函数通常只执行一次，更新由细粒度响应式依赖驱动。

### 必须遵守

- 不写 React hooks、依赖数组、重渲染假设或 React 风格状态同步。
- 响应式值必须通过 accessor 读取，例如 `count()`，不要提前解包后长期保存。
- props 具有响应性；不要随意解构 props。需要派生时使用 accessor、`splitProps` 或 Solid 提供的响应式工具。
- 派生值优先用纯函数或 `createMemo`；副作用才用 `createEffect`。
- 不在 `createMemo`、JSX 读取过程或其他纯计算中写 signal。
- 不用 effect 模拟可直接表达的派生状态，也不要在 effect 中无条件回写其依赖。
- 列表使用 `<For>`，按索引更新场景考虑 `<Index>`；条件使用 `<Show>`、`<Switch>` 等控制流。
- 浏览器 API、DOM 和仅客户端库必须放在客户端生命周期或有明确环境保护的代码路径中。
- 清理订阅、计时器和外部资源时使用 `onCleanup`。
- context、signal、memo 和 effect 在可诊断时添加稳定的 `name`。

### 推荐写法

```tsx
import { createMemo, createSignal, For, Show } from "solid-js";

export function UserList(props: { users: readonly User[] }) {
    const [query, setQuery] = createSignal("", { name: "userSearchQuery" });
    const filteredUsers = createMemo(
        () => props.users.filter((user) => user.name.includes(query())),
        undefined,
        { name: "filteredUsers" },
    );

    return (
        <section>
            <input
                class="input input-bordered"
                value={query()}
                onInput={(event) => setQuery(event.currentTarget.value)}
            />
            <Show when={filteredUsers().length} fallback={<p>暂无结果</p>}>
                <For each={filteredUsers()}>{(user) => <p>{user.name}</p>}</For>
            </Show>
        </section>
    );
}
```

事件处理优先读取 `event.currentTarget`，并为组件输入、服务端返回值和公共函数声明清晰类型。避免无必要的类型断言与 `any`。

## 路由与全栈数据流

路由来自 `src/routes` 文件系统，`src/router.ts` 是客户端渲染与服务端 single-flight collector 共用的唯一实例。不要创建第二套路由实例。

### 页面与路由

- 页面模块默认导出组件。
- 路由元数据使用模块导出的 `route`，并以 `RouteDefinition` 校验。
- 动态、可选和兜底路由沿用当前文件命名规则。
- 页面需要的数据读取应在路由 `preload` 中触发；它同时是 mutation 后 single-flight 刷新的数据清单。
- 不在组件顶层随意发起重复请求。

### Server functions

- 标记 `'use server'` 的函数只在服务端执行；客户端调用会被编译为请求。
- 读取操作用 `query()` 包装，并给缓存键提供稳定、可序列化的参数。
- 写操作用 `action()` 包装；服务端重新校验身份、权限和输入，不能信任 UI 隐藏或客户端校验。
- mutation 影响的查询必须可由目标路由 `preload` 触达，才能获得完整 single-flight 更新。
- 返回值必须可序列化；不要把数据库连接、Request、Response、类实例或函数返回客户端。
- 使用 `getRequestEvent()` 访问当前请求、响应头和 locals，不创建全局可变的请求状态。

### API routes 与中间件

- API route 在 `src/routes` 下导出大写 `GET`、`POST` 等 handler。
- 只有 HTTP 接口、Webhook 或外部客户端需要稳定 URL 时才增加 API route；应用内数据交互优先 server functions。
- handler 返回标准 `Response`，并明确状态码、内容类型和错误结构。
- `src/middleware.ts` 覆盖页面、API 和 server function 请求。中间件保持短小，不承载页面业务逻辑。
- 不把服务端密钥、session 内容、堆栈或内部错误细节暴露给客户端。

## SSR 与安全边界

- render 期间不得依赖 `window`、`document`、`localStorage` 或只在浏览器存在的全局对象。
- SSR 首次输出与客户端首次计算必须一致，避免用随机数、当前时间或客户端存储直接决定首屏 DOM。
- 浏览器专属交互在挂载后初始化，并提供 SSR 可用的静态结构。
- secret 只能从 `virtual:env/server` 或服务端运行时读取。
- `virtual:env/client` 仅用于允许公开的 `VITE_` 变量；进入客户端 bundle 的值都视为公开信息。
- cookie session 是签名而非加密，不写入密码、token 或隐私数据，并控制在浏览器 cookie 大小限制内。
- 所有外部输入在服务端用 Zod 校验；错误响应使用安全、稳定的用户可读消息。
- 涉及用户数据的 mutation 必须检查认证、授权和资源归属。

## 样式系统分工

项目同时使用 Panda CSS、Tailwind CSS 与 DaisyUI。为了避免样式来源混乱，按以下优先级选择：

1. DaisyUI：按钮、输入框、卡片、弹窗、导航、提示等标准 UI 外观。
2. Tailwind：页面布局、间距、响应式规则及少量局部视觉调整。
3. Panda CSS：需要类型安全 token、recipe、复杂变体或可复用设计系统抽象时使用。
4. 原生 CSS：只放全局基础样式、第三方覆盖或上述工具无法清晰表达的规则。

### 样式约定

- 一个组件的同一职责尽量由一种系统承担，不堆叠等价的 Panda、Tailwind 和内联样式。
- DaisyUI 使用语义类与主题色，例如 `btn-primary`、`bg-base-100`、`text-base-content`，避免复制主题色硬编码。
- Tailwind 类名保持静态可扫描；不要用字符串拼接生成不完整类名。
- Panda 样式从 `styled-system` 导入；修改 `panda.config.ts` 后运行 codegen，不编辑 `styled-system`。
- 使用 `class`，不要写 React 的 `className`。
- 组件状态应通过明确变体表达，复杂 class 组合提取为函数或 recipe。
- 响应式设计从窄屏开始，至少检查手机与桌面布局。
- 交互元素要有可见的 hover、focus 和 disabled 状态。
- 图标优先使用 `lucide-solid`，纯图标按钮必须提供可访问名称。

## 组件设计

- 优先编写小而聚焦的 Solid 组件，避免一个页面组件同时处理数据、业务规则和大量展示细节。
- 原生元素和 DaisyUI 能满足需求时，不额外封装无价值的薄组件。
- 需要无头交互行为与可访问性时使用 `@ark-ui/solid`；不要混入 React 版本组件。
- 公共组件 API 使用语义化 props，不暴露内部 CSS 实现细节。
- 支持 `class` 扩展时，明确合并顺序，避免调用方样式被意外覆盖。
- 表单优先使用原生语义、label、正确的 input type 和渐进增强；提交按钮应表达 pending 与错误状态。
- 页面必须处理 loading、empty、error、success 等真实状态，不只实现理想路径。

## TypeScript 与代码风格

- 保持 `strict`，不通过关闭类型检查解决问题。
- 公共边界、组件 props、服务端输入输出应显式建模；局部可推断类型不必重复标注。
- 优先使用 `unknown` 后缩窄，不把不可信数据声明成业务类型。
- import 使用 `@/` 与 `styled-system/` 别名，避免深层相对路径。
- 文件命名延续所在目录惯例；组件使用 PascalCase，普通函数与变量使用 camelCase。
- 不保留注释掉的代码、调试日志或无解释的 magic number。
- 注释解释约束与原因，不复述代码。
- Biome 采用 4 空格缩进、80 字符行宽和自动整理 import；不要手工制造相反格式。

## 依赖与生成文件

- 默认使用 Bun 与现有 `bun.lock`；不要混用包管理器更新多个 lockfile。
- 安装新依赖前确认现有依赖不能解决，并说明引入理由。
- 不直接编辑 `styled-system/`、`file-routes.d.ts`、`solid-env.d.ts`、`dist/`。
- Panda 配置或 recipe 变化后运行 `bun run prepare`。
- 不提交 `.env`、凭据、构建产物或本机文件；发现 `.DS_Store` 等文件时不要在无关任务中扩散它们。

## 验证流程

根据改动范围执行最小充分验证，并在交付时说明运行过的命令与结果。

```bash
bun run format
bunx tsc --noEmit
bun run build
```

如果已有相关测试，先运行定向测试，再运行完整测试。新增业务规则、server function、session、安全边界或复杂交互时，应补充测试。不要为了让测试通过而删除断言、跳过用例或弱化类型。

当前 `package.json` 不一定包含所有质量命令；调用前先确认 script。若发现缺少预期脚本，应直接运行对应工具或在交付说明中指出，不要虚构通过结果。

## 响应式诊断

调试“不更新、更新次数过多或变慢”等响应式问题时，必须收集证据而不是猜测。

已安装依赖提供与当前版本匹配的指南：

- `node_modules/solid-js/skills/reactivity-diagnostics/SKILL.md`
- `node_modules/@solidjs/diagnostics/skills/agent-loops/SKILL.md`

测试中使用 `captureArtifact()` 和 `@solidjs/diagnostics/vitest` 的 matcher，例如 `toHaveNoDiagnostics`、`toStayWithinRerunBudget`、`toHaveNoWaste`。

开发服务器已启用 `diagnostics: true`。在有页面连接时可使用：

- `GET /__solid/diagnostics` 查看状态与客户端数量。
- `POST /__solid/diagnostics`，传入 `{"method":"begin"}` 和 `{"method":"end"}` 捕获会话。
- `{"method":"whyDidRun","params":{"name":"<scope name>"}}` 查询命名 scope 的重跑原因。
- `{"method":"costs"}` 查看运行成本。

测试或浏览器控制台出现 Solid 诊断码时，先阅读版本匹配的 repair guide，并按对应条目修复。

## 完成标准

一次改动只有在以下条件满足后才可视为完成：

- 实现符合用户要求，且没有混入无关重构。
- Solid 响应式模型、SSR 与客户端/服务端边界正确。
- 服务端输入、权限和敏感数据得到适当保护。
- 页面具备必要的加载、空、错误和交互状态。
- 样式遵守 DaisyUI、Tailwind 与 Panda 的职责划分，并兼顾响应式与可访问性。
- 格式化、类型检查、相关测试和构建已按改动范围验证；未验证项必须明确说明。
- 最终说明列出主要修改、验证结果、已知限制或后续风险。
