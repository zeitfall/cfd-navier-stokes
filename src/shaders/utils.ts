export const INTERPOLATION_UTILS_SHADER = `
    fn interpolate_bilinear(q : texture_storage_2d<r32float, read>, position : vec2f) -> f32 {
        var max_position     = vec2f(textureDimensions(q) - 1);
        var clamped_position = clamp(position, vec2f(0), max_position);
        var fract_position   = fract(clamped_position);

        var TL = vec2u(clamped_position);
        var BR = vec2u(min(floor(clamped_position) + 1, max_position));
        var TR = vec2u(BR.x, TL.y);
        var BL = vec2u(TL.x, BR.y);

        var qTL = textureLoad(q, TL)[0];
        var qTR = textureLoad(q, TR)[0];
        var qBL = textureLoad(q, BL)[0];
        var qBR = textureLoad(q, BR)[0];

        var qT = mix(qTL, qTR, fract_position.x);
        var qB = mix(qBL, qBR, fract_position.x);

        return mix(qT, qB, fract_position.y);
    }
`;
