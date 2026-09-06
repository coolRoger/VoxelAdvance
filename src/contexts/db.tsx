import { PGlite } from "@electric-sql/pglite";
import type { PgDialect } from "drizzle-orm/pg-core/dialect";
import { drizzle } from "drizzle-orm/pglite";
import {
    createContext,
    createSignal,
    onSettled,
    type ParentProps,
    useContext,
} from "solid-js";
import { migrations } from "@/db/migrations";
import type { T_DB } from "@/db/types";

const INITIAL_MIGRATION_TIME = migrations[0]?.folderMillis;

async function baselineLegacyDatabase(client: PGlite) {
    if (INITIAL_MIGRATION_TIME === undefined) {
        return;
    }

    const tables = await client.query<{ table_name: string }>(
        `SELECT table_name
         FROM information_schema.tables
         WHERE table_schema = 'public'
           AND table_name IN ('gba_setting', 'gba_rom', 'gba_rom_state')`,
    );
    const legacyTables = new Set(tables.rows.map((table) => table.table_name));

    if (
        legacyTables.size !== 3 ||
        !legacyTables.has("gba_setting") ||
        !legacyTables.has("gba_rom") ||
        !legacyTables.has("gba_rom_state")
    ) {
        return;
    }

    await client.exec(`
        CREATE SCHEMA IF NOT EXISTS "drizzle";
        CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
            id SERIAL PRIMARY KEY,
            hash text NOT NULL,
            created_at bigint
        );
        INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at")
        SELECT 'legacy-handwritten-sql-v1', ${INITIAL_MIGRATION_TIME}
        WHERE NOT EXISTS (
            SELECT 1 FROM "drizzle"."__drizzle_migrations"
            WHERE "created_at" = ${INITIAL_MIGRATION_TIME}
               OR "hash" = 'legacy-handwritten-sql-v1'
        );
    `);
}

async function initializeDatabase(client: PGlite) {
    await baselineLegacyDatabase(client);

    const database = drizzle(client);
    const internalDatabase = database as typeof database & {
        dialect: PgDialect;
        session: Parameters<PgDialect["migrate"]>[1];
    };
    await internalDatabase.dialect.migrate(
        migrations,
        internalDatabase.session,
        { migrationsFolder: "browser" },
    );
    return database;
}

const DBContext = createContext<{
    db: () => T_DB | null;
    importDB: (db_file: File) => Promise<void>;
}>();

function DBProvider(props: ParentProps) {
    const [db, setDB] = createSignal<T_DB | null>(null);

    onSettled(() => {
        let disposed = false;

        const setupDatabase = async () => {
            const client = new PGlite("idb://voxel-advance");
            try {
                await client._checkReady();

                const _db = await initializeDatabase(client);
                if (disposed) {
                    await client.close();
                    return;
                }

                window.db = _db;
                setDB(_db);
            } catch (cause: unknown) {
                await client.close();
                console.error("客户端数据库初始化失败", cause);
            }
        };

        void setupDatabase();

        return () => {
            disposed = true;
        };
    });

    async function importDB(db_file: File) {
        if (db_file instanceof File !== true) {
            return;
        }

        try {
            const client = new PGlite("idb://voxel-advance", {
                loadDataDir: db_file,
            });

            await client._checkReady();

            const _db = await initializeDatabase(client);

            if (db()?.$client) {
                db()?.$client.close();
            }

            setDB(_db);

            window.db = _db;
        } catch (cause: unknown) {
            console.error("客户端数据库初始化失败", cause);
        }
    }

    return <DBContext value={{ db, importDB }}>{props.children}</DBContext>;
}

function useDBContext() {
    return useContext(DBContext);
}

export { DBProvider, useDBContext };
