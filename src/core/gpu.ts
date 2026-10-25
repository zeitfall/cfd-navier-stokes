export interface GPUWorkgroupDescriptor {
    sizeX: number;
    sizeY: number;
}

export interface GPUCanvasDescriptor extends Omit<GPUCanvasConfiguration, 'device' | 'format'> {
    selector: string;
}

export interface GPUConfiguration {
    canvas: GPUCanvasDescriptor;
    workgroup: GPUWorkgroupDescriptor;
    adapter?: GPURequestAdapterOptions;
    device?: GPUDeviceDescriptor;
}

async function handleDeviceLost(device: GPUDevice) {
    const { reason, message } = await device.lost;

    window.alert(`GPU device was lost (${reason}): ${message}`);
    window.location.reload();
}

export async function initGPU(configuration: GPUConfiguration) {
    try {
        if (!navigator.gpu) {
            throw new Error('WebGPU is not supported by this browser.');
        }

        const adapter = await navigator.gpu.requestAdapter(configuration.adapter);

        if (!adapter) {
            throw new Error('Failed to request GPU adapter.');
        }

        const { selector, ...canvasConfiguration } = configuration.canvas;
        const device = await adapter.requestDevice(configuration.device);
        const preferredFormat = navigator.gpu.getPreferredCanvasFormat();
        const canvas = document.querySelector(selector);

        if (!(canvas instanceof HTMLCanvasElement)) {
            throw new Error('Provided selector does not match any canvas element.');
        }

        const context = canvas.getContext('webgpu');

        context.configure({
            device,
            format: preferredFormat,
            ...canvasConfiguration,
        });

        Object.defineProperty(globalThis, 'gpu', {
            value: {
                canvas,
                context,
                adapter,
                device,
                preferredFormat,
                workgroup: configuration.workgroup,
            },
        });

        handleDeviceLost(device);
    }
    catch (error) {
        window.alert(error);

        throw error;
    }
}
