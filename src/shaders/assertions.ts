export const BOUND_ASSERTIONS_SHADER = `
    fn is_inside_bounds(position : vec2u, padding : u32) -> bool {
        var x      = position.x;
        var y      = position.y;
        var width  = u_grid.width;
        var height = u_grid.height;

        return x >= padding
            && y >= padding
            && x < width - padding
            && y < height - padding;
    }

    fn is_outside_bounds(position : vec2u, padding : u32) -> bool {
        return !is_inside_bounds(position, padding);
    }

    fn is_interior(position : vec2u) -> bool {
        return is_inside_bounds(position, 1);
    }

    fn is_exterior(position : vec2u) -> bool {
        return !is_interior(position);
    }

    fn is_texture_interior(position : vec2u, size : vec2u) -> bool {
        return position.x >= 1
            && position.y >= 1
            && position.x < size.x - 1
            && position.y < size.y - 1;
    }

    fn is_texture_exterior(position : vec2u, size : vec2u) -> bool {
        return !is_texture_interior(position, size);
    }
`;

export const POINTER_ASSERTIONS_SHADER = `
    fn is_pointer_moved() -> bool {
        return length(u_pointer.movement) > 0;
    }

    fn is_pointer_pressed() -> bool {
        return u_pointer.pressed > 0;
    }

    fn is_pointer_valid() -> bool {
        return u_pointer.position.x >= 0
            && u_pointer.position.y >= 0
            && is_pointer_moved()
            && is_pointer_pressed();
    }
`;
