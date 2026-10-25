export const READ_ONLY_STORAGE_TEXTURE_2D_LAYOUT_ENTRY = {
    storageTexture: {
        access: 'read-only',
        format: 'r32float',
        viewDimension: '2d',
    },
} as const;

export const WRITE_ONLY_STORAGE_TEXTURE_2D_LAYOUT_ENTRY = {
    storageTexture: {
        access: 'write-only',
        format: 'r32float',
        viewDimension: '2d',
    },
} as const;

export const READ_WRITE_STORAGE_TEXTURE_2D_LAYOUT_ENTRY = {
    storageTexture: {
        access: 'read-write',
        format: 'r32float',
        viewDimension: '2d',
    },
} as const;

export function createStorageTexture2D(width: number, height: number) {
    return gpu.device.createTexture({
        dimension: '2d',
        format: 'r32float',
        size: [width, height],
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING,
    });
}
