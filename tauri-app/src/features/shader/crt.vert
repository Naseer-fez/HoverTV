#version 300 es
in vec2 a_position;
out vec2 v_uv;

void main() {
    // Maps [-1, 1] clip space to [0, 1] UV space
    v_uv = (a_position + 1.0) * 0.5;
    // Flip Y for video texture coordinates
    v_uv.y = 1.0 - v_uv.y;
    gl_Position = vec4(a_position, 0.0, 1.0);
}
