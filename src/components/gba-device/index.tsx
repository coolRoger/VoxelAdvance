import { createEffect, createSignal, onSettled, Show } from "solid-js";
import { isArrayBuffer } from "@/lib/utils/type-guard";
import { createGbaEmulator } from "./emu-gba-game";
import { createGbaRenderer, type GbaRenderer } from "./render";

export type GbaDeviceProps = {
    shellColor: string;
    gameROMBuffer?: ArrayBuffer;
};

export function GbaDevice(props: GbaDeviceProps) {
    let host!: HTMLDivElement;
    let renderer: GbaRenderer | undefined;
    let emulator: Awaited<ReturnType<typeof createGbaEmulator>> | undefined;
    let emulatorGeneration = 0;
    const [loading, setLoading] = createSignal(true, {
        name: "gbaModelLoading",
    });
    const [error, setError] = createSignal(false, { name: "gbaModelError" });

    createEffect(
        () => props.shellColor,
        (color) => renderer?.setShellColor(color),
        { name: "syncGbaShellColor" },
    );

    const startEmulator = async (gameROMBuffer: ArrayBuffer) => {
        const currentGeneration = ++emulatorGeneration;
        emulator?.dispose();
        emulator = undefined;
        const currentRenderer = renderer;
        if (!currentRenderer) return;

        try {
            const session = await createGbaEmulator({
                canvas: currentRenderer.getGameCanvas(),
                gameROMBuffer,
                onFrame: currentRenderer.invalidateGameTexture,
            });
            if (currentGeneration !== emulatorGeneration) {
                session.dispose();
                return;
            }
            emulator = session;
        } catch (cause: unknown) {
            if (currentGeneration === emulatorGeneration) {
                console.error("GBA 模拟器启动失败", cause);
                setError(true);
            }
        }
    };

    createEffect(
        () => props.gameROMBuffer,
        (gameROMBuffer) => {
            if (!isArrayBuffer(gameROMBuffer)) return;
            void startEmulator(gameROMBuffer);
        },
        { name: "restartGbaEmulator" },
    );

    onSettled(() => {
        renderer = createGbaRenderer({
            host,
            shellColor: props.shellColor,
            onLoadingChange: setLoading,
            onError: () => setError(true),
        });

        if (isArrayBuffer(props.gameROMBuffer)) {
            void startEmulator(props.gameROMBuffer);
        }

        return () => {
            emulatorGeneration += 1;
            emulator?.dispose();
            emulator = undefined;
            renderer?.dispose();
            renderer = undefined;
        };
    });

    return (
        <div class="absolute inset-0 overflow-hidden">
            <div
                ref={host}
                class="absolute inset-0 cursor-grab active:cursor-grabbing"
            />
            <Show when={loading()}>
                <div class="pointer-events-none absolute inset-0 grid place-items-center">
                    <span class="loading loading-spinner loading-lg text-violet-700" />
                </div>
            </Show>
            <Show when={error()}>
                <div
                    class="pointer-events-none absolute inset-0 grid place-items-center text-4xl text-rose-600"
                    role="alert"
                    aria-label="模型或模拟器加载失败"
                >
                    ×
                </div>
            </Show>
        </div>
    );
}

export default GbaDevice;
