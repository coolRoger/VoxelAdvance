export type GbaEmulatorOptions = {
    canvas: HTMLCanvasElement;
    onFrame: () => void;
    gameROMBuffer: ArrayBuffer;
};

export type GbaEmulatorSession = {
    pause: () => void;
    resumeAudio: () => Promise<void>;
    dispose: () => void;
};
