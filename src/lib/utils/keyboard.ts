import { KEY_CODE_BY_CODE } from "../constant/keycode";

function keyboardCodeToKeyCode(code: string): number {
    if (/^Key[A-Z]$/.test(code)) return code.charCodeAt(3);
    if (/^Digit[0-9]$/.test(code)) return code.charCodeAt(5);

    const numpadMatch = /^Numpad([0-9])$/.exec(code);
    if (numpadMatch) return 96 + Number(numpadMatch[1]);

    const functionKeyMatch = /^F([1-9]|1[0-2])$/.exec(code);
    if (functionKeyMatch) return 111 + Number(functionKeyMatch[1]);

    if (code in KEY_CODE_BY_CODE) {
        return KEY_CODE_BY_CODE[code as keyof typeof KEY_CODE_BY_CODE];
    }

    return 0;
}

export { keyboardCodeToKeyCode };
