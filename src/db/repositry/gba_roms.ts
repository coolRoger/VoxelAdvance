import { eq } from "drizzle-orm";
import DBInstance from "../instance";
import { gbaROM } from "../schema";

class GBAROM extends DBInstance {
    async save(params: {
        id: string;
        name: string;
        fileName?: string;
        data: Uint8Array;
    }) {
        this.ensureDB();

        const [result] = await this.db
            .insert(gbaROM)
            .values({
                id: params.id,
                name: params.name,
                fileName: params.fileName,
                romData: params.data,
                size: params.data.byteLength,
            })
            .returning();
        return result;
    }

    async load(id: string) {
        this.ensureDB();

        const [rom] = await this.db
            .select()
            .from(gbaROM)
            .where(eq(gbaROM.id, id))
            .limit(1);

        return rom;
    }

    async list() {
        this.ensureDB();

        return this.db
            .select({
                id: gbaROM.id,
                name: gbaROM.name,
                fileName: gbaROM.fileName,
                size: gbaROM.size,
                createdAt: gbaROM.createdAt,
            })
            .from(gbaROM);
    }

    async delete(id: string) {
        this.ensureDB();

        await this.db.delete(gbaROM).where(eq(gbaROM.id, id));
    }
}

export { GBAROM };
