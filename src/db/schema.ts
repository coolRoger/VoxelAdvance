import { sql } from "drizzle-orm";
import {
    customType,
    integer,
    jsonb,
    pgTable,
    text,
    timestamp,
    unique,
    uuid,
} from "drizzle-orm/pg-core";

export const bytea = customType<{
    data: Uint8Array;
    driverData: Uint8Array;
}>({
    dataType() {
        return "bytea";
    },

    toDriver(value) {
        return value;
    },

    fromDriver(value: any) {
        if (value instanceof Uint8Array) {
            return value;
        }

        if (value instanceof ArrayBuffer) {
            return new Uint8Array(value);
        }

        return new Uint8Array(value as ArrayLike<number>);
    },
});

export interface GBAKeyMapping {
    A: string;
    B: string;
    START: string;
    SELECT: string;
    UP: string;
    DOWN: string;
    LEFT: string;
    RIGHT: string;
    L: string;
    R: string;
}

export const gbaSetting = pgTable("gba_setting", {
    id: uuid("id").primaryKey().defaultRandom(),

    bodyColor: text("body_color").notNull().default("#9BBC0F"),

    keyMapping: jsonb("key_mapping")
        .$type<GBAKeyMapping>()
        .notNull()
        .default(sql`'{}'::jsonb`),

    frameRate: integer("frame_rate").notNull().default(60),
});

export const gbaROM = pgTable("gba_rom", {
    id: uuid("id").primaryKey().defaultRandom(),

    name: text("name").notNull(),

    fileName: text("file_name"),

    /**
     * ROM binary.
     *
     * NULL means the ROM data has not been uploaded yet.
     */
    romData: bytea("rom_data"),

    /**
     * ROM size in bytes.
     */
    size: integer("size"),

    checksum: text("checksum"),

    createdAt: timestamp("created_at", {
        withTimezone: true,
    })
        .notNull()
        .defaultNow(),
});

export const gbaROMState = pgTable(
    "gba_rom_state",
    {
        id: uuid("id").primaryKey().defaultRandom(),

        romId: uuid("rom_id")
            .notNull()
            .references(() => gbaROM.id, {
                onDelete: "cascade",
            }),

        slot: integer("slot").notNull().default(0),

        /**
         * Emulator save state.
         *
         * NULL means no state has been saved yet.
         */
        stateData: bytea("state_data"),

        createdAt: timestamp("created_at", {
            withTimezone: true,
        })
            .notNull()
            .defaultNow(),

        updatedAt: timestamp("updated_at", {
            withTimezone: true,
        })
            .notNull()
            .defaultNow(),
    },

    (table) => [
        unique("rom_states_rom_id_slot_unique").on(table.romId, table.slot),
    ],
);
