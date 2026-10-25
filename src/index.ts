import { Pane } from 'tweakpane';

import {
    initGPU,
    createUniformBuffer,
    createUint32DataLayout,
    createFloat32DataLayout,
    createComputeProgram,
    createStorageTexture2D,
    createRenderProgram,
    READ_ONLY_STORAGE_TEXTURE_2D_LAYOUT_ENTRY,
    READ_WRITE_STORAGE_TEXTURE_2D_LAYOUT_ENTRY,
} from './core';

import {
    ADVECTION_PROGRAM_SHADER,
    POINTER_PROGRAM_SHADER,
    DYE_POINTER_PROGRAM_SHADER,
    CALCULATE_DIVERGENCE_PROGRAM_SHADER,
    CALCULATE_PRESSURE_PROGRAM_SHADER,
    SUBTRACT_PRESSURE_PROGRAM_SHADER,
    CALCULATE_VORTICES_PROGRAM_SHADER,
    CLEAR_PROGRAM_SHADER,
    RENDER_PROGRAM_SHADER,
    APPLY_VORTICITY_PROGRAM_SHADER,
} from './shaders';

await initGPU({
    adapter: {
        powerPreference: 'high-performance',
    },
    canvas: {
        selector: 'canvas',
        alphaMode: 'premultiplied',
        colorSpace: 'display-p3',
    },
    workgroup: {
        sizeX: 8,
        sizeY: 8,
    },
});

const params = {
    backend: './index.html',
    vorticity: .0625,
    pressureIterations: 100,
    canvasResolution: 4,
    pressureBlending: .02,
    splatRadius: 8,
    dyeFade: .999,
};

const gui = new Pane();
const guiBackendBinding = gui.addBinding(params, 'backend', { label: 'Backend', options: { CPU: './cpu.html', GPU: './index.html' } });
const guiSimulationFolder = gui.addFolder({ title: 'Simulation' });
const guiVisualFolder = gui.addFolder({ title: 'Visual' });

guiSimulationFolder.addBinding(params, 'vorticity', { label: 'Vorticity', min: 0, max: .25, step: .0025 });
guiSimulationFolder.addBinding(params, 'pressureIterations', { label: 'Pressure Iterations', min: 2, max: 200, step: 2 });

guiVisualFolder.addBinding(params, 'pressureBlending', { label: 'Pressure Blending', min: 0, max: .5, step: .01 });
guiVisualFolder.addBinding(params, 'splatRadius', { label: 'Splat Radius', min: 2, max: 32, step: 2 });
guiVisualFolder.addBinding(params, 'dyeFade', { label: 'Dye Fade', min: .9, max: 1, step: .001 });

const gridWidth = Math.floor(gpu.canvas.clientWidth / params.canvasResolution);
const gridHeight = Math.floor(gpu.canvas.clientHeight / params.canvasResolution);
const dyeResolution = Math.round(params.canvasResolution * window.devicePixelRatio);

gpu.canvas.width = gridWidth * dyeResolution;
gpu.canvas.height = gridHeight * dyeResolution;

const settingsData = createFloat32DataLayout({
    dt: .25,
    density: 1,
    vorticity: params.vorticity,
    dyeFade: params.dyeFade,
    pressureBlending: params.pressureBlending,
});
const settingsUniformBuffer = createUniformBuffer(settingsData.array);

const gridData = createUint32DataLayout({
    width: gridWidth,
    height: gridHeight,
    dx: 1,
});
const gridUniformBuffer = createUniformBuffer(gridData.array);

const pointerData = createFloat32DataLayout({
    positionX: -1,
    positionY: -1,
    movementX: 0,
    movementY: 0,
    pressed: 0,
    _padding: 0,
});
const pointerUniformBuffer = createUniformBuffer(pointerData.array);

const splatData = createFloat32DataLayout({
    radius: params.splatRadius,
    intensity: .025,
    force: 2,
});
const splatUniformBuffer = createUniformBuffer(splatData.array);

let u0 = createStorageTexture2D(gridWidth + 1, gridHeight);
let u1 = createStorageTexture2D(gridWidth + 1, gridHeight);
let v0 = createStorageTexture2D(gridWidth, gridHeight + 1);
let v1 = createStorageTexture2D(gridWidth, gridHeight + 1);
const div = createStorageTexture2D(gridWidth, gridHeight);
let p0 = createStorageTexture2D(gridWidth, gridHeight);
let p1 = createStorageTexture2D(gridWidth, gridHeight);
const vor = createStorageTexture2D(gridWidth, gridHeight);
let dye0 = createStorageTexture2D(gpu.canvas.width, gpu.canvas.height);
let dye1 = createStorageTexture2D(gpu.canvas.width, gpu.canvas.height);

const pointerProgram = createComputeProgram({
    shader: POINTER_PROGRAM_SHADER,
    width: gridWidth,
    height: gridHeight,
    uniforms: [
        settingsUniformBuffer,
        gridUniformBuffer,
        pointerUniformBuffer,
        splatUniformBuffer,
    ],
    textures: [
        READ_WRITE_STORAGE_TEXTURE_2D_LAYOUT_ENTRY, // u
        READ_WRITE_STORAGE_TEXTURE_2D_LAYOUT_ENTRY, // v
    ],
});

const dyePointerProgram = createComputeProgram({
    shader: DYE_POINTER_PROGRAM_SHADER,
    width: gpu.canvas.width,
    height: gpu.canvas.height,
    uniforms: [
        settingsUniformBuffer,
        gridUniformBuffer,
        pointerUniformBuffer,
        splatUniformBuffer,
    ],
    textures: [READ_WRITE_STORAGE_TEXTURE_2D_LAYOUT_ENTRY], // dye
});

const advectionProgram = createComputeProgram({
    shader: ADVECTION_PROGRAM_SHADER,
    width: gridWidth,
    height: gridHeight,
    uniforms: [
        settingsUniformBuffer,
        gridUniformBuffer,
    ],
    textures: [
        READ_ONLY_STORAGE_TEXTURE_2D_LAYOUT_ENTRY,  // u
        READ_ONLY_STORAGE_TEXTURE_2D_LAYOUT_ENTRY,  // v
        READ_ONLY_STORAGE_TEXTURE_2D_LAYOUT_ENTRY,  // q0
        READ_WRITE_STORAGE_TEXTURE_2D_LAYOUT_ENTRY, // q1
    ],
});

const dyeAdvectionProgram = createComputeProgram({
    shader: ADVECTION_PROGRAM_SHADER,
    width: gpu.canvas.width,
    height: gpu.canvas.height,
    uniforms: [
        settingsUniformBuffer,
        gridUniformBuffer,
    ],
    textures: [
        READ_ONLY_STORAGE_TEXTURE_2D_LAYOUT_ENTRY,  // u
        READ_ONLY_STORAGE_TEXTURE_2D_LAYOUT_ENTRY,  // v
        READ_ONLY_STORAGE_TEXTURE_2D_LAYOUT_ENTRY,  // q0
        READ_WRITE_STORAGE_TEXTURE_2D_LAYOUT_ENTRY, // q1
    ],
});

const calculateDivergenceProgram = createComputeProgram({
    shader: CALCULATE_DIVERGENCE_PROGRAM_SHADER,
    width: gridWidth,
    height: gridHeight,
    uniforms: [
        settingsUniformBuffer,
        gridUniformBuffer,
    ],
    textures: [
        READ_ONLY_STORAGE_TEXTURE_2D_LAYOUT_ENTRY,  // u
        READ_ONLY_STORAGE_TEXTURE_2D_LAYOUT_ENTRY,  // v
        READ_WRITE_STORAGE_TEXTURE_2D_LAYOUT_ENTRY, // div
        READ_WRITE_STORAGE_TEXTURE_2D_LAYOUT_ENTRY, // p
    ],
});

const calculatePressureProgram = createComputeProgram({
    shader: CALCULATE_PRESSURE_PROGRAM_SHADER,
    width: gridWidth,
    height: gridHeight,
    uniforms: [
        settingsUniformBuffer,
        gridUniformBuffer,
    ],
    textures: [
        READ_ONLY_STORAGE_TEXTURE_2D_LAYOUT_ENTRY,  // div
        READ_ONLY_STORAGE_TEXTURE_2D_LAYOUT_ENTRY,  // p0
        READ_WRITE_STORAGE_TEXTURE_2D_LAYOUT_ENTRY, // p1
    ],
});

const subtractPressureProgram = createComputeProgram({
    shader: SUBTRACT_PRESSURE_PROGRAM_SHADER,
    width: gridWidth,
    height: gridHeight,
    uniforms: [
        settingsUniformBuffer,
        gridUniformBuffer,
    ],
    textures: [
        READ_WRITE_STORAGE_TEXTURE_2D_LAYOUT_ENTRY, // p
        READ_WRITE_STORAGE_TEXTURE_2D_LAYOUT_ENTRY, // u
        READ_WRITE_STORAGE_TEXTURE_2D_LAYOUT_ENTRY, // v
    ],
});

const calculateVorticesProgram = createComputeProgram({
    shader: CALCULATE_VORTICES_PROGRAM_SHADER,
    width: gridWidth,
    height: gridHeight,
    uniforms: [
        settingsUniformBuffer,
        gridUniformBuffer,
    ],
    textures: [
        READ_ONLY_STORAGE_TEXTURE_2D_LAYOUT_ENTRY,  // u
        READ_ONLY_STORAGE_TEXTURE_2D_LAYOUT_ENTRY,  // v
        READ_WRITE_STORAGE_TEXTURE_2D_LAYOUT_ENTRY, // vor
    ],
});

const applyVorticityProgram = createComputeProgram({
    shader: APPLY_VORTICITY_PROGRAM_SHADER,
    width: gridWidth,
    height: gridHeight,
    uniforms: [
        settingsUniformBuffer,
        gridUniformBuffer,
    ],
    textures: [
        READ_ONLY_STORAGE_TEXTURE_2D_LAYOUT_ENTRY,  // vor
        READ_WRITE_STORAGE_TEXTURE_2D_LAYOUT_ENTRY, // u
        READ_WRITE_STORAGE_TEXTURE_2D_LAYOUT_ENTRY, // v
    ],
});

const clearProgram = createComputeProgram({
    shader: CLEAR_PROGRAM_SHADER,
    width: gpu.canvas.width,
    height: gpu.canvas.height,
    uniforms: [
        settingsUniformBuffer,
        gridUniformBuffer,
    ],
    textures: [READ_WRITE_STORAGE_TEXTURE_2D_LAYOUT_ENTRY], // q
});

const renderProgram = createRenderProgram({
    shader: RENDER_PROGRAM_SHADER,
    uniforms: [
        settingsUniformBuffer,
        gridUniformBuffer,
    ],
    textures: [
        READ_ONLY_STORAGE_TEXTURE_2D_LAYOUT_ENTRY,
        READ_ONLY_STORAGE_TEXTURE_2D_LAYOUT_ENTRY,
    ],
});

guiBackendBinding.on('change', (event) => {
    window.location.href = event.value;
});

gui.on('change', () => {
    settingsData.set('vorticity', params.vorticity);
    settingsData.set('dyeFade', params.dyeFade);
    settingsData.set('pressureBlending', params.pressureBlending);
    splatData.set('radius', params.splatRadius);

    settingsData.writeTo(settingsUniformBuffer);
    splatData.writeTo(splatUniformBuffer);
});

gpu.canvas.addEventListener('pointerenter', handlePointerStart);
gpu.canvas.addEventListener('pointerdown', handlePointerStart);
gpu.canvas.addEventListener('pointermove', handlePointerMove);

requestAnimationFrame(loop);

function getPointerPosition(event: PointerEvent) {
    const canvasResolution = params.canvasResolution;

    return [event.offsetX / canvasResolution, event.offsetY / canvasResolution];
}

function handlePointerStart(event: PointerEvent) {
    const [positionX, positionY] = getPointerPosition(event);

    pointerData.set('positionX', positionX);
    pointerData.set('positionY', positionY);
}

function handlePointerMove(event: PointerEvent) {
    const [positionX, positionY] = getPointerPosition(event);

    const movementX = positionX - pointerData.get('positionX');
    const movementY = positionY - pointerData.get('positionY');

    pointerData.set('positionX', positionX);
    pointerData.set('positionY', positionY);
    pointerData.set('movementX', pointerData.get('movementX') + movementX);
    pointerData.set('movementY', pointerData.get('movementY') + movementY);
    pointerData.set('pressed', event.pressure);
}

function loop() {
    const pressureIterations = params.pressureIterations;

    let temp = null;

    pointerData.writeTo(pointerUniformBuffer);
    pointerData.set('movementX', 0);
    pointerData.set('movementY', 0);

    const commandEncoder = gpu.device.createCommandEncoder();

    pointerProgram.dispatch(commandEncoder, [
        u0,
        v0,
    ]);

    dyePointerProgram.dispatch(commandEncoder, [dye0]);

    // Advect U
    advectionProgram.dispatch(commandEncoder, [
        u0,
        v0,
        u0,
        u1,
    ]);

    // Advect V
    advectionProgram.dispatch(commandEncoder, [
        u0,
        v0,
        v0,
        v1,
    ]);

    temp = u0;
    u0 = u1;
    u1 = temp;

    temp = v0;
    v0 = v1;
    v1 = temp;

    // Calculate Vortices
    calculateVorticesProgram.dispatch(commandEncoder, [
        u0,
        v0,
        vor,
    ]);

    // Apply Vorticity
    applyVorticityProgram.dispatch(commandEncoder, [
        vor,
        u0,
        v0,
    ]);

    // Calculate Divergence
    calculateDivergenceProgram.dispatch(commandEncoder, [
        u0,
        v0,
        div,
        p0, // Clear pressure for the Jacobi iteration method
    ]);

    // Calculare Pressure
    for (let i = 0; i < pressureIterations; i++) {
        calculatePressureProgram.dispatch(commandEncoder, [
            div,
            p0,
            p1,
        ]);

        temp = p0;
        p0 = p1;
        p1 = temp;
    }

    // Subtract Pressure
    subtractPressureProgram.dispatch(commandEncoder, [
        p0,
        u0,
        v0,
    ]);

    // Advect Dye
    dyeAdvectionProgram.dispatch(commandEncoder, [
        u0,
        v0,
        dye0,
        dye1,
    ]);

    temp = dye0;
    dye0 = dye1;
    dye1 = temp;

    // Clear Dye
    clearProgram.dispatch(commandEncoder, [dye0]);

    // Render Dye
    renderProgram.dispatch(commandEncoder, [
        dye0,
        p0,
    ]);

    const commandBuffer = commandEncoder.finish();

    gpu.device.queue.submit([commandBuffer]);

    requestAnimationFrame(loop);
}
