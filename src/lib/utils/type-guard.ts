const isArrayBuffer = (value: unknown): value is ArrayBuffer => {
    return Object.prototype.toString.call(value) === "[object ArrayBuffer]";
};

export { isArrayBuffer };
