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
import { migrations } from "./migrations";
import type { T_DB } from "./types";

async function initializeDatabase(client: PGlite) {
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
        } catch (_) {}
    }

    return <DBContext value={{ db, importDB }}>{props.children}</DBContext>;
}

function useDBContext() {
    return useContext(DBContext);
}

export { DBProvider, useDBContext };
