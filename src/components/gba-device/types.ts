export type GbaEmulatorOptions = {
    canvas: HTMLCanvasElement;
    onFrame: () => void;
    gameROMBuffer: ArrayBuffer;
};

export type GbaEmulatorSession = {
    powerOn: () => Promise<void>;
    powerOff: () => void;
    dispose: () => void;
};

export type GbaPowerMapping = {
    PowerON: string;
    PowerOFF: string;
};
