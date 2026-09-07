import type { GBA } from "gba-game";
import { GameBoyAdvanceSoftwareRenderer } from "gba-game";
import type { GbaEmulatorOptions, GbaEmulatorSession } from "./types";

type PaletteMemory = {
    store16(offset: number, value: number): void;
    store8?: (offset: number, value: number) => void;
};

function installPaletteByteStore(palette: PaletteMemory) {
    if (palette.store8) return;

    // gba-game's palette omits store8, but the MMU can issue byte writes.
    // Palette byte writes replicate the byte across the aligned halfword.
    palette.store8 = (offset, value) => {
        palette.store16(offset, (value << 8) | value);
    };
}

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
    emulator.keypad.KEYCODE_UP = options.keyMaps.UP;
    emulator.keypad.KEYCODE_LEFT = options.keyMaps.LEFT;
    emulator.keypad.KEYCODE_DOWN = options.keyMaps.DOWN;
    emulator.keypad.KEYCODE_RIGHT = options.keyMaps.RIGHT;
    emulator.keypad.KEYCODE_L = options.keyMaps.L;
    emulator.keypad.KEYCODE_R = options.keyMaps.R;
    emulator.keypad.KEYCODE_A = options.keyMaps.A;
    emulator.keypad.KEYCODE_B = options.keyMaps.B;
    emulator.keypad.KEYCODE_START = options.keyMaps.START;
    emulator.keypad.KEYCODE_SELECT = options.keyMaps.SELECT;
    emulator.keypad.eatInput = true;
    emulator.setCanvasDirect(options.canvas);
    emulator.video.drawCallback = options.onFrame;
    emulator.setBios(await biosResponse.arrayBuffer());

    const loaded = await emulator.setRomAsync(options.gameROMBuffer);
    if (!loaded) {
        throw new Error("GBA ROM 无法启动");
    }

    installPaletteByteStore(emulator.video.renderPath.palette);

    for (const object of emulator.video.renderPath.oam.objs) {
        object.pushPixel = GameBoyAdvanceSoftwareRenderer.pushPixel;
    }
    emulator.runStable();
    let poweredOn = true;

    return {
        powerOn: async () => {
            if (poweredOn) {
                await emulator.audio.context?.resume();
                return;
            }

            poweredOn = true;
            emulator.runStable();
            await emulator.audio.context?.resume();
        },
        powerOff: () => {
            if (!poweredOn) return;
            poweredOn = false;
            emulator.pause();
            emulator.audio.context?.suspend();
        },
        dispose: () => {
            poweredOn = false;
            emulator.pause();
            void emulator.audio.context?.close();
        },
    };
}
