import { logInfo, logBoundaryError } from '../../core/utils/logger';
import { getIntensity, getTemperature, isEffectEnabled, getAnimPhase, getAnimProgress } from './uniforms';
import { getState } from '../tv-state/store';
import { TVState } from '../tv-state/state-machine';

let gl: WebGL2RenderingContext | null = null;
let program: WebGLProgram | null = null;
let videoTexture: WebGLTexture | null = null;
let targetVideo: HTMLVideoElement | null = null;
let animFrameId: number | null = null;

function createShader(type: number, src: string): WebGLShader | null {
  if (!gl) return null;
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile failure: ${info}`);
  }
  return shader;
}

async function initShaderProgram(): Promise<WebGLProgram> {
  if (!gl) throw new Error('No WebGL2 context');
  const vertSrc = (await import('./crt.vert?raw')).default;
  const fragSrc = (await import('./crt.frag?raw')).default;
  const vs = createShader(gl.VERTEX_SHADER, vertSrc);
  const fs = createShader(gl.FRAGMENT_SHADER, fragSrc);
  if (!vs || !fs) throw new Error('Failed to create shaders');

  const prog = gl.createProgram();
  if (!prog) throw new Error('Failed to create program');
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);

  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error(`Link failure: ${gl.getProgramInfoLog(prog)}`);
  }
  return prog;
}

function setupQuadGeometry(prog: WebGLProgram): void {
  if (!gl) return;
  const quadVerts = new Float32Array([
    -1.0, -1.0,
     1.0, -1.0,
    -1.0,  1.0,
    -1.0,  1.0,
     1.0, -1.0,
     1.0,  1.0,
  ]);
  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);

  const posLoc = gl.getAttribLocation(prog, 'a_position');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
}

function setupTexture(): WebGLTexture | null {
  if (!gl) return null;
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  return tex;
}

let corsBlocked = false;

export function resetCorsState(): void {
  corsBlocked = false;
}

export function isCorsBlocked(): boolean {
  return corsBlocked;
}

function isYouTubeActive(): boolean {
  if (typeof document === 'undefined') return false;
  const housing = document.getElementById('screen-housing');
  if (housing?.classList.contains('youtube-active')) return true;
  const ytFrame = document.getElementById('youtube-frame') as HTMLIFrameElement | null;
  return ytFrame !== null && ytFrame.style.display === 'block';
}

function updateUniforms(time: number): void {
  if (!gl || !program) return;
  gl.useProgram(program);
  const canvas = gl.canvas as HTMLCanvasElement;

  gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), canvas.width, canvas.height);
  gl.uniform1f(gl.getUniformLocation(program, 'u_time'), time * 0.001);
  gl.uniform1f(gl.getUniformLocation(program, 'u_intensity'), getIntensity());
  gl.uniform1f(gl.getUniformLocation(program, 'u_temperature'), getTemperature());

  const currentState = getState();
  const isStatic = (
    currentState === TVState.STATIC ||
    currentState === TVState.POWERING_ON ||
    !targetVideo ||
    targetVideo.readyState < 2 ||
    corsBlocked
  ) ? 1.0 : 0.0;
  gl.uniform1f(gl.getUniformLocation(program, 'u_is_static'), isStatic);

  gl.uniform1f(gl.getUniformLocation(program, 'u_anim_phase'), getAnimPhase());
  gl.uniform1f(gl.getUniformLocation(program, 'u_anim_progress'), getAnimProgress());

  gl.uniform1i(gl.getUniformLocation(program, 'u_enable_scanlines'), isEffectEnabled('scanlines') ? 1 : 0);
  gl.uniform1i(gl.getUniformLocation(program, 'u_enable_curvature'), isEffectEnabled('curvature') ? 1 : 0);
  gl.uniform1i(gl.getUniformLocation(program, 'u_enable_vignette'), isEffectEnabled('vignette') ? 1 : 0);
  gl.uniform1i(gl.getUniformLocation(program, 'u_enable_chromatic'), isEffectEnabled('chromatic') ? 1 : 0);
  gl.uniform1i(gl.getUniformLocation(program, 'u_enable_glow'), isEffectEnabled('glow') ? 1 : 0);
  gl.uniform1i(gl.getUniformLocation(program, 'u_enable_noise'), isEffectEnabled('noise') ? 1 : 0);
}

function renderFrame(time: number): void {
  if (!gl || !program) return;
  const canvas = gl.canvas as HTMLCanvasElement;
  gl.viewport(0, 0, canvas.width, canvas.height);

  const currentState = getState();
  if (isYouTubeActive() && currentState === TVState.PLAYING) {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    animFrameId = requestAnimationFrame(renderFrame);
    return;
  }

  if (targetVideo && targetVideo.readyState >= 2 && !corsBlocked) {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, videoTexture);
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, targetVideo);
    } catch (err) {
      if (!corsBlocked) {
        logBoundaryError('shader', 'renderFrame', err, 'Cross-origin video blocked for WebGL texture; falling back to raw video element');
        corsBlocked = true;
        targetVideo.classList.add('cors-fallback');
      }
    }
    gl.uniform1i(gl.getUniformLocation(program, 'u_video_texture'), 0);
  }

  updateUniforms(time);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  animFrameId = requestAnimationFrame(renderFrame);
}

export async function initRenderer(canvas: HTMLCanvasElement, video: HTMLVideoElement): Promise<void> {
  logInfo('shader', 'initRenderer', 'Initializing WebGL2 CRT pipeline');
  gl = canvas.getContext('webgl2', { alpha: false, preserveDrawingBuffer: false });
  if (!gl) {
    logBoundaryError('shader', 'initRenderer', 'WebGL 2.0 context not supported');
    return;
  }
  targetVideo = video;
  try {
    program = await initShaderProgram();
    setupQuadGeometry(program);
    videoTexture = setupTexture();
    if (animFrameId) cancelAnimationFrame(animFrameId);
    animFrameId = requestAnimationFrame(renderFrame);
  } catch (err) {
    logBoundaryError('shader', 'initRenderer', err, 'Failed compiling CRT pipeline');
  }
}
