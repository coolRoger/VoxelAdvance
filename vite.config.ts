import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import solid from "@solidjs/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { pick } from "es-toolkit/compat";
import { fileRoutes } from "filesystem-routing/vite";
import { nitro } from "nitro/vite";
import { loadEnv, type Plugin } from "vite";
import { defineConfig } from "vitest/config";

function mgbaAssets(): Plugin {
    const require = createRequire(import.meta.url);
    const runtimeRoot = path.dirname(require.resolve("@thenick775/mgba-wasm"));
    const assets = [
        { name: "mgba.js", type: "text/javascript; charset=utf-8" },
        { name: "mgba.wasm", type: "application/wasm" },
    ];

    return {
        name: "mgba-raw-assets",
        // Install before Vite's JS transforms and the SSR request handler.
        enforce: "pre",
        configureServer(server) {
            const base = server.config.base;
            server.middlewares.use(async (request, response, next) => {
                const pathname = request.url?.split("?", 1)[0];
                const asset = assets.find(
                    ({ name }) => pathname === `${base}emulator/mgba/${name}`,
                );
                if (!asset) return next();
                if (request.method !== "GET" && request.method !== "HEAD") {
                    response.statusCode = 405;
                    response.setHeader("Allow", "GET, HEAD");
                    response.end();
                    return;
                }
                try {
                    // Keep Emscripten's import.meta.url and worker code intact.
                    const source = await readFile(
                        path.join(runtimeRoot, asset.name),
                    );
                    response.setHeader("Content-Type", asset.type);
                    response.setHeader("Content-Length", source.byteLength);
                    response.setHeader("Cache-Control", "no-cache");
                    response.setHeader(
                        "Cross-Origin-Embedder-Policy",
                        "require-corp",
                    );
                    response.setHeader(
                        "Cross-Origin-Opener-Policy",
                        "same-origin",
                    );
                    response.end(
                        request.method === "HEAD" ? undefined : source,
                    );
                } catch (error) {
                    next(error);
                }
            });
        },
        async generateBundle() {
            if (this.environment.name !== "client") return;
            for (const asset of assets) {
                this.emitFile({
                    type: "asset",
                    fileName: `emulator/mgba/${asset.name}`,
                    source: await readFile(path.join(runtimeRoot, asset.name)),
                });
            }
        },
    };
}

export default defineConfig(({ mode }) => {
    const sys_env = loadEnv(mode, process.cwd(), "");

    const env = {
        ...pick(sys_env, [
            "SESSION_SECRET",
            "VITE_APP_NAME",
            "APP_PORT",
            "APP_URL",
            "USE_NITRO",
        ]),
    } as const;

    return {
        // Turnkey streaming SSR: no index.html and no entry files — the plugin
        // generates the entries around src/App.tsx, wrapped in src/Document.tsx.
        // VERCEL=1 时由 Nitro 生成 Vercel 产物；否则由 Solid 输出
        // dist/client 和 dist/server/server.js，供 bun server.ts 启动。
        environments: {
            ssr: {
                define: {
                    "process.env": env,
                },
            },
        },
        define: {
            "process.env": {
                VITE_APP_NAME: env.VITE_APP_NAME,
            },
        },
        plugins: [
            mgbaAssets(),
            tailwindcss(),
            solid({
                start: {
                    // Fetch-style chain fronting every request: dispatches API routes.
                    middleware: "./src/middleware.ts",
                    // Typed env is on by convention: ./env.ts is probed automatically
                    // and validated — server vars are read from process.env when the
                    // server boots, client vars are baked at build time. (Set
                    // `env: false` here to opt out.)
                },
                // Set to false for a static shell + API server: pages render on the
                // client while server functions, sessions, and API routes keep
                // working. (Tests always compile with the client posture.)
                ssr: true,
                // Dev-only agent/diagnostics surface: exposes capture control at
                // /__solid/diagnostics on the dev server (see AGENTS.md). No-op in build.
                diagnostics: true,
                // Compiles 'use server' functions into fetch calls on the client and
                // serves them from the /_server endpoint. The configure module runs
                // in the handler graph before any dispatch — it registers the
                // router's single-flight collector (see src/server-config.ts).
                serverFunctions: { configure: "./src/server-config.ts" },
                // `extensions` makes @solidjs/vite-plugin also compile the `?pick=` route
                // modules the fileRoutes plugin emits (their ids end in a query string).
                extensions: [".jsx", ".tsx"],
            }),
            // `httpMethods` also scans route modules for GET/POST/... exports (API
            // routes). One router serves both sides: handler modules — and the
            // server-only code they import — never enter the client bundle.
            fileRoutes({ httpMethods: true, types: true }),
            env.USE_NITRO === "1" &&
                nitro({
                    preset: "vercel",
                    // server.ts 是自建 Bun 启动器，不是 Nitro 入口。
                    serverEntry: false,
                    routeRules: {
                        "/**": {
                            headers: {
                                "Cross-Origin-Opener-Policy": "same-origin",
                                "Cross-Origin-Embedder-Policy": "require-corp",
                            },
                        },
                    },
                }),
        ],
        resolve: {
            alias: {
                "@": path.resolve(process.cwd(), "src"),
                "styled-system": path.resolve(process.cwd(), "styled-system"),
            },
        },
        server: {
            port: Number(env.APP_PORT ?? 3000),
            headers: {
                "Cross-Origin-Embedder-Policy": "require-corp",
                "Cross-Origin-Opener-Policy": "same-origin",
            },
        },
        // PGlite's runtime loads sibling `.wasm` and `.data` files through
        // import.meta.url. Keep it unbundled in dev so Vite preserves those
        // package-relative URLs instead of optimizing the dependency.
        optimizeDeps: {
            exclude: ["@electric-sql/pglite"],
        },
        assetsInclude: [/\.data$/],
        build: {
            target: "esnext",
            // Keep images as asset files instead of inlining them into the JS bundle.
            assetsInlineLimit: 0,
        },
    };
});
