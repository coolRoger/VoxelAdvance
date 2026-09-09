import type mGBA from "@thenick775/mgba-wasm";

/** Keep the raw Emscripten import separate so adapter tests need no wasm. */
export async function loadMgbaRuntime(): Promise<typeof mGBA> {
    const runtimeUrl = `${import.meta.env.BASE_URL}emulator/mgba/mgba.js`;
    const { default: factory } = (await import(
        /* @vite-ignore */ runtimeUrl
    )) as {
        default: typeof mGBA;
    };
    return factory;
}
