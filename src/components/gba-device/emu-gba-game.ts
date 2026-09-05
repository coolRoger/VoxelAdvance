import type { GBA } from "gba-game";
import { GameBoyAdvanceSoftwareRenderer } from "gba-game";
import type { GbaEmulatorOptions, GbaEmulatorSession } from "./types";

export async function createGbaEmulator(
    options: GbaEmulatorOptions,
): Promise<GbaEmulatorSession> {
    const [{ GBA }, biosResponse] = await Promise.all([
        import("gba-game"),
        fetch("/games/gba-bios.bin"),
    ]);

    if (!biosResponse.ok) {
        throw new Error("GBA 游戏资源加载失败");
    }

    const emulator: GBA = new GBA({ throttle: 16 });
    emulator.logLevel = emulator.LOG_ERROR;
    emulator.keypad.KEYCODE_UP = 87;
    emulator.keypad.KEYCODE_LEFT = 65;
    emulator.keypad.KEYCODE_DOWN = 83;
    emulator.keypad.KEYCODE_RIGHT = 68;
    emulator.keypad.KEYCODE_L = 81;
    emulator.keypad.KEYCODE_R = 80;
    emulator.keypad.KEYCODE_A = 74;
    emulator.keypad.KEYCODE_B = 75;
    emulator.keypad.KEYCODE_START = 78;
    emulator.keypad.KEYCODE_SELECT = 77;
    emulator.keypad.eatInput = true;
    emulator.setCanvasDirect(options.canvas);
    emulator.video.drawCallback = options.onFrame;
    emulator.setBios(await biosResponse.arrayBuffer());

    const loaded = await emulator.setRomAsync(options.gameROMBuffer);
    if (!loaded) {
        throw new Error("GBA ROM 无法启动");
    }

    for (const object of emulator.video.renderPath.oam.objs) {
        object.pushPixel = GameBoyAdvanceSoftwareRenderer.pushPixel;
    }
    emulator.runStable();

    return {
        pause: () => emulator.pause(),
        resumeAudio: async () => {
            await emulator.audio.context?.resume();
        },
        dispose: () => {
            emulator.pause();
            void emulator.audio.context?.close();
        },
    };
}
