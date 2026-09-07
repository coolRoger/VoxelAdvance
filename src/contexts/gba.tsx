import {
    createContext,
    createEffect,
    type ParentProps,
    useContext,
} from "solid-js";
import { GBASetting } from "@/db/repositry/gba_setting";
import { setGBAStore } from "@/stores/gba";
import { useDBContext } from "./db";

const GBAContext = createContext();

function GBAProvider(props: ParentProps) {
    const dbContext = useDBContext();

    createEffect(
        () => dbContext?.db(),
        (db) => {
            if (!db) return;
            void new GBASetting(db).load().then((settings) => {
                setGBAStore((state) => {
                    state.inited = true;
                    state.setting.bodyColor = settings.bodyColor;
                    state.setting.keyMapping = settings.keyMapping;
                });
            });
        },
        { name: "loadGbaSettings" },
    );

    return <GBAContext value={{}}>{props.children}</GBAContext>;
}

function useGBAContext() {
    return useContext(GBAContext);
}

export { GBAProvider, useGBAContext };
