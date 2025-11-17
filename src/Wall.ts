import type { vec3 as Vec3, vec4 as Vec4 } from "gl-matrix";
import { Mesh, type MeshGeometry } from "./Mesh";

// prettier-ignore
const WALL_VERTICES = new Float32Array([
  -1.0, -1.0, 0.0, //
  1.0, -1.0, 0.0, //
  1.0, 1.0, 0.0,  //
  -1.0, 1.0, 0.0,
]);

// prettier-ignore
const faceColors = [
  [0.0, 1.0, 0.0, 1.0], // Front face: green
];

let colors: number[] = [];

for (const c of faceColors) {
  colors = colors.concat(c, c, c, c);
}

const WALL_COLORS = new Float32Array(colors);

// prettier-ignore
const WALL_INDICES = new Uint16Array([
    0,  1,  2,      0,  2,  3,
]);

export class Wall extends Mesh {
  constructor(
    gl: WebGL2RenderingContext,
    {
      position,
      rotation,
      scale,
      color,
    }: { position: Vec3; rotation: Vec3; scale: Vec3; color?: Vec4 }
  ) {
    super(gl, {
      position,
      rotation,
      scale,
      color,
    });
  }

  protected getGeometry(): MeshGeometry {
    return {
      vertices: WALL_VERTICES,
      colors: WALL_COLORS,
      indices: WALL_INDICES,
    };
  }
}
