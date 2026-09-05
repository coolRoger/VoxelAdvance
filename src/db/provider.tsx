import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import {
    createContext,
    createSignal,
    onSettled,
    type ParentProps,
    useContext,
} from "solid-js";
import type { T_DB } from "./types";

const DBContext = createContext<{
    db: () => T_DB | null;
    importDB: (db_file: File) => Promise<void>;
}>();

function DBProvider(props: ParentProps) {
    const [db, setDB] = createSignal<T_DB | null>(null);

    onSettled(() => {
        const client = new PGlite("idb://voxel-advance");
        const _db = drizzle(client);
        window.db = _db;
        setDB(_db);
    });

    async function importDB(db_file: File) {
        if (db_file instanceof File !== true) {
            return;
        }

        try {
            const client = new PGlite("idb://voxel-advance", {
                loadDataDir: db_file,
            });

            if (db()?.$client) {
                db()?.$client.close();
            }

            const _db = drizzle(client);

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
