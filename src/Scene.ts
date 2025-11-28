import type { Drawable } from "./Drawable";
import type { mat4 as Mat4 } from "gl-matrix";
import { Mesh } from "./Mesh";

export class Scene {
  private readonly gl: WebGL2RenderingContext;
  private readonly objects: Drawable[];

  constructor(gl: WebGL2RenderingContext, objects: Drawable[]) {
    this.gl = gl;
    this.objects = objects;

    // this.gl.enable(gl.BLEND); // transparency blending
    // this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
  }

  public render(projectionViewMatrix: Mat4) {
    this.gl.clearColor(0, 0, 0, 1);

    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.gl.enable(this.gl.DEPTH_TEST);

    for (const object of this.objects) {
      if (object instanceof Mesh) {
        object.animate();
      }
      object.draw(projectionViewMatrix);
    }
  }
}
