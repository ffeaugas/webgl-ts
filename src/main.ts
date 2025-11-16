import "./style.css";
import { Cube } from "./Cube";
import { updateFPS } from "./utils";
import { mat4, type mat4 as Mat4 } from "gl-matrix";
import { Scene } from "./Scene";
import { Wall } from "./Wall";
import { updateViewMatrix, initMouseControls } from "./controls";

const canvas = document.querySelector<HTMLCanvasElement>("#webgl-container")!;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const gl = canvas.getContext("webgl2")!;

if (!gl) {
  throw new Error("WebGL2 n'est pas supporté par votre navigateur");
}

const cube1 = new Cube(gl, {
  position: [0.5, 0, 0],
  rotation: [0, Math.PI / 2, 0],
  scale: [0.2, 0.2, 0.2],
});
const cube2 = new Cube(gl, {
  position: [0, 0, -2],
  rotation: [0, -0.2, 0],
  scale: [0.2, 0.2, 0.2],
});
const cube3 = new Cube(gl, {
  position: [0.2, 0, -3],
  rotation: [0, 0.3, 0],
  scale: [0.2, 0.2, 0.2],
});
const cube4 = new Cube(gl, {
  position: [-0.7, 0.3, -1],
  rotation: [0, 2, 0],
  scale: [0.2, 0.2, 0.2],
});
const floor = new Wall(gl, {
  position: [0, -0.5, -3],
  rotation: [-Math.PI / 2, 0, 0],
  scale: [10, 10, 10],
  color: [0.2, 0.2, 0.2, 1.0],
});
const leftWall = new Wall(gl, {
  position: [-3, 0, -3],
  rotation: [0, Math.PI / 2, 0],
  scale: [10, 10, 10],
  color: [0.5, 0.5, 0.5, 1.0],
});
const rightWall = new Wall(gl, {
  position: [3, 0, -3],
  rotation: [0, -Math.PI / 2, 0],
  scale: [10, 10, 10],
  color: [0.5, 0.5, 0.5, 1.0],
});
const backWall = new Wall(gl, {
  position: [0, 0, -10],
  rotation: [0, 0, 0],
  scale: [10, 10, 10],
  color: [0.3, 0.3, 0.3, 1.0],
});

const scene = new Scene(gl, [cube1, cube2, cube3, cube4, floor, leftWall, rightWall, backWall]);

const viewMatrix: Mat4 = mat4.create();
const projectionMatrix: Mat4 = mat4.create();
const projectionViewMatrix: Mat4 = mat4.create();

mat4.lookAt(
  viewMatrix,
  /* eye position     */ [0, 0, 2],
  /* look at position */ [0, 0, 0],
  /* up vector        */ [0, 1, 0]
);
mat4.perspective(
  projectionMatrix,
  /* field of view    */ Math.PI / 4,
  /* aspect ratio     */ window.innerWidth / window.innerHeight,
  /* near plane       */ 0.1,
  /* far plane        */ 1000
);

initMouseControls(canvas);

function animate() {
  requestAnimationFrame(animate);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.clear(gl.DEPTH_BUFFER_BIT);

  updateViewMatrix(viewMatrix);

  mat4.multiply(projectionViewMatrix, projectionMatrix, viewMatrix);
  scene.render(projectionViewMatrix);

  updateFPS();
}

animate();
