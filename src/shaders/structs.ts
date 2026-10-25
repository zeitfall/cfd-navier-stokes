export const VERTEX_INPUT_STRUCT_SHADER = `
    struct VSInput {
        @builtin(vertex_index) vertex_index : u32,
    }
`;

export const VERTEX_OUTPUT_STRUCT_SHADER = `
    struct VSOutput {
        @builtin(position) position : vec4f,
    }
`;

export const COMPUTE_INPUT_STRUCT_SHADER = `
    struct CSInput {
        @builtin(global_invocation_id) global_id : vec3u,
    }
`;

export const SETTINGS_UNIFORMS_STRUCT_SHADER = `
    struct SettingsUniforms {
        dt                : f32,
        density           : f32,
        vorticity         : f32,
        dye_fade          : f32,
        pressure_blending : f32,
    }
`;

export const GRID_UNIFORMS_STRUCT_SHADER = `
    struct GridUniforms {
        width  : u32,
        height : u32,
        dx     : u32,
    }
`;

export const POINTER_UNIFORMS_STRUCT_SHADER = `
    struct PointerUniforms {
        position : vec2f,
        movement : vec2f,
        pressed  : f32,
    }
`;

export const SPLAT_UNIFORMS_STRUCT_SHADER = `
    struct SplatUniforms {
        radius    : f32,
        intensity : f32,
        force     : f32,
    }
`;
