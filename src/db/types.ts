import type { PGlite } from "@electric-sql/pglite";
import type { PgliteDatabase } from "drizzle-orm/pglite";

export type T_DB = PgliteDatabase<Record<string, never>> & {
    $client: PGlite;
};
