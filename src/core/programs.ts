export interface GPUProgramDescriptor {
    shader: string;
}

export interface GPUComputeProgramDescriptor extends GPUProgramDescriptor {
    width: number;
    height: number;
    uniforms: GPUBuffer[];
    textures: Pick<GPUBindGroupLayoutEntry, 'texture' | 'storageTexture' | 'externalTexture'>[];
}

export interface GPURenderProgramDescriptor extends GPUProgramDescriptor {
    uniforms: GPUBuffer[];
    textures: Pick<GPUBindGroupLayoutEntry, 'texture' | 'storageTexture' | 'externalTexture'>[];
}

export function createComputeProgram(descriptor: GPUComputeProgramDescriptor) {
    const { device, workgroup } = gpu;
    const {
        shader: code,
        width,
        height,
        uniforms,
        textures: textureLayoutEntries,
    } = descriptor;

    const shaderModule = device.createShaderModule({ code });

    const workgroupCountX = Math.ceil(width / workgroup.sizeX);
    const workgroupCountY = Math.ceil(height / workgroup.sizeY);

    const uniformsBindGroupLayout = device.createBindGroupLayout({
        entries: uniforms.map((_, binding) => ({
            binding,
            visibility: GPUShaderStage.COMPUTE,
            buffer: {
                type: 'uniform',
            },
        })),
    });

    const texturesBindGroupLayout = device.createBindGroupLayout({
        entries: textureLayoutEntries.map((entry, binding) => ({
            binding,
            visibility: GPUShaderStage.COMPUTE,
            ...entry,
        })),
    });

    const uniformsBindGroup = device.createBindGroup({
        layout: uniformsBindGroupLayout,
        entries: uniforms.map((buffer, binding) => ({
            binding,
            resource: {
                buffer,
            },
        })),
    });

    const pipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [
            uniformsBindGroupLayout,
            texturesBindGroupLayout,
        ],
    });

    const pipeline = device.createComputePipeline({
        layout: pipelineLayout,
        compute: {
            module: shaderModule,
            entryPoint: 'main',
            constants: {
                0: workgroup.sizeX,
                1: workgroup.sizeY,
            },
        },
    });

    function dispatch(encoder: GPUCommandEncoder, textures: GPUTexture[]) {
        const texturesBindGroup = device.createBindGroup({
            layout: texturesBindGroupLayout,
            entries: textures.map((texture, binding) => ({
                binding,
                resource: texture.createView(),
            })),
        });

        const computePass = encoder.beginComputePass();

        computePass.setPipeline(pipeline);
        computePass.setBindGroup(0, uniformsBindGroup);
        computePass.setBindGroup(1, texturesBindGroup);
        computePass.dispatchWorkgroups(workgroupCountX, workgroupCountY);
        computePass.end();
    }

    return {
        dispatch,
    };
}

export function createRenderProgram(descriptor: GPURenderProgramDescriptor) {
    const { context, device, preferredFormat } = gpu;
    const {
        shader: code,
        uniforms,
        textures: textureLayoutEntries,
    } = descriptor;

    const shaderModule = device.createShaderModule({ code });

    const uniformsBindGroupLayout = device.createBindGroupLayout({
        entries: uniforms.map((_, binding) => ({
            binding,
            visibility: GPUShaderStage.FRAGMENT,
            buffer: {
                type: 'uniform',
            },
        })),
    });

    const texturesBindGroupLayout = device.createBindGroupLayout({
        entries: textureLayoutEntries.map((entry, binding) => ({
            binding,
            visibility: GPUShaderStage.FRAGMENT,
            ...entry,
        })),
    });

    const uniformsBindGroup = device.createBindGroup({
        layout: uniformsBindGroupLayout,
        entries: uniforms.map((buffer, binding) => ({
            binding,
            resource: {
                buffer,
            },
        })),
    });

    const pipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [
            uniformsBindGroupLayout,
            texturesBindGroupLayout,
        ],
    });

    const pipeline = device.createRenderPipeline({
        layout: pipelineLayout,
        vertex: {
            module: shaderModule,
            entryPoint: 'vs_main',
        },
        fragment: {
            module: shaderModule,
            entryPoint: 'fs_main',
            targets: [
                {
                    format: preferredFormat,
                },
            ],
        },
    });

    function dispatch(encoder: GPUCommandEncoder, textures: GPUTexture[]) {
        const texturesBindGroup = device.createBindGroup({
            layout: texturesBindGroupLayout,
            entries: textures.map((texture, binding) => ({
                binding,
                resource: texture.createView(),
            })),
        });

        const renderPass = encoder.beginRenderPass({
            colorAttachments: [
                {
                    view: context.getCurrentTexture().createView(),
                    loadOp: 'clear',
                    storeOp: 'store',
                    clearValue: [0, 0, 0, 1],
                },
            ],
        });

        renderPass.setPipeline(pipeline);
        renderPass.setBindGroup(0, uniformsBindGroup);
        renderPass.setBindGroup(1, texturesBindGroup);
        renderPass.draw(3);
        renderPass.end();
    }

    return {
        dispatch,
    };
}
