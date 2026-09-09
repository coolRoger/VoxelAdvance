import { createEffect, createSignal, onSettled, Show, untrack } from "solid-js";
import { css, cx } from "styled-system/css";
import type { GBAKeyMapping } from "@/db/schema";
import { DEFAULT_KEY_MAPPING } from "@/lib/constant/common";
import { isArrayBuffer } from "@/lib/utils/type-guard";
import { createMgbaWasmEmulator as createGbaEmulator } from "./emu-mgba-wasm";
import { createGbaRenderer, type GbaRenderer } from "./render";
import { type GbaEmulatorKeyMapping, keyMappingToKeyCodes } from "./types";

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
    let currentRom: ArrayBuffer | undefined;
    const [rendererReady, setRendererReady] = createSignal(false, {
        name: "gbaRendererReady",
    });

    const [loading, setLoading] = createSignal(true, {
        name: "gbaModelLoading",
    });

    const [error, setError] = createSignal(false, { name: "gbaModelError" });

    const keyMapping = () => props.keyMapping ?? DEFAULT_KEY_MAPPING;

    const [poweredOn, setPoweredOn] = createSignal(true, {
        name: "gbaPoweredOn",
    });

    const handlePowerKey = (event: KeyboardEvent) => {
        const mapping = keyMapping();
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

    const startEmulator = async (params: {
        gameROMBuffer: ArrayBuffer;
        keyMaps: GbaEmulatorKeyMapping;
    }) => {
        if (currentRom === params.gameROMBuffer) return;
        currentRom = params.gameROMBuffer;
        const currentGeneration = ++emulatorGeneration;
        emulator?.dispose();
        emulator = undefined;
        const currentRenderer = renderer;
        if (!currentRenderer) return;

        try {
            const session = await createGbaEmulator({
                canvas: currentRenderer.getGameCanvas(),
                gameROMBuffer: params.gameROMBuffer,
                keyMaps: params.keyMaps,
                onFrame: currentRenderer.invalidateGameTexture,
            });

            if (currentGeneration !== emulatorGeneration) {
                session.dispose();
                return;
            }

            emulator = session;
            session.setKeyMapping(
                untrack(() => keyMappingToKeyCodes(keyMapping())),
            );

            if (!untrack(poweredOn)) session.powerOff();
        } catch (cause: unknown) {
            if (currentGeneration === emulatorGeneration) {
                console.error("GBA 模拟器启动失败", cause);
                setError(true);
            }
        }
    };

    createEffect(
        () => {
            const mapping = keyMapping();
            return {
                ready: rendererReady(),
                gameROMBuffer: props.gameROMBuffer,
                keyMaps: keyMappingToKeyCodes(mapping),
            };
        },
        ({ ready, gameROMBuffer, keyMaps }) => {
            if (!ready || !isArrayBuffer(gameROMBuffer)) return;
            emulator?.setKeyMapping(keyMaps);
            void startEmulator({ gameROMBuffer, keyMaps });
        },
        { name: "restartGbaEmulator" },
    );

    onSettled(() => {
        window.addEventListener("keydown", handlePowerKey);

        renderer = createGbaRenderer({
            host,
            shellColor: untrack(() => props.shellColor),
            onLoadingChange: setLoading,
            onError: () => setError(true),
        });

        setRendererReady(true);

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
