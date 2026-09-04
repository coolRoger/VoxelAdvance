// The production server for the SSR app. Bun speaks the web Request/Response
// API natively, so the built handler can be used without an adapter.
import path from "node:path";
// The generated server bundle does not emit declarations.
// @ts-expect-error generated at build time
import { handleRequest } from "./dist/server/server.js";

const root = path.dirname(Bun.fileURLToPath(import.meta.url));
const clientRoot = path.join(root, "dist/client");
const port = Number(process.env.APP_PORT) || 3000;

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
                if (await asset.exists()) {
                    return new Response(
                        request.method === "HEAD" ? null : asset,
                        {
                            headers: {
                                "Content-Type": asset.type,
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

            return response;
        } catch (error) {
            console.error(error);
            return new Response(
                error instanceof Error
                    ? error.message
                    : "Internal Server Error",
                {
                    status: 500,
                },
            );
        }
    },
});

console.log(`Server running at ${server.url}`);
