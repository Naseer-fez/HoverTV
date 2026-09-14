#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_video_texture;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_intensity;
uniform float u_temperature;
uniform float u_is_static;
uniform float u_anim_phase;
uniform float u_anim_progress;

uniform bool u_enable_scanlines;
uniform bool u_enable_curvature;
uniform bool u_enable_vignette;
uniform bool u_enable_chromatic;
uniform bool u_enable_glow;
uniform bool u_enable_noise;

// Pseudo-random hash function for noise & static
float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

// Barrel distortion simulating curved cathode-ray tube glass
vec2 curveUV(vec2 uv) {
    vec2 cc = uv - 0.5;
    float dist = dot(cc, cc);
    float bend = 0.15 * u_intensity;
    return uv + cc * dist * bend;
}

// Color temperature shift matrix: warm amber (< 0.5) to cool blue (> 0.5)
vec3 applyColorTemp(vec3 col, float temp) {
    float shift = (temp - 0.5) * 2.0; // [-1.0, 1.0]
    vec3 warm = vec3(1.15, 0.95, 0.80);
    vec3 cool = vec3(0.85, 0.95, 1.20);
    vec3 filterTint = shift < 0.0 ? mix(vec3(1.0), warm, -shift) : mix(vec3(1.0), cool, shift);
    return col * filterTint;
}

void main() {
    vec2 uv = v_uv;

    // 1. Barrel Curvature
    if (u_enable_curvature) {
        uv = curveUV(uv);
        if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
            fragColor = vec4(0.0, 0.0, 0.0, 1.0);
            return;
        }
    }

    // Power state check: off
    if (u_anim_phase > 7.5) {
        fragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }

    // Power-on Phase 1: Horizontal line
    if (u_anim_phase > 0.5 && u_anim_phase < 1.5) {
        float distY = abs(uv.y - 0.5);
        float beam = exp(-distY * distY * 35000.0);
        vec3 beamCol = vec3(0.85, 0.95, 1.0) * beam * 2.5;
        fragColor = vec4(clamp(beamCol, 0.0, 1.0), 1.0);
        return;
    }

    float animEdgeGlow = 0.0;

    // Power-on Phase 2: Vertical expand
    if (u_anim_phase > 1.5 && u_anim_phase < 2.5) {
        float p = sin(clamp(u_anim_progress, 0.0, 1.0) * 1.5707963);
        float halfHeight = max(0.002, 0.5 * p);
        float distY = abs(uv.y - 0.5);
        if (distY > halfHeight) {
            fragColor = vec4(0.0, 0.0, 0.0, 1.0);
            return;
        }
        uv.y = 0.5 + (uv.y - 0.5) / p;
        if (abs(distY - halfHeight) < 0.015) {
            animEdgeGlow = (1.0 - abs(distY - halfHeight) / 0.015) * (1.0 - p) * 1.5;
        }
    }

    // Power-on Phase 3: Static burst
    if (u_anim_phase > 2.5 && u_anim_phase < 3.5) {
        float burst = mix(2.5, 1.0, u_anim_progress);
        float noise = hash(uv * 400.0 + fract(u_time * 19.0));
        vec3 burstCol = vec3(noise * burst);
        fragColor = vec4(clamp(burstCol, 0.0, 1.0), 1.0);
        return;
    }

    // Power-off Phase 4: Vertical compress
    if (u_anim_phase > 3.5 && u_anim_phase < 4.5) {
        float p = pow(clamp(u_anim_progress, 0.0, 1.0), 1.8);
        float halfHeight = max(0.002, 0.5 * (1.0 - p));
        float distY = abs(uv.y - 0.5);
        if (distY > halfHeight) {
            fragColor = vec4(0.0, 0.0, 0.0, 1.0);
            return;
        }
        uv.y = 0.5 + (uv.y - 0.5) / max(0.001, 1.0 - p);
        if (abs(distY - halfHeight) < 0.015) {
            animEdgeGlow = (1.0 - abs(distY - halfHeight) / 0.015) * p * 1.5;
        }
    }

    // Power-off Phase 5: Shrink to horizontal line
    if (u_anim_phase > 4.5 && u_anim_phase < 5.5) {
        float distY = abs(uv.y - 0.5);
        float beam = exp(-distY * distY * 35000.0);
        vec3 beamCol = vec3(0.9, 0.95, 1.0) * beam * 3.0;
        fragColor = vec4(clamp(beamCol, 0.0, 1.0), 1.0);
        return;
    }

    // Power-off Phase 6: Line shrinks to center dot
    if (u_anim_phase > 5.5 && u_anim_phase < 6.5) {
        float halfWidth = max(0.003, 0.5 * (1.0 - u_anim_progress));
        float distX = abs(uv.x - 0.5);
        float distY = abs(uv.y - 0.5);
        if (distX > halfWidth) {
            fragColor = vec4(0.0, 0.0, 0.0, 1.0);
            return;
        }
        float beam = exp(-distY * distY * 35000.0) * (1.0 - distX / halfWidth);
        float dotCore = exp(-(distX * distX + distY * distY) * 20000.0) * 2.0;
        vec3 dotCol = vec3(0.9, 0.95, 1.0) * (beam + dotCore);
        fragColor = vec4(clamp(dotCol, 0.0, 1.0), 1.0);
        return;
    }

    // Power-off Phase 7: Center dot fades
    if (u_anim_phase > 6.5 && u_anim_phase < 7.5) {
        vec2 centerDiff = uv - 0.5;
        float distSq = dot(centerDiff, centerDiff);
        float dotGlow = exp(-distSq * 25000.0) * (1.0 - u_anim_progress) * 2.0;
        float halo = exp(-distSq * 4000.0) * (1.0 - u_anim_progress) * 0.5;
        vec3 dotCol = vec3(0.9, 0.95, 1.0) * (dotGlow + halo);
        fragColor = vec4(clamp(dotCol, 0.0, 1.0), 1.0);
        return;
    }

    // 2. Full-screen Static / No-Signal Mode
    if (u_is_static > 0.5) {
        float noise = hash(uv * 450.0 + fract(u_time * 15.0));
        float roll = sin(uv.y * 3.0 + u_time * 1.5) * 0.08;
        vec3 staticCol = vec3(clamp(noise + roll, 0.0, 1.0));
        if (u_enable_scanlines) {
            float scan = sin(uv.y * u_resolution.y * 3.14159) * 0.18;
            staticCol -= scan;
        }
        staticCol = applyColorTemp(staticCol, u_temperature);
        if (animEdgeGlow > 0.0) {
            staticCol += vec3(animEdgeGlow * 0.8, animEdgeGlow * 0.9, animEdgeGlow);
        }
        fragColor = vec4(clamp(staticCol, 0.0, 1.0), 1.0);
        return;
    }

    // 3. Chromatic Aberration
    vec3 col;
    if (u_enable_chromatic) {
        float offset = 0.003 * u_intensity;
        float r = texture(u_video_texture, uv + vec2(offset, 0.0)).r;
        float g = texture(u_video_texture, uv).g;
        float b = texture(u_video_texture, uv - vec2(offset, 0.0)).b;
        col = vec3(r, g, b);
    } else {
        col = texture(u_video_texture, uv).rgb;
    }

    // 4. Subtle CRT Glow/Bloom
    if (u_enable_glow && u_intensity > 0.1) {
        vec3 blur = (
            texture(u_video_texture, uv + vec2(0.002, 0.002)).rgb +
            texture(u_video_texture, uv - vec2(0.002, 0.002)).rgb +
            texture(u_video_texture, uv + vec2(-0.002, 0.002)).rgb +
            texture(u_video_texture, uv + vec2(0.002, -0.002)).rgb
        ) * 0.25;
        col = mix(col, max(col, blur), 0.3 * u_intensity);
    }

    // 5. Scanlines
    if (u_enable_scanlines) {
        float count = u_resolution.y * 0.8;
        float scanline = sin((uv.y * count + u_time * 2.0) * 3.14159);
        scanline = (scanline + 1.0) * 0.5; // [0, 1]
        col *= mix(1.0, 0.75 + 0.25 * scanline, u_intensity);
    }

    // 6. Vignette (Edge Darkening)
    if (u_enable_vignette) {
        float vignette = uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y);
        vignette = clamp(pow(16.0 * vignette, 0.3), 0.0, 1.0);
        col *= mix(1.0, vignette, 0.6 * u_intensity);
    }

    // 7. Analog Noise / Grain
    if (u_enable_noise) {
        float grain = (hash(uv * 300.0 + fract(u_time * 7.0)) - 0.5) * 0.08 * u_intensity;
        col += grain;
    }

    // 8. Color Temperature Matrix Shift
    col = applyColorTemp(col, u_temperature);

    if (animEdgeGlow > 0.0) {
        col += vec3(animEdgeGlow * 0.8, animEdgeGlow * 0.9, animEdgeGlow);
    }

    fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
