import type { vec3 as Vec3 } from "gl-matrix";
import { Mesh, type MeshGeometry } from "./Mesh";

// prettier-ignore
const CUBE_VERTICES = new Float32Array([
  // Front face
  -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0,
  // Back face
  -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0,
  // Top face
  -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0,
  // Bottom face
  -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0,
  // Right face
  1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0,
  // Left face
  -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0,
]);

// prettier-ignore
const faceColors = [
  [1.0, 1.0, 1.0, 1.0], // Front face: white
  [1.0, 0.0, 0.0, 1.0], // Back face: red
  [0.0, 1.0, 0.0, 1.0], // Top face: green
  [0.0, 0.0, 1.0, 1.0], // Bottom face: blue
  [1.0, 1.0, 0.0, 1.0], // Right face: yellow
  [1.0, 0.0, 1.0, 1.0], // Left face: purple
];

let colors: number[] = [];

for (const c of faceColors) {
  colors = colors.concat(c, c, c, c);
}

const CUBE_COLORS = new Float32Array(colors);

// prettier-ignore
const CUBE_TEXTURE_COORDS = new Float32Array([
  // Front face
  0.0, 0.0,  1.0, 0.0,  1.0, 1.0,  0.0, 1.0,
  // Back face
  1.0, 0.0,  1.0, 1.0,  0.0, 1.0,  0.0, 0.0,
  // Top face
  0.0, 1.0,  0.0, 0.0,  1.0, 0.0,  1.0, 1.0,
  // Bottom face
  1.0, 1.0,  0.0, 1.0,  0.0, 0.0,  1.0, 0.0,
  // Right face
  1.0, 0.0,  1.0, 1.0,  0.0, 1.0,  0.0, 0.0,
  // Left face
  0.0, 0.0,  1.0, 0.0,  1.0, 1.0,  0.0, 1.0,
]);

// prettier-ignore
const CUBE_INDICES = new Uint16Array([
    0,  1,  2,      0,  2,  3,    // front
    4,  5,  6,      4,  6,  7,    // back
    8,  9,  10,     8,  10, 11,   // top
    12, 13, 14,     12, 14, 15,   // bottom
    16, 17, 18,     16, 18, 19,   // right
    20, 21, 22,     20, 22, 23,   // left
]);

export class Cube extends Mesh {
  constructor(
    gl: WebGL2RenderingContext,
    {
      position,
      rotation,
      scale,
      texture,
    }: { position: Vec3; rotation: Vec3; scale: Vec3; texture?: WebGLTexture }
  ) {
    super(gl, {
      position,
      rotation,
      scale,
      texture,
    });
  }

  protected getGeometry(): MeshGeometry {
    return {
      vertices: CUBE_VERTICES,
      colors: CUBE_COLORS,
      textureCoords: CUBE_TEXTURE_COORDS,
      indices: CUBE_INDICES,
    };
  }
}
