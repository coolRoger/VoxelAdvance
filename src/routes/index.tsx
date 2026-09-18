import type { RouteDefinition } from "@solidjs/router";
import { createSignal, onSettled, Show } from "solid-js";
import GitHubFooter from "@/components/common/github-footer";
import { PhIcon } from "@/components/common/ph-icon";
import GbaDevice from "@/components/gba-device";
import SettingModal from "@/components/modals/settings";
import KeymapPanel from "@/components/panela/keymap";
import { DEFAULT_KEY_MAPPING } from "@/lib/constant/common";
import { GBAStore } from "@/stores/gba";

export const route = {
    preload: () => {},
} satisfies RouteDefinition;

export default function Home() {
    const [clientReady, setClientReady] = createSignal(false);

    const [gameROMState, setGameROMState] = createSignal<{
        status: boolean;
        message: string;
        data?: ArrayBuffer;
    }>();

    const [settingsOpen, setSettingsOpen] = createSignal(false, {
        name: "settingsOpen",
    });

    const [helpVisible, setHelpVisible] = createSignal(true, {
        name: "keyMappingHelpVisible",
    });
    const keyMapping = () => GBAStore.setting.keyMapping ?? DEFAULT_KEY_MAPPING;

    onSettled(() => {
        setClientReady(true);
        const fetchGameROM = async () => {
            try {
                const response = await fetch(`/games/FA.gba`);
                if (!response.ok) {
                    setGameROMState({
                        status: false,
                        message: "GBA 游戏资源加载失败",
                    });
                    return;
                }
                setGameROMState({
                    status: true,
                    message: "GBA 游戏资源加载成功",
                    data: await response.arrayBuffer(),
                });
            } catch (err) {
                setGameROMState({
                    status: false,
                    message: (err as Error).message,
                });
            }
        };
        void fetchGameROM();
    });

    return (
        <Show when={clientReady() === true}>
            <GbaDevice
                shellColor={GBAStore.setting.bodyColor ?? ""}
                gameROMBuffer={gameROMState()?.data}
                keyMapping={GBAStore.setting.keyMapping}
            />
            <a
                href="/"
                class="absolute top-5 left-5 z-10 flex items-center gap-3 font-black tracking-tight sm:top-7 sm:left-8"
                aria-label="Voxel Advance 首页"
            >
                <span class="grid size-10 place-items-center rounded-xl bg-slate-950 text-xl text-white shadow-lg shadow-secondary/90">
                    ◈
                </span>
                <span>VOXEL ADVANCE</span>
            </a>
            <div class="absolute top-5 right-5 z-10 flex gap-2 sm:top-7 sm:right-8">
                <button
                    type="button"
                    class="btn btn-circle border-white/80 bg-white/70 shadow-xl shadow-violet-900/10 backdrop-blur-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    aria-label={
                        helpVisible() ? "隐藏键位映射表" : "显示键位映射表"
                    }
                    title="键位帮助"
                    aria-controls="key-mapping-help"
                    aria-expanded={helpVisible() ? "true" : "false"}
                    onClick={() => setHelpVisible((visible) => !visible)}
                >
                    <PhIcon
                        name="question"
                        size={6}
                        color="var(--color-base-content)"
                    />
                </button>
                <button
                    type="button"
                    class="btn btn-circle border-white/80 bg-white/70 shadow-xl shadow-violet-900/10 backdrop-blur-md transition hover:rotate-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    aria-label="打开设置"
                    onClick={() => setSettingsOpen(true)}
                >
                    <PhIcon
                        name="gear-six"
                        size={6}
                        color="var(--color-base-content)"
                    />
                </button>
            </div>

            <KeymapPanel
                visible={helpVisible()}
                keyMapping={keyMapping()}
            />

            <SettingModal
                open={settingsOpen()}
                onClose={() => setSettingsOpen(false)}
            />
            <GitHubFooter />
        </Show>
    );
}
