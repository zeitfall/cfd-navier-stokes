type TypedArrayConstructor = Uint32ArrayConstructor | Float32ArrayConstructor;

export function createDataLayout<
    A extends TypedArrayConstructor,
    O extends Record<string, number>
>(
    arrayConstructor: A,
    object: O
) {
    const values: number[] = [];
    const indices = new Map<keyof O, number>();

    Object.entries(object).forEach((entry, index) => {
        const [key, value] = entry;

        values.push(value);
        indices.set(key, index);
    });

    const array = new arrayConstructor(values) as InstanceType<A>;

    function get(key: keyof O) {
        const index = indices.get(key);

        return array[index];
    }

    function set(key: keyof O, value: number) {
        const index = indices.get(key);

        array[index] = value;
    }

    function writeTo(buffer: GPUBuffer) {
        gpu.device.queue.writeBuffer(buffer, 0, array);
    }

    return {
        array,
        get,
        set,
        writeTo,
    };
}

export function createUint32DataLayout<O extends Record<string, number>>(object: O) {
    return createDataLayout(Uint32Array, object);
}

export function createFloat32DataLayout<O extends Record<string, number>>(object: O) {
    return createDataLayout(Float32Array, object);
}
