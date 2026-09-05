import { and, eq } from "drizzle-orm";
import DBInstance from "../instance";
import { gbaROMState } from "../schema";

class GBAROMState extends DBInstance {
    async save(params: { romId: string; slot: number; state: Uint8Array }) {
        this.ensureDB();

        const [result] = await this.db
            .insert(gbaROMState)
            .values({
                romId: params.romId,
                slot: params.slot,
                stateData: params.state,
            })
            .onConflictDoUpdate({
                target: [gbaROMState.romId, gbaROMState.slot],

                set: {
                    stateData: params.state,
                    updatedAt: new Date(),
                },
            })
            .returning();
        return result;
    }

    async load(romId: string, slot: number) {
        this.ensureDB();

        const [state] = await this.db
            .select()
            .from(gbaROMState)
            .where(
                and(eq(gbaROMState.romId, romId), eq(gbaROMState.slot, slot)),
            )
            .limit(1);

        return state;
    }

    async delete(romId: string, slot: number) {
        this.ensureDB();

        await this.db
            .delete(gbaROMState)
            .where(
                and(eq(gbaROMState.romId, romId), eq(gbaROMState.slot, slot)),
            );
    }
}

export { GBAROMState };
