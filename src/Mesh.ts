import vertexShaderSource from "./shaders/vertex.glsl?raw";
import fragmentShaderSource from "./shaders/fragment.glsl?raw";
import { safeCreateBuffer, getAttribLocation, getUniformLocation, initShaders } from "./utils";
import { mat4, type mat4 as Mat4, type vec3 as Vec3, type vec4 as Vec4 } from "gl-matrix";
import type { Drawable } from "./Drawable";

export interface MeshGeometry {
  vertices: Float32Array;
  colors: Float32Array;
  indices: Uint16Array;
}

export interface MeshOptions {
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
  color?: Vec4;
}

export abstract class Mesh implements Drawable {
  readonly position: Vec3;
  readonly rotation: Vec3;
  readonly scale: Vec3;
  readonly color: Vec4 | undefined;
  private readonly gl: WebGL2RenderingContext;
  private readonly modelMatrix: Mat4 = mat4.create();
  private readonly vao: WebGLVertexArrayObject;
  private readonly positionBuffer: WebGLBuffer;
  private readonly colorBuffer: WebGLBuffer;
  private readonly indexBuffer: WebGLBuffer;
  private readonly shaderProgram: WebGLProgram;
  private readonly attribLocations: {
    position: number;
    color: number;
  };
  private readonly uniformLocations: {
    modelMatrix: WebGLUniformLocation;
    projectionViewMatrix: WebGLUniformLocation;
  };
  protected readonly indices: Uint16Array;

  constructor(gl: WebGL2RenderingContext, options: MeshOptions) {
    this.gl = gl;
    this.position = options.position;
    this.rotation = options.rotation;
    this.scale = options.scale;
    this.color = options.color;
    const geometry = this.getGeometry();
    this.indices = geometry.indices;
    this.shaderProgram = initShaders(this.gl, vertexShaderSource, fragmentShaderSource);
    this.attribLocations = {
      position: getAttribLocation(this.gl, this.shaderProgram, "vertexPosition"),
      color: getAttribLocation(this.gl, this.shaderProgram, "vertexColor"),
    };
    this.uniformLocations = {
      modelMatrix: getUniformLocation(this.gl, this.shaderProgram, "modelMatrix"),
      projectionViewMatrix: getUniformLocation(this.gl, this.shaderProgram, "projectionViewMatrix"),
    };
    const colors = this.color
      ? this.generateColorArray(this.color, geometry.vertices.length / 3)
      : geometry.colors;
    this.positionBuffer = safeCreateBuffer(this.gl, geometry.vertices);
    this.colorBuffer = safeCreateBuffer(this.gl, colors);
    this.indexBuffer = this.createIndexBuffer(geometry.indices);

    const vao = this.gl.createVertexArray();
    if (!vao) {
      throw new Error("Failed to create VAO");
    }
    this.vao = vao;

    this.setupVertexAttributeObject();
  }

  protected abstract getGeometry(): MeshGeometry;

  private generateColorArray(color: Vec4, vertexCount: number): Float32Array {
    const colors: number[] = [];
    for (let i = 0; i < vertexCount; i++) {
      colors.push(...color);
    }
    return new Float32Array(colors);
  }

  private createIndexBuffer(data: Uint16Array): WebGLBuffer {
    const buffer = this.gl.createBuffer();
    if (!buffer) {
      throw new Error("Failed to create index buffer");
    }

    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, data, this.gl.STATIC_DRAW);

    return buffer;
  }

  private setupVertexAttributeObject(): void {
    this.gl.bindVertexArray(this.vao);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.enableVertexAttribArray(this.attribLocations.position);
    this.gl.vertexAttribPointer(this.attribLocations.position, 3, this.gl.FLOAT, false, 0, 0);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
    this.gl.enableVertexAttribArray(this.attribLocations.color);
    this.gl.vertexAttribPointer(this.attribLocations.color, 4, this.gl.FLOAT, false, 0, 0);

    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    this.gl.bindVertexArray(null);
  }

  private updateModelMatrix(): void {
    mat4.identity(this.modelMatrix);
    mat4.translate(this.modelMatrix, this.modelMatrix, this.position);
    mat4.rotateX(this.modelMatrix, this.modelMatrix, this.rotation[0]);
    mat4.rotateY(this.modelMatrix, this.modelMatrix, this.rotation[1]);
    mat4.rotateZ(this.modelMatrix, this.modelMatrix, this.rotation[2]);
    mat4.scale(this.modelMatrix, this.modelMatrix, this.scale);
  }

  public draw(projectionViewMatrix: Mat4): void {
    this.updateModelMatrix();

    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    this.gl.useProgram(this.shaderProgram);
    this.gl.bindVertexArray(this.vao);
    this.gl.uniformMatrix4fv(this.uniformLocations.modelMatrix, false, this.modelMatrix);
    this.gl.uniformMatrix4fv(
      this.uniformLocations.projectionViewMatrix,
      false,
      projectionViewMatrix
    );
    this.gl.drawElements(this.gl.TRIANGLES, this.indices.length, this.gl.UNSIGNED_SHORT, 0);
    this.gl.bindVertexArray(null);
  }

  public dispose(): void {
    this.gl.deleteVertexArray(this.vao);
    this.gl.deleteBuffer(this.positionBuffer);
    this.gl.deleteBuffer(this.colorBuffer);
    this.gl.deleteBuffer(this.indexBuffer);
    this.gl.deleteProgram(this.shaderProgram);
  }
}
