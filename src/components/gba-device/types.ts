export type GbaEmulatorOptions = {
    canvas: HTMLCanvasElement;
    onFrame: () => void;
};

export type GbaEmulatorSession = {
    pause: () => void;
    resumeAudio: () => Promise<void>;
    dispose: () => void;
};
