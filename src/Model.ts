import { Mesh, type MeshGeometry } from "./Mesh";
import type { vec3 as Vec3 } from "gl-matrix";

export class Model extends Mesh {
  private constructor(
    gl: WebGL2RenderingContext,
    { position, rotation, scale }: { position: Vec3; rotation: Vec3; scale: Vec3 }
  ) {
    super(gl, {
      position,
      rotation,
      scale,
    });
  }

  protected getGeometry(): MeshGeometry {
    return {
      vertices: new Float32Array([]),
      colors: new Float32Array([]),
      indices: new Uint16Array([]),
    };
  }

  private static async loadModel(
    url: string
  ): Promise<{ vertices: Float32Array; colors: Float32Array; indices: Uint16Array }> {
    const response = await fetch(url);
    await response.text();
    // TODO: Parse OBJ file format
    return {
      vertices: new Float32Array([]),
      colors: new Float32Array([]),
      indices: new Uint16Array([]),
    };
  }
}
