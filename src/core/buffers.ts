export function createUniformBuffer(data: BufferSource) {
    const buffer = gpu.device.createBuffer({
        size: data.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    gpu.device.queue.writeBuffer(buffer, 0, data);

    return buffer;
}
