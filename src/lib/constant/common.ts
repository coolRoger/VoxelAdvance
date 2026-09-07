const SHELL_COLORS_PRESETS = [
    { name: "雾紫", value: "#8f86c9" },
    { name: "冰川蓝", value: "#79a7c9" },
    { name: "鼠尾草", value: "#82aa8a" },
    { name: "珊瑚红", value: "#cb6f6d" },
    { name: "经典靛蓝", value: "#514b9d" },
    { name: "暖灰", value: "#a69f95" },
] as const;

const DEFAULT_KEY_MAPPING = {
    A: "KeyK",
    B: "KeyJ",

    START: "KeyN",
    SELECT: "KeyM",

    UP: "KeyW",
    DOWN: "KeyS",
    LEFT: "KeyA",
    RIGHT: "KeyD",

    L: "KeyU",
    R: "KeyI",

    PowerON: "KeyZ",
    PowerOFF: "KeyX",
} as const;

export { DEFAULT_KEY_MAPPING, SHELL_COLORS_PRESETS };
