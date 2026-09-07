import { createEffect, createSignal, onSettled, Show } from "solid-js";
import { css, cx } from "styled-system/css";
import type { GBAKeyMapping } from "@/db/schema";
import { DEFAULT_KEY_MAPPING } from "@/lib/constant/common";
import { isArrayBuffer } from "@/lib/utils/type-guard";
import { createGbaEmulator } from "./emu-gba-game";
import { createGbaRenderer, type GbaRenderer } from "./render";

export type GbaDeviceProps = {
    shellColor: string;
    gameROMBuffer?: ArrayBuffer;
    keyMapping?: GBAKeyMapping;
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

    const powerMapping = () => props.keyMapping ?? DEFAULT_KEY_MAPPING;

    const [poweredOn, setPoweredOn] = createSignal(true, {
        name: "gbaPoweredOn",
    });

    const handlePowerKey = (event: KeyboardEvent) => {
        const mapping = powerMapping();
        if (event.code === mapping.PowerON) {
            event.preventDefault();
            void emulator?.powerOn();
            setPoweredOn(true);
        } else if (event.code === mapping.PowerOFF) {
            event.preventDefault();
            emulator?.powerOff();
            setPoweredOn(false);
        }
    };

    createEffect(
        () => props.shellColor,
        (color) => {
            renderer?.setShellColor(color);
        },
        { name: "syncGbaShellColor" },
    );

    createEffect(
        () => poweredOn(),
        (isPoweredOn) => {
            renderer?.setPowerState(isPoweredOn);
        },
        { name: "syncGbaPowerState" },
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
            if (!poweredOn()) session.powerOff();
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
        window.addEventListener("keydown", handlePowerKey);
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
            window.removeEventListener("keydown", handlePowerKey);
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
                <div
                    class={css({
                        pointerEvents: "none",
                        position: "absolute",
                        inset: 0,
                        display: "grid",
                        placeItems: "center",
                    })}
                >
                    <span
                        class={cx(
                            "loading",
                            "loading-spinner",
                            "loading-lg",
                            css({
                                color: "var(--color-neutral)",
                            }),
                        )}
                    />
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
