// The server middleware chain (wired via `start.middleware` in
// vite.config.ts): fetch-style functions fronting every request the server
// dispatches — page renders, server function calls, and API routes alike.
// Each runs inside the request-event scope, so getRequestEvent() (and the
// session helpers built on it) work here exactly as in application code.

import routes from "virtual:file-routes";
import { createAPIHandler } from "filesystem-routing/api";

// createAPIHandler serves the GET/POST/... exports of route modules
// (see src/routes/api) and passes everything else down the chain.

async function COOP_COEP_Headers(
    __request: Request,
    next: () => Promise<Response>,
) {
    const response = await next();

    response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
    response.headers.set("Cross-Origin-Embedder-Policy", "require-corp");

    return response;
}
export default [COOP_COEP_Headers, createAPIHandler(routes)];
