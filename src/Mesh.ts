import vertexShaderSource from "./shaders/vertex.glsl?raw";
import fragmentShaderSource from "./shaders/fragment.glsl?raw";
import {
  safeCreateBuffer,
  getAttribLocation,
  getUniformLocation,
  initShaders,
  generateColorArray,
} from "./utils";
import {
  mat4,
  mat3,
  type mat4 as Mat4,
  type mat3 as Mat3,
  type vec3 as Vec3,
  type vec4 as Vec4,
} from "gl-matrix";
import type { Drawable } from "./Drawable";

export interface MeshGeometry {
  vertices: Float32Array;
  colors: Float32Array;
  textureCoords?: Float32Array;
  indices: Uint16Array;
  normals: Float32Array;
}

export interface MeshOptions {
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
  color?: Vec4;
  texture?: WebGLTexture;
}

export abstract class Mesh implements Drawable {
  readonly position: Vec3;
  readonly rotation: Vec3;
  readonly scale: Vec3;
  readonly color: Vec4 | undefined;
  readonly texture: WebGLTexture | undefined;
  private readonly gl: WebGL2RenderingContext;
  private readonly modelMatrix: Mat4 = mat4.create();
  private readonly normalMatrix: Mat3 = mat3.create();
  private readonly vao: WebGLVertexArrayObject;
  private readonly shaderProgram: WebGLProgram;
  private readonly buffers: Record<string, WebGLBuffer>;
  private readonly attribLocations: {
    position: number;
    color: number;
    texture: number;
    normals: number;
  };
  private readonly uniformLocations: Record<string, WebGLUniformLocation>;
  protected readonly indices: Uint16Array;

  constructor(gl: WebGL2RenderingContext, options: MeshOptions) {
    this.gl = gl;
    this.position = options.position;
    this.rotation = options.rotation;
    this.scale = options.scale;
    this.color = options.color;
    this.texture = options.texture;
    const geometry = this.getGeometry();
    this.indices = geometry.indices;
    this.shaderProgram = initShaders(this.gl, vertexShaderSource, fragmentShaderSource);
    this.attribLocations = {
      position: getAttribLocation(this.gl, this.shaderProgram, "vertexPosition"),
      color: getAttribLocation(this.gl, this.shaderProgram, "vertexColor"),
      texture: getAttribLocation(this.gl, this.shaderProgram, "vertexTexture"),
      normals: getAttribLocation(this.gl, this.shaderProgram, "vertexNormal"),
    };
    this.uniformLocations = {
      modelMatrix: getUniformLocation(this.gl, this.shaderProgram, "modelMatrix"),
      projectionViewMatrix: getUniformLocation(this.gl, this.shaderProgram, "projectionViewMatrix"),
      textureSampler: getUniformLocation(this.gl, this.shaderProgram, "textureSampler"),
      useTexture: getUniformLocation(this.gl, this.shaderProgram, "useTexture"),
      lightDirection: getUniformLocation(this.gl, this.shaderProgram, "lightDirection"),
      normalMatrix: getUniformLocation(this.gl, this.shaderProgram, "normalMatrix"),
    };
    const colors = this.color
      ? generateColorArray(this.color, geometry.vertices.length / 3)
      : geometry.colors;

    const textureCoords =
      geometry.textureCoords || new Float32Array((geometry.vertices.length / 3) * 2);

    const buffers: Record<string, WebGLBuffer> = {
      position: safeCreateBuffer({ gl: this.gl, data: geometry.vertices }),
      color: safeCreateBuffer({ gl: this.gl, data: colors }),
      index: safeCreateBuffer({ gl: this.gl, data: geometry.indices, isIndexBuffer: true }),
      texture: safeCreateBuffer({ gl: this.gl, data: textureCoords }),
      normals: safeCreateBuffer({ gl: this.gl, data: geometry.normals }),
    };

    this.buffers = buffers;
    this.vao = this.gl.createVertexArray()!;

    this.setupVertexAttributeObject();
  }

  private setupVertexAttributeObject(): void {
    this.gl.bindVertexArray(this.vao);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.position);
    this.gl.enableVertexAttribArray(this.attribLocations.position);
    this.gl.vertexAttribPointer(this.attribLocations.position, 3, this.gl.FLOAT, false, 0, 0);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.color);
    this.gl.enableVertexAttribArray(this.attribLocations.color);
    this.gl.vertexAttribPointer(this.attribLocations.color, 4, this.gl.FLOAT, false, 0, 0);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.texture);
    this.gl.enableVertexAttribArray(this.attribLocations.texture);
    this.gl.vertexAttribPointer(this.attribLocations.texture, 2, this.gl.FLOAT, false, 0, 0);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.normals);
    this.gl.enableVertexAttribArray(this.attribLocations.normals);
    this.gl.vertexAttribPointer(this.attribLocations.normals, 3, this.gl.FLOAT, false, 0, 0);

    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.buffers.index);
    this.gl.bindVertexArray(null);
  }

  private updateModelMatrix(): void {
    mat4.identity(this.modelMatrix);
    mat4.translate(this.modelMatrix, this.modelMatrix, this.position);
    mat4.rotateX(this.modelMatrix, this.modelMatrix, this.rotation[0]);
    mat4.rotateY(this.modelMatrix, this.modelMatrix, this.rotation[1]);
    mat4.rotateZ(this.modelMatrix, this.modelMatrix, this.rotation[2]);
    mat4.scale(this.modelMatrix, this.modelMatrix, this.scale);

    mat3.fromMat4(this.normalMatrix, this.modelMatrix);
    mat3.invert(this.normalMatrix, this.normalMatrix);
    mat3.transpose(this.normalMatrix, this.normalMatrix);
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
    this.gl.uniformMatrix3fv(this.uniformLocations.normalMatrix, false, this.normalMatrix);

    this.gl.uniform3fv(this.uniformLocations.lightDirection, [1, 2, 0]);

    if (this.texture) {
      this.gl.activeTexture(this.gl.TEXTURE0);
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
      this.gl.uniform1i(this.uniformLocations.textureSampler, 0);
      this.gl.uniform1i(this.uniformLocations.useTexture, 1);
    } else {
      this.gl.uniform1i(this.uniformLocations.useTexture, 0);
    }

    this.gl.drawElements(this.gl.TRIANGLES, this.indices.length, this.gl.UNSIGNED_SHORT, 0);
    this.gl.bindVertexArray(null);
  }

  public dispose(): void {
    this.gl.deleteVertexArray(this.vao);
    this.gl.deleteBuffer(this.buffers.position);
    this.gl.deleteBuffer(this.buffers.color);
    this.gl.deleteBuffer(this.buffers.index);
    this.gl.deleteBuffer(this.buffers.texture);
    this.gl.deleteProgram(this.shaderProgram);
  }

  protected abstract getGeometry(): MeshGeometry;
  public abstract animate(): void;
}
