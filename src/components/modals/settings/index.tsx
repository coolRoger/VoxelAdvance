import { createSignal, For, Show } from "solid-js";
import { PhIcon } from "@/components/common/ph-icon";
import { useDBContext } from "@/contexts/db";
import { GBASetting } from "@/db/repositry/gba_setting";
import { SHELL_COLORS_PRESETS } from "@/lib/constant/common";
import { GBAStore, setGBAStore } from "@/stores/gba";

type SettingModalProps = {
    open: boolean;
    onClose: () => void;
};

export function SettingModal(props: SettingModalProps) {
    const dbContext = useDBContext();
    const [busy, setBusy] = createSignal(false, { name: "settingsBusy" });
    const [message, setMessage] = createSignal("", { name: "settingsMessage" });

    const saveSetting = async (patch: {
        bodyColor?: string;
        frameRate?: number;
    }) => {
        const database = dbContext?.db();
        if (!database) return;
        const settings = await new GBASetting(database).load();
        await new GBASetting(database).update(settings.id, patch);
    };

    const selectColor = (color: string) => {
        setGBAStore((state) => {
            state.setting.bodyColor = color;
        });
        void saveSetting({ bodyColor: color });
    };

    const changeFrameRate = (value: string) => {
        const frameRate = Number(value);
        if (!Number.isFinite(frameRate)) return;
        setGBAStore((state) => {
            state.setting.frameRate = frameRate;
        });
        void saveSetting({ frameRate });
    };

    const importDatabase = async (file: File) => {
        setBusy(true);
        setMessage("");
        try {
            await dbContext?.importDB(file);
            setMessage("数据库导入成功");
        } catch {
            setMessage("数据库导入失败，请确认文件有效");
        } finally {
            setBusy(false);
        }
    };

    const exportDatabase = async () => {
        setBusy(true);
        try {
            await dbContext?.exportDB();
            setMessage("数据库导出已开始");
        } catch {
            setMessage("数据库导出失败");
        } finally {
            setBusy(false);
        }
    };

    const resetDatabase = async () => {
        if (
            !window.confirm("确定重置颜色和帧率，并删除所有 ROM 与存档状态吗？")
        )
            return;
        setBusy(true);
        try {
            await dbContext?.resetDB();
            setGBAStore((state) => {
                state.setting.bodyColor = "#9BBC0F";
                state.setting.frameRate = 60;
            });
            setMessage("已恢复默认设置并删除所有 ROM");
        } catch {
            setMessage("重置失败，请稍后再试");
        } finally {
            setBusy(false);
        }
    };
    return (
        <Show when={props.open}>
            <div
                class="settings-backdrop fixed inset-0 z-30 grid place-items-center bg-slate-950/30 p-5 backdrop-blur-sm"
                role="presentation"
                onClick={(event) => {
                    if (event.target === event.currentTarget) props.onClose();
                }}
            >
                <section
                    class="settings-panel w-full max-w-lg rounded-3xl border border-white/70 bg-base-100/95 p-6 shadow-2xl sm:p-8"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="settings-title"
                >
                    <header class="mb-7 flex items-start justify-between gap-4">
                        <div>
                            <p class="text-xs font-bold uppercase tracking-[0.25em] text-primary/60">
                                Device settings
                            </p>
                            <h2
                                id="settings-title"
                                class="mt-1 text-2xl font-black"
                            >
                                设置
                            </h2>
                        </div>
                        <button
                            type="button"
                            class="btn btn-ghost btn-circle"
                            aria-label="关闭设置"
                            onClick={props.onClose}
                        >
                            <PhIcon
                                name="x"
                                size={6}
                            />
                        </button>
                    </header>

                    <div class="space-y-6">
                        <div>
                            <h3 class="mb-3 font-bold">机体颜色</h3>
                            <div class="flex flex-wrap gap-3">
                                <For each={SHELL_COLORS_PRESETS}>
                                    {(color) => (
                                        <button
                                            type="button"
                                            class={`size-10 rounded-full border-2 border-white shadow-sm transition hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-primary${GBAStore.setting.bodyColor === color.value ? " ring-2 ring-slate-900 ring-offset-2" : ""}`}
                                            style={{
                                                "background-color": color.value,
                                            }}
                                            aria-label={`将机身设为${color.name}`}
                                            aria-pressed={
                                                GBAStore.setting.bodyColor ===
                                                color.value
                                                    ? "true"
                                                    : "false"
                                            }
                                            onClick={() =>
                                                selectColor(color.value)
                                            }
                                        />
                                    )}
                                </For>
                                <label class="grid size-10 cursor-pointer place-items-center rounded-full border-2 border-white bg-conic/decreasing from-violet-500 via-cyan-400 to-rose-500 shadow-sm">
                                    <input
                                        type="color"
                                        class="absolute size-0 opacity-0"
                                        value={
                                            GBAStore.setting.bodyColor ??
                                            "#9BBC0F"
                                        }
                                        aria-label="选择自定义机身颜色"
                                        onInput={(event) =>
                                            selectColor(
                                                event.currentTarget.value,
                                            )
                                        }
                                    />
                                </label>
                            </div>
                        </div>

                        <label class="form-control w-full">
                            <span class="mb-2 font-bold">Frame Rate</span>
                            <select
                                class="select select-bordered w-full"
                                value={GBAStore.setting.frameRate ?? 60}
                                onChange={(event) =>
                                    changeFrameRate(event.currentTarget.value)
                                }
                            >
                                <option value="30">30 FPS</option>
                                <option value="60">60 FPS</option>
                                <option value="90">90 FPS</option>
                                <option value="120">120 FPS</option>
                            </select>
                        </label>

                        <div class="divider my-0" />
                        <div class="grid gap-3 sm:grid-cols-2">
                            <label class="btn btn-outline justify-start">
                                导入数据库
                                <input
                                    type="file"
                                    accept=".tar,application/x-tar"
                                    class="hidden"
                                    disabled={busy()}
                                    onChange={(event) => {
                                        const file =
                                            event.currentTarget.files?.[0];
                                        if (file) void importDatabase(file);
                                        event.currentTarget.value = "";
                                    }}
                                />
                            </label>
                            <button
                                type="button"
                                class="btn btn-outline justify-start"
                                disabled={busy()}
                                onClick={() => void exportDatabase()}
                            >
                                导出数据库
                            </button>
                        </div>
                        <button
                            type="button"
                            class="btn btn-error btn-outline w-full justify-start"
                            disabled={busy()}
                            onClick={() => void resetDatabase()}
                        >
                            删除数据并重置设置
                        </button>
                        <Show when={message()}>
                            <p
                                class="text-sm font-semibold text-success"
                                role="status"
                            >
                                {message()}
                            </p>
                        </Show>
                    </div>
                </section>
            </div>
        </Show>
    );
}

export default SettingModal;
