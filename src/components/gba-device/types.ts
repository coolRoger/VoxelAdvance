import type { GBAKeyMapping } from "@/db/schema";

export type GbaEmulatorOptions = {
    canvas: HTMLCanvasElement;
    onFrame: () => void;
    gameROMBuffer: ArrayBuffer;
    keyMaps: GBAKeyMapping;
};

export type GbaEmulatorSession = {
    powerOn: () => Promise<void>;
    powerOff: () => void;
    dispose: () => void;
};
