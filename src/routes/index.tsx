import type { RouteDefinition } from "@solidjs/router";
import { createSignal, For, onSettled } from "solid-js";
import GbaDevice from "@/components/gba-device";
import { SHELL_COLORS_PRESETS } from "@/lib/constant/common";
import { GBAStore, setGBAStore } from "@/stores/gba";

export const route = {
    preload: () => {},
} satisfies RouteDefinition;

export default function Home() {
    const [gameROMState, setGameROMState] = createSignal<{
        status: boolean;
        message: string;
        data?: ArrayBuffer;
    }>();

    onSettled(() => {
        const fetchGameROM = async () => {
            try {
                const response = await fetch(`/games/FA.gba`);

                if (!response.ok) {
                    setGameROMState({
                        status: false,
                        message: "GBA 游戏资源加载失败",
                    });
                }

                const arrayBuffer = await response.arrayBuffer();

                setGameROMState({
                    status: true,
                    message: "GBA 游戏资源加载成功",
                    data: arrayBuffer,
                });
            } catch (err) {
                const _err = err as Error;
                setGameROMState({
                    status: false,
                    message: _err.message,
                });
            }
        };

        void fetchGameROM();
    });

    return (
        <>
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
                <span class="grid size-10 place-items-center rounded-xl bg-slate-950 text-xl text-white shadow-lg shadow-violet-300">
                    ◈
                </span>
                <span>VOXEL ADVANCE</span>
            </a>

            <fieldset
                class="absolute top-5 right-5 z-10 rounded-2xl border border-white/80 bg-white/65 p-2 shadow-xl shadow-violet-900/10 backdrop-blur-md sm:top-7 sm:right-8"
                aria-label="机身颜色"
            >
                <div class="flex flex-wrap justify-end gap-2">
                    <For each={SHELL_COLORS_PRESETS}>
                        {(color) => (
                            <button
                                type="button"
                                class={{
                                    "group grid size-9 place-items-center rounded-full border border-white bg-white shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600": true,
                                    "ring-2 ring-slate-900 ring-offset-2 ring-offset-white/60":
                                        GBAStore.setting.bodyColor ===
                                        color.value,
                                }}
                                aria-label={`将机身设为${color.name}`}
                                aria-pressed={
                                    GBAStore.setting.bodyColor === color.value
                                        ? "true"
                                        : "false"
                                }
                                onClick={() => {
                                    setGBAStore((state) => {
                                        state.setting.bodyColor = color.value;
                                    });
                                }}
                            >
                                <span
                                    class="size-7 rounded-full border border-black/10"
                                    style={{ "background-color": color.value }}
                                />
                            </button>
                        )}
                    </For>
                    <label class="relative grid size-9 cursor-pointer place-items-center rounded-full border border-white bg-white shadow-sm transition hover:-translate-y-0.5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-violet-600">
                        <input
                            type="color"
                            class="absolute inset-0 cursor-pointer opacity-0"
                            value={GBAStore.setting.bodyColor ?? ""}
                            aria-label="选择自定义机身颜色"
                            onInput={(event) =>
                                setGBAStore((state) => {
                                    state.setting.bodyColor =
                                        event.currentTarget.value;
                                })
                            }
                        />
                        <span class="grid size-7 place-items-center rounded-full bg-conic/decreasing from-violet-500 via-cyan-400 to-rose-500 text-xs text-white">
                            ✦
                        </span>
                    </label>
                </div>
            </fieldset>
        </>
    );
}
