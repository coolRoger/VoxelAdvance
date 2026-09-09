import { loadMgbaRuntime } from "@/components/gba-device/mgba-runtime";
import { keyboardCodeToKeyCode } from "@/lib/utils/keyboard";
import type { GbaEmulatorOptions, GbaEmulatorSession } from "./types";

/** Bridge mGBA's private canvas to the existing renderer's 2D texture. */
export async function createMgbaWasmEmulator(
    options: GbaEmulatorOptions,
): Promise<GbaEmulatorSession> {
    if (!window.crossOriginIsolated) {
        throw new Error(
            "mGBA 需要跨源隔离，请使用 localhost 或配置 HTTPS 与 COOP/COEP 响应头",
        );
    }
    const context = options.canvas.getContext("2d");
    if (!context) throw new Error("游戏屏幕初始化失败");
    const factory = await loadMgbaRuntime();
    const canvas = document.createElement("canvas");
    canvas.width = 240;
    canvas.height = 160;
    const core = await factory({ canvas });
    let disposed = false;
    let poweredOn = true;
    let frame = 0;
    const pressed = new Set<string>();
    let bindings = Object.entries(options.keyMaps);
    const releaseKeys = () => {
        for (const key of pressed) core.buttonUnpress(key);
        pressed.clear();
    };
    const unlockAudio = () => {
        if (!disposed && poweredOn) {
            void core.SDL2?.audioContext?.resume().catch(() => {});
        }
    };
    const editable = (target: EventTarget | null) =>
        target instanceof HTMLElement &&
        (target.isContentEditable ||
            /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
    const keyDown = (event: KeyboardEvent) => {
        if (
            disposed ||
            !poweredOn ||
            editable(event.target) ||
            event.metaKey ||
            event.ctrlKey ||
            event.altKey
        )
            return;
        unlockAudio();
        for (const [key, code] of bindings) {
            if (keyboardCodeToKeyCode(event.code) !== code) continue;
            event.preventDefault();
            if (!pressed.has(key)) {
                pressed.add(key);
                core.buttonPress(key);
            }
        }
    };
    const keyUp = (event: KeyboardEvent) => {
        for (const [key, code] of bindings) {
            if (
                keyboardCodeToKeyCode(event.code) === code &&
                pressed.delete(key)
            ) {
                event.preventDefault();
                core.buttonUnpress(key);
            }
        }
    };
    const visibility = () => {
        if (document.hidden) releaseKeys();
    };
    const copyFrame = () => {
        if (disposed) return;
        if (poweredOn) {
            context.drawImage(canvas, 0, 0, 240, 160);
            options.onFrame();
        }
        frame = requestAnimationFrame(copyFrame);
    };
    const dispose = () => {
        if (disposed) return;
        releaseKeys();
        disposed = true;
        cancelAnimationFrame(frame);
        window.removeEventListener("keydown", keyDown);
        window.removeEventListener("keyup", keyUp);
        window.removeEventListener("blur", releaseKeys);
        window.removeEventListener("pointerdown", unlockAudio);
        document.removeEventListener("visibilitychange", visibility);
        core.quitGame();
        void core.SDL2?.audioContext?.close().catch(() => {});
        try {
            core.quitMgba();
        } catch (error) {
            // Emscripten throws status 0 on normal exit; allow cleanup to finish.
            if (
                !(
                    typeof error === "object" &&
                    error !== null &&
                    "status" in error &&
                    error.status === 0
                )
            )
                throw error;
        }
    };
    try {
        await core.FSInit();
        const digest = await crypto.subtle.digest(
            "SHA-256",
            options.gameROMBuffer,
        );
        const id = Array.from(new Uint8Array(digest), (byte) =>
            byte.toString(16).padStart(2, "0"),
        ).join("");
        const romPath = `${core.filePaths().gamePath}/${id}.gba`;
        core.FS.writeFile(romPath, new Uint8Array(options.gameROMBuffer));
        core.toggleInput(false);
        if (!core.loadGame(romPath)) throw new Error("GBA ROM 无法启动");
        window.addEventListener("keydown", keyDown);
        window.addEventListener("keyup", keyUp);
        window.addEventListener("blur", releaseKeys);
        window.addEventListener("pointerdown", unlockAudio);
        document.addEventListener("visibilitychange", visibility);
        frame = requestAnimationFrame(copyFrame);
        return {
            setKeyMapping: (mapping) => {
                if (disposed) return;
                releaseKeys();
                bindings = Object.entries(mapping);
            },
            powerOn: async () => {
                if (disposed) return;
                if (!poweredOn) core.resumeGame();
                poweredOn = true;
                await core.SDL2?.audioContext?.resume();
            },
            powerOff: () => {
                if (disposed || !poweredOn) return;
                releaseKeys();
                poweredOn = false;
                core.pauseGame();
                core.pauseAudio();
                void core.SDL2?.audioContext?.suspend().catch(() => {});
            },
            dispose,
        };
    } catch (error) {
        dispose();
        throw error;
    }
}
