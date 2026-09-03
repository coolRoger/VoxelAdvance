import type { RouteDefinition } from "@solidjs/router";
import { createEffect, createSignal, For, onSettled, Show } from "solid-js";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import type { GBA } from "gba-game";
import { GameBoyAdvanceSoftwareRenderer } from "gba-game";

export const route = {
    preload: () => {},
} satisfies RouteDefinition;

const shellColors = [
    { name: "雾紫", value: "#8f86c9" },
    { name: "冰川蓝", value: "#79a7c9" },
    { name: "鼠尾草", value: "#82aa8a" },
    { name: "珊瑚红", value: "#cb6f6d" },
    { name: "经典靛蓝", value: "#514b9d" },
    { name: "暖灰", value: "#a69f95" },
] as const;

const fixedColors = {
    controls: "#262433",
    accent: "#ad385d",
    screen: "#20252d",
    hardware: "#5d5962",
    led: "#72db96",
} as const;

function createMaterial(color: string, roughness = 0.48, metalness = 0.03) {
    return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function GbaViewer(props: { shellColor: string }) {
    let host!: HTMLDivElement;
    const [loading, setLoading] = createSignal(true, {
        name: "gbaModelLoading",
    });
    const [error, setError] = createSignal(false, { name: "gbaModelError" });
    let shellMaterial: THREE.MeshStandardMaterial | undefined;
    let emulator: GBA | undefined;
    let gameScreen: HTMLCanvasElement | undefined;

    createEffect(
        () => props.shellColor,
        (color) => {
            shellMaterial?.color.set(color);
        },
        { name: "syncGbaShellColor" },
    );

    onSettled(() => {
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 10);
        camera.position.set(0.16, 0.1, 0.3);

        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            // powerPreference: "high-performance",
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFShadowMap;
        host.append(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.enablePan = false;
        controls.minZoom = 0.6;
        controls.maxZoom = 2.4;

        scene.add(new THREE.HemisphereLight(0xf5f1ff, 0x241d3b, 2.8));
        const keyLight = new THREE.DirectionalLight(0xffffff, 4.6);
        keyLight.position.set(0.18, 0.3, 0.36);
        keyLight.castShadow = true;
        scene.add(keyLight);
        const rimLight = new THREE.DirectionalLight(0xb7b0ff, 2.2);
        rimLight.position.set(-0.3, 0.12, -0.12);
        scene.add(rimLight);

        shellMaterial = createMaterial(props.shellColor, 0.42);
        const controlsMaterial = createMaterial(fixedColors.controls, 0.36);
        const accentMaterial = createMaterial(fixedColors.accent, 0.38);
        const screenMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x080b12,
            roughness: 0.2,
            metalness: 0.08,
            clearcoat: 1,
            clearcoatRoughness: 0.1,
        });
        const hardwareMaterial = createMaterial(
            fixedColors.hardware,
            0.32,
            0.45,
        );
        const ledMaterial = new THREE.MeshStandardMaterial({
            color: fixedColors.led,
            emissive: fixedColors.led,
            emissiveIntensity: 1.4,
        });

        let modelSize: THREE.Vector3 | undefined;
        const resize = () => {
            const width = Math.max(host.clientWidth, 1);
            const height = Math.max(host.clientHeight, 1);
            const aspect = width / height;
            renderer.setSize(width, height);

            if (modelSize) {
                const targetCoverage = 2 / 3;
                const viewHeight = Math.max(
                    modelSize.y / targetCoverage,
                    modelSize.x / (targetCoverage * aspect),
                );
                camera.left = (-viewHeight * aspect) / 2;
                camera.right = (viewHeight * aspect) / 2;
                camera.top = viewHeight / 2;
                camera.bottom = -viewHeight / 2;
            }
            camera.updateProjectionMatrix();
        };

        gameScreen = document.createElement("canvas");
        gameScreen.width = 240;
        gameScreen.height = 160;
        const gameContext = gameScreen.getContext("2d");
        gameContext?.fillRect(0, 0, 240, 160);
        const gameTexture = new THREE.CanvasTexture(gameScreen);
        gameTexture.colorSpace = THREE.SRGBColorSpace;
        gameTexture.minFilter = THREE.NearestFilter;
        gameTexture.magFilter = THREE.NearestFilter;
        const gameMaterial = new THREE.MeshBasicMaterial({
            map: gameTexture,
            toneMapped: false,
        });
        const screenWidth = 0.0575;
        const screenHeight = screenWidth * (2 / 3);
        const cornerRadius = 0.0016;
        const screenShape = new THREE.Shape();
        screenShape.moveTo(-screenWidth / 2 + cornerRadius, -screenHeight / 2);
        screenShape.lineTo(screenWidth / 2 - cornerRadius, -screenHeight / 2);
        screenShape.quadraticCurveTo(
            screenWidth / 2,
            -screenHeight / 2,
            screenWidth / 2,
            -screenHeight / 2 + cornerRadius,
        );
        screenShape.lineTo(screenWidth / 2, screenHeight / 2 - cornerRadius);
        screenShape.quadraticCurveTo(
            screenWidth / 2,
            screenHeight / 2,
            screenWidth / 2 - cornerRadius,
            screenHeight / 2,
        );
        screenShape.lineTo(-screenWidth / 2 + cornerRadius, screenHeight / 2);
        screenShape.quadraticCurveTo(
            -screenWidth / 2,
            screenHeight / 2,
            -screenWidth / 2,
            screenHeight / 2 - cornerRadius,
        );
        screenShape.lineTo(-screenWidth / 2, -screenHeight / 2 + cornerRadius);
        screenShape.quadraticCurveTo(
            -screenWidth / 2,
            -screenHeight / 2,
            -screenWidth / 2 + cornerRadius,
            -screenHeight / 2,
        );
        const screenGeometry = new THREE.ShapeGeometry(screenShape);
        const position = screenGeometry.getAttribute("position");
        const uv = new Float32Array(position.count * 2);
        for (let index = 0; index < position.count; index += 1) {
            uv[index * 2] = position.getX(index) / screenWidth + 0.5;
            uv[index * 2 + 1] = position.getY(index) / screenHeight + 0.5;
        }
        screenGeometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
        const gamePlane = new THREE.Mesh(screenGeometry, gameMaterial);
        gamePlane.position.set(0, 0.0416, 0.00818);
        gamePlane.renderOrder = 3;

        const startEmulator = async () => {
            const [{ GBA }, biosResponse, romResponse] = await Promise.all([
                import("gba-game"),
                fetch("/games/gba-bios.bin"),
                fetch("/games/pokemon_emerald_cn.gba"),
            ]);
            if (!biosResponse.ok || !romResponse.ok || !gameScreen) {
                throw new Error("GBA 游戏资源加载失败");
            }
            emulator = new GBA({ throttle: 16 });
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
            emulator.setCanvasDirect(gameScreen);
            emulator.video.drawCallback = () => {
                gameTexture.needsUpdate = true;
            };
            emulator.setBios(await biosResponse.arrayBuffer());
            const loaded = await emulator.setRomAsync(
                await romResponse.arrayBuffer(),
            );
            if (!loaded) throw new Error("GBA ROM 无法启动");
            for (const object of emulator.video.renderPath.oam.objs) {
                object.pushPixel = GameBoyAdvanceSoftwareRenderer.pushPixel;
            }
            emulator.runStable();
        };

        const resumeAudio = () => {
            void emulator?.audio.context?.resume();
        };
        window.addEventListener("keydown", resumeAudio, { once: true });
        window.addEventListener("pointerdown", resumeAudio, { once: true });

        const loader = new OBJLoader();
        loader.load(
            "/models/gba_OBJ/gba.obj",
            (model) => {
                model.traverse((child) => {
                    if (!(child instanceof THREE.Mesh)) return;
                    const name = child.name.toLowerCase();
                    child.castShadow = true;
                    child.receiveShadow = true;

                    if (name === "gba_body" || name.includes("battery_cover")) {
                        child.material = shellMaterial;
                    } else if (
                        name.includes("button_a") ||
                        name.includes("button_b")
                    ) {
                        child.material = accentMaterial;
                    } else if (
                        name.includes("button") ||
                        name.includes("dpad") ||
                        name.includes("powerswitch")
                    ) {
                        child.material = controlsMaterial;
                    } else if (name.includes("screen_glass")) {
                        child.material = screenMaterial;
                        child.renderOrder = 1;
                    } else if (name.includes("led")) {
                        child.material = ledMaterial;
                    } else if (
                        name.includes("screw") ||
                        name.includes("port") ||
                        name.includes("jack") ||
                        name.includes("wheel")
                    ) {
                        child.material = hardwareMaterial;
                    } else {
                        child.material = shellMaterial;
                    }
                });

                const bounds = new THREE.Box3().setFromObject(model);
                const center = bounds.getCenter(new THREE.Vector3());
                modelSize = bounds.getSize(new THREE.Vector3());
                model.position.sub(center);
                model.add(gamePlane);
                model.rotation.x = -0.06;
                model.rotation.y = -0.28;
                scene.add(model);
                controls.target.set(0, 0, 0);
                controls.update();
                resize();
                void startEmulator().catch((cause: unknown) => {
                    console.error("GBA 模拟器启动失败", cause);
                    setError(true);
                });
                setLoading(false);
            },
            undefined,
            () => {
                setLoading(false);
                setError(true);
            },
        );

        const observer = new ResizeObserver(resize);
        observer.observe(host);
        resize();

        let frame = 0;
        const render = () => {
            controls.update();
            renderer.render(scene, camera);
            frame = requestAnimationFrame(render);
        };
        render();

        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
            window.removeEventListener("keydown", resumeAudio);
            window.removeEventListener("pointerdown", resumeAudio);
            emulator?.pause();
            emulator?.audio.context?.close();
            controls.dispose();
            gameTexture.dispose();
            gameMaterial.dispose();
            screenGeometry.dispose();
            renderer.dispose();
            renderer.domElement.remove();
            scene.traverse((object) => {
                if (object instanceof THREE.Mesh) object.geometry.dispose();
            });
            for (const material of [
                shellMaterial,
                controlsMaterial,
                accentMaterial,
                screenMaterial,
                hardwareMaterial,
                ledMaterial,
            ]) {
                material?.dispose();
            }
        };
    });

    return (
        <div class="absolute inset-0 overflow-hidden">
            <div
                ref={host}
                class="absolute inset-0 cursor-grab active:cursor-grabbing"
            />
            <Show when={loading()}>
                <div class="pointer-events-none absolute inset-0 grid place-items-center">
                    <span class="loading loading-spinner loading-lg text-violet-700" />
                </div>
            </Show>
            <Show when={error()}>
                <div
                    class="pointer-events-none absolute inset-0 grid place-items-center text-4xl text-rose-600"
                    role="alert"
                    aria-label="模型加载失败"
                >
                    ×
                </div>
            </Show>
        </div>
    );
}

export default function Home() {
    const [shellColor, setShellColor] = createSignal<string>(
        shellColors[0].value,
        { name: "gbaShellColor" },
    );

    return (
        <main class="relative h-screen w-screen overflow-hidden bg-[#f6f3ff] text-slate-900">
            <div class="pointer-events-none absolute -top-36 -left-24 h-96 w-96 rounded-full bg-violet-300/35 blur-3xl" />
            <div class="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-fuchsia-200/35 blur-3xl" />

            <GbaViewer shellColor={shellColor()} />

            <a
                href="/"
                class="absolute top-5 left-5 z-10 flex items-center gap-3 font-black tracking-tight sm:top-7 sm:left-8"
                aria-label="Voxel Advance 首页"
            >
                <span class="grid size-10 place-items-center rounded-xl bg-slate-950 text-xl text-white shadow-lg shadow-violet-300">
                    ◈
                </span>
                <span>VOXEL ADVANCE</span>
            </a>

            <fieldset
                class="absolute top-5 right-5 z-10 rounded-2xl border border-white/80 bg-white/65 p-2 shadow-xl shadow-violet-900/10 backdrop-blur-md sm:top-7 sm:right-8"
                aria-label="机身颜色"
            >
                <div class="flex flex-wrap justify-end gap-2">
                    <For each={shellColors}>
                        {(color) => (
                            <button
                                type="button"
                                class={{
                                    "group grid size-9 place-items-center rounded-full border border-white bg-white shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600": true,
                                    "ring-2 ring-slate-900 ring-offset-2 ring-offset-white/60":
                                        shellColor() === color.value,
                                }}
                                aria-label={`将机身设为${color.name}`}
                                aria-pressed={
                                    shellColor() === color.value
                                        ? "true"
                                        : "false"
                                }
                                onClick={() => setShellColor(color.value)}
                            >
                                <span
                                    class="size-7 rounded-full border border-black/10"
                                    style={{ "background-color": color.value }}
                                />
                            </button>
                        )}
                    </For>
                    <label class="relative grid size-9 cursor-pointer place-items-center rounded-full border border-white bg-white shadow-sm transition hover:-translate-y-0.5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-violet-600">
                        <input
                            type="color"
                            class="absolute inset-0 cursor-pointer opacity-0"
                            value={shellColor()}
                            aria-label="选择自定义机身颜色"
                            onInput={(event) =>
                                setShellColor(event.currentTarget.value)
                            }
                        />
                        <span class="grid size-7 place-items-center rounded-full bg-conic/decreasing from-violet-500 via-cyan-400 to-rose-500 text-xs text-white">
                            ✦
                        </span>
                    </label>
                </div>
            </fieldset>
        </main>
    );
}
