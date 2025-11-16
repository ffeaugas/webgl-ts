import vertexShaderSource from "./shaders/vertex.glsl?raw";
import fragmentShaderSource from "./shaders/fragment.glsl?raw";
import { safeCreateBuffer, createShader, getAttribLocation, getUniformLocation } from "./utils";
import { mat4, type mat4 as Mat4, type vec3 as Vec3, type vec4 as Vec4 } from "gl-matrix";
import type { Drawable } from "./Drawable";

// prettier-ignore
const WALL_VERTICES = new Float32Array([
  -1.0, -1.0, 0.0, //
  1.0, -1.0, 0.0, //
  1.0, 1.0, 0.0,  //
  -1.0, 1.0, 0.0,
]);

// prettier-ignore
const faceColors = [
  [0.0, 1.0, 0.0, 1.0], // Front face: white
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

export class Wall implements Drawable {
  readonly position: Vec3;
  readonly rotation: Vec3;
  readonly scale: Vec3;
  readonly color: Vec4 | undefined;
  private readonly gl: WebGL2RenderingContext;
  private readonly modelMatrix: Mat4 = mat4.create();

  // WebGL2 resources
  private readonly vao: WebGLVertexArrayObject;
  private readonly positionBuffer: WebGLBuffer;
  private readonly colorBuffer: WebGLBuffer;
  private readonly indexBuffer: WebGLBuffer;
  private readonly shaderProgram: WebGLProgram;

  // Shader locations
  private readonly attribLocations: {
    position: number;
    color: number;
  };
  private readonly uniformLocations: {
    modelMatrix: WebGLUniformLocation;
    projectionViewMatrix: WebGLUniformLocation;
  };

  constructor(
    gl: WebGL2RenderingContext,
    {
      position,
      rotation,
      scale,
      color,
    }: { position: Vec3; rotation: Vec3; scale: Vec3; color?: Vec4 }
  ) {
    this.gl = gl;
    this.position = position;
    this.rotation = rotation;
    this.scale = scale;
    this.color = color;
    this.shaderProgram = this.initShaders();

    this.attribLocations = {
      position: getAttribLocation(this.gl, this.shaderProgram, "vertexPosition"),
      color: getAttribLocation(this.gl, this.shaderProgram, "vertexColor"),
    };

    this.uniformLocations = {
      modelMatrix: getUniformLocation(this.gl, this.shaderProgram, "modelMatrix"),
      projectionViewMatrix: getUniformLocation(this.gl, this.shaderProgram, "projectionViewMatrix"),
    };

    this.positionBuffer = safeCreateBuffer(this.gl, WALL_VERTICES);
    this.colorBuffer = safeCreateBuffer(
      this.gl,
      this.color
        ? new Float32Array([...this.color, ...this.color, ...this.color, ...this.color])
        : WALL_COLORS
    );
    this.indexBuffer = this.createIndexBuffer(WALL_INDICES);

    const vao = this.gl.createVertexArray();
    if (!vao) {
      throw new Error("Failed to create VAO");
    }
    this.vao = vao;

    this.setupVertexAttributeObject();
  }

  private initShaders(): WebGLProgram {
    const vertexShader = createShader(this.gl, this.gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(this.gl, this.gl.FRAGMENT_SHADER, fragmentShaderSource);

    const program = this.gl.createProgram();
    if (!program) {
      throw new Error("Failed to create shader program");
    }

    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      const info = this.gl.getProgramInfoLog(program);
      this.gl.deleteProgram(program);
      throw new Error(`Shader linking failed: ${info}`);
    }

    this.gl.deleteShader(vertexShader);
    this.gl.deleteShader(fragmentShader);

    return program;
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
    // Disable face culling so quads are visible from both sides
    this.gl.disable(this.gl.CULL_FACE);
    this.gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    this.gl.useProgram(this.shaderProgram);
    this.gl.bindVertexArray(this.vao);
    this.gl.uniformMatrix4fv(this.uniformLocations.modelMatrix, false, this.modelMatrix);
    this.gl.uniformMatrix4fv(
      this.uniformLocations.projectionViewMatrix,
      false,
      projectionViewMatrix
    );
    this.gl.drawElements(this.gl.TRIANGLES, WALL_INDICES.length, this.gl.UNSIGNED_SHORT, 0);
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
