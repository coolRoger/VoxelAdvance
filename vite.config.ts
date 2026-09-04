import path from "node:path";
import solid from "@solidjs/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { pick } from "es-toolkit/compat";
import { fileRoutes } from "filesystem-routing/vite";
import { nitro } from "nitro/vite";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => {
    const sys_env = loadEnv(mode, process.cwd(), "");

    const env = {
        ...pick(sys_env, ["SESSION_SECRET", "VITE_APP_NAME", "APP_PORT"]),
    } as const;

    return {
        // Turnkey streaming SSR: no index.html and no entry files — the plugin
        // generates the entries around src/App.tsx, wrapped in src/Document.tsx.
        // `vite build` emits static client assets to dist/client and the request
        // handler to dist/server; `npm start` serves both with server.js.
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
            nitro({ serverEntry: false }),
        ],
        resolve: {
            alias: {
                "@": path.resolve(process.cwd(), "src"),
                "styled-system": path.resolve(process.cwd(), "styled-system"),
            },
        },
        server: {
            port: Number(env.APP_PORT ?? 3000),
        },
        build: {
            target: "esnext",
            // Keep images as asset files instead of inlining them into the JS bundle.
            assetsInlineLimit: 0,
        },
    };
});
