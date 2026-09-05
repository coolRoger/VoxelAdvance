import type { T_DB } from "./types";

class DBInstance {
    db: T_DB | null = null;

    constructor(db: T_DB) {
        this.db = db;
    }

    ensureDB(): asserts this is { db: T_DB } {
        if (!this.db?.$client) {
            throw new Error("DB is not initialized");
        }
    }
}

export default DBInstance;
