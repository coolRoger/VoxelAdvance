// The production server for the SSR app. Bun speaks the web Request/Response
// API natively, so the built handler can be used without an adapter.
import path from "node:path";
// The generated server bundle does not emit declarations.
// @ts-expect-error generated at build time
import { handleRequest } from "./dist/server/server.js";

const root = path.dirname(Bun.fileURLToPath(import.meta.url));
const clientRoot = path.join(root, "dist/client");
const port = Number(process.env.APP_PORT) || 3000;
const isolationHeaders = {
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Embedder-Policy": "require-corp",
};

const server = Bun.serve({
    port,
    async fetch(request, server) {
        const url = new URL(request.url);

        // Serve built client assets before falling through to SSR routes.
        if (request.method === "GET" || request.method === "HEAD") {
            const assetPath = path.resolve(
                clientRoot,
                `.${decodeURIComponent(url.pathname)}`,
            );

            if (assetPath.startsWith(`${clientRoot}${path.sep}`)) {
                const asset = Bun.file(assetPath);

                let NEED_COOP_COEP_HEADERS = false;

                if (assetPath.endsWith("mgba/mgba.js")) {
                    NEED_COOP_COEP_HEADERS = true;
                }

                if (await asset.exists()) {
                    return new Response(
                        request.method === "HEAD" ? null : asset,
                        {
                            headers: {
                                "Content-Type": asset.type,
                                ...(NEED_COOP_COEP_HEADERS
                                    ? isolationHeaders
                                    : {}),
                            },
                        },
                    );
                }
            }
        }

        try {
            const response = await handleRequest(request, {
                event: {
                    nativeEvent: request,
                    remoteAddress: server.requestIP(request),
                },
            });

            const headers = new Headers(response.headers);

            for (const [name, value] of Object.entries(isolationHeaders)) {
                headers.set(name, value);
            }

            return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers,
            });
        } catch (error) {
            console.error(error);
            return new Response("Internal Server Error", {
                status: 500,
                headers: isolationHeaders,
            });
        }
    },
});

console.log(`Server running at ${server.url}`);
