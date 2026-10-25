import type { GPUWorkgroupDescriptor } from './core';

declare global {
    const gpu: {
        canvas: HTMLCanvasElement;
        context: GPUCanvasContext;
        adapter: GPUAdapter;
        device: GPUDevice;
        preferredFormat: GPUTextureFormat;
        workgroup: GPUWorkgroupDescriptor;
    };
}
