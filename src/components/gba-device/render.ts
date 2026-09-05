import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

const fixedColors = {
    controls: "#262433",
    accent: "#ad385d",
    screen: "#20252d",
    hardware: "#5d5962",
    led: "#00a96e",
} as const;

export type GbaRendererOptions = {
    host: HTMLDivElement;
    shellColor: string;
    onLoadingChange: (loading: boolean) => void;
    onError: () => void;
};

export type GbaRenderer = {
    setShellColor: (color: string) => void;
    setPowerState: (poweredOn: boolean) => void;
    readonly getGameCanvas: () => HTMLCanvasElement;
    readonly invalidateGameTexture: () => void;
    dispose: () => void;
};

function createMaterial(color: string, roughness = 0.48, metalness = 0.03) {
    return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

export function createGbaRenderer(options: GbaRendererOptions): GbaRenderer {
    const { host } = options;
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 10);
    camera.position.set(0.16, 0.1, 0.3);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
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

    const shellMaterial = createMaterial(options.shellColor, 0.42);
    const controlsMaterial = createMaterial(fixedColors.controls, 0.36);
    const accentMaterial = createMaterial(fixedColors.accent, 0.38);
    const screenMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x080b12,
        roughness: 0.2,
        metalness: 0.08,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
    });
    const hardwareMaterial = createMaterial(fixedColors.hardware, 0.32, 0.45);
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

    const gameScreen = document.createElement("canvas");
    gameScreen.width = 240;
    gameScreen.height = 160;
    gameScreen.getContext("2d")?.fillRect(0, 0, 240, 160);
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
            modelSize = bounds.getSize(new THREE.Vector3());
            model.position.sub(bounds.getCenter(new THREE.Vector3()));
            model.add(gamePlane);
            model.rotation.x = -0.06;
            model.rotation.y = -0.28;
            scene.add(model);
            controls.target.set(0, 0, 0);
            controls.update();
            resize();
            options.onLoadingChange(false);
        },
        undefined,
        () => {
            options.onLoadingChange(false);
            options.onError();
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

    return {
        setShellColor: (color) => shellMaterial.color.set(color),
        setPowerState: (poweredOn) => {
            screenMaterial.color.set(poweredOn ? 0x080b12 : 0x020205);
            screenMaterial.emissive.set(poweredOn ? 0x000000 : 0x000000);
            ledMaterial.emissiveIntensity = poweredOn ? 1.4 : 0;
        },
        getGameCanvas: () => gameScreen,
        invalidateGameTexture: () => {
            gameTexture.needsUpdate = true;
        },
        dispose: () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
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
                material.dispose();
            }
        },
    };
}
