import { eq } from "drizzle-orm";
import { DEFAULT_KEY_MAPPING } from "@/lib/constant/common";
import DBInstance from "../instance";
import { type GBAKeyMapping, gbaSetting } from "../schema";

class GBASetting extends DBInstance {
    async load() {
        this.ensureDB();

        const [settings] = await this.db.select().from(gbaSetting).limit(1);

        if (settings) {
            return settings;
        }

        const [created] = await this.db
            .insert(gbaSetting)
            .values({
                bodyColor: "#9BBC0F",
                frameRate: 60,
                keyMapping: DEFAULT_KEY_MAPPING,
            })
            .returning();

        return created;
    }

    async update(
        settingsId: string,
        patch: {
            bodyColor?: string;
            frameRate?: number;
            keyMapping?: GBAKeyMapping;
        },
    ) {
        this.ensureDB();

        const [result] = await this.db
            .update(gbaSetting)
            .set(patch)
            .where(eq(gbaSetting.id, settingsId))
            .returning();

        return result;
    }
}

export { GBASetting };
