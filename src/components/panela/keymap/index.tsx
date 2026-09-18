import { For } from "solid-js";
import type { GBAKeyMapping } from "@/db/schema";
import { DEFAULT_KEY_MAPPING } from "@/lib/constant/common";

type KeyMappingKey = keyof GBAKeyMapping;

type KeyMappingPanelProps = {
    visible: boolean;
    keyMapping?: GBAKeyMapping;
};

const KEY_MAPPING_LABELS: readonly {
    key: KeyMappingKey;
    label: string;
}[] = [
    { key: "UP", label: "方向 ↑" },
    { key: "DOWN", label: "方向 ↓" },
    { key: "LEFT", label: "方向 ←" },
    { key: "RIGHT", label: "方向 →" },
    { key: "A", label: "A 按钮" },
    { key: "B", label: "B 按钮" },
    { key: "L", label: "L 肩键" },
    { key: "R", label: "R 肩键" },
    { key: "START", label: "START / 开始" },
    { key: "SELECT", label: "SELECT / 选择" },
    { key: "PowerON", label: "开机" },
    { key: "PowerOFF", label: "关机" },
];

function formatKeyCode(code: string) {
    return code.replace(/^Key([A-Z])$/, "$1").replace(/^Digit([0-9])$/, "$1");
}

export function KeymapPanel(props: KeyMappingPanelProps) {
    const keyMapping = () => props.keyMapping ?? DEFAULT_KEY_MAPPING;

    return (
        <aside
            id="key-mapping-help"
            hidden={!props.visible}
            aria-labelledby="key-mapping-title"
            class="absolute bottom-5 left-5 z-10 max-h-[45dvh] w-72 max-w-[calc(100vw-2.5rem)] overflow-y-auto rounded-2xl border border-base-content/10 bg-base-100/65 p-4 text-base-content shadow-lg backdrop-blur-md sm:bottom-7 sm:left-8 sm:w-80"
        >
            <h2
                id="key-mapping-title"
                class="mb-3 text-sm font-bold"
            >
                键位映射 · 键盘 → GBA
            </h2>
            <dl class="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <For each={KEY_MAPPING_LABELS}>
                    {(item) => (
                        <div class="flex min-w-0 items-center justify-between gap-2">
                            <dt>{item.label}</dt>
                            <dd>
                                <kbd class="kbd kbd-sm max-w-24 break-all whitespace-normal text-center">
                                    {formatKeyCode(
                                        keyMapping()[item.key] ?? "未绑定",
                                    )}
                                </kbd>
                            </dd>
                        </div>
                    )}
                </For>
            </dl>
        </aside>
    );
}

export default KeymapPanel;
