import type { GBAKeyMapping } from "@/db/schema";

import { keyboardCodeToKeyCode } from "@/lib/utils/keyboard";

export type GbaEmulatorKeyMapping = {
    A: number;
    B: number;
    START: number;
    SELECT: number;
    UP: number;
    DOWN: number;
    LEFT: number;
    RIGHT: number;
    L: number;
    R: number;
};

export function keyMappingToKeyCodes(
    mapping: GBAKeyMapping,
): GbaEmulatorKeyMapping {
    return {
        A: keyboardCodeToKeyCode(mapping.A),
        B: keyboardCodeToKeyCode(mapping.B),
        START: keyboardCodeToKeyCode(mapping.START),
        SELECT: keyboardCodeToKeyCode(mapping.SELECT),
        UP: keyboardCodeToKeyCode(mapping.UP),
        DOWN: keyboardCodeToKeyCode(mapping.DOWN),
        LEFT: keyboardCodeToKeyCode(mapping.LEFT),
        RIGHT: keyboardCodeToKeyCode(mapping.RIGHT),
        L: keyboardCodeToKeyCode(mapping.L),
        R: keyboardCodeToKeyCode(mapping.R),
    };
}

export type GbaEmulatorOptions = {
    canvas: HTMLCanvasElement;
    onFrame: () => void;
    gameROMBuffer: ArrayBuffer;
    keyMaps: GbaEmulatorKeyMapping;
};

export type GbaEmulatorSession = {
    setKeyMapping: (mapping: GbaEmulatorKeyMapping) => void;
    powerOn: () => Promise<void>;
    powerOff: () => void;
    dispose: () => void;
};
