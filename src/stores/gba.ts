import { createStore } from "solid-js";
import type { GBAKeyMapping } from "@/db/schema";

type GBAStoreValue = {
    inited: boolean;
    setting: Partial<{
        frameRate: number;
        bodyColor: string;
        keyMapping: GBAKeyMapping;
    }>;
};

const [GBAStore, setGBAStore] = createStore<GBAStoreValue>({
    inited: false,
    setting: {},
});

export { GBAStore, setGBAStore };
