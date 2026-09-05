/** biome-ignore-all lint/complexity/noUselessEmptyExport: We need to export something to make the globalThis available in the client. */

/// <reference types="vite/client" />
/// <reference types="@solidjs/vite-plugin/boundary-modules" />
/// <reference types="../file-routes.d.ts" />

import type { T_DB } from "@/db/provider";

declare global {
    interface globalThis {
        db: T_DB | null;
    }

    interface Window {
        db: T_DB | null;
    }
}

export {};
