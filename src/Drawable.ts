import type { vec3 as Vec3, mat4 as Mat4 } from "gl-matrix";

export interface Drawable {
  readonly position: Vec3;

  draw(): void;
}
