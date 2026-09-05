import type { GbaEmulatorOptions, GbaEmulatorSession } from "./types";

/**
 * mGBA-WASM adapter seam.
 *
 * Keep the device component dependent on this contract rather than on a
 * concrete emulator. The package's runtime API is intentionally not assumed
 * here until its installed exports and initialization contract are verified.
 *
 * A future implementation should own BIOS/ROM loading, keyboard mapping,
 * canvas frame output, power control, and disposal, then return the same
 * GbaEmulatorSession shape as createGbaEmulator.
 */
export async function createMgbaWasmEmulator(
    _options: GbaEmulatorOptions,
): Promise<GbaEmulatorSession> {
    throw new Error("mGBA-WASM 适配器尚未实现");
}
