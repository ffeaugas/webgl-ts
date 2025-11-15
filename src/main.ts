import "./style.css";
import { Cube } from "./Cube";
import { updateFPS } from "./utils";

const canvas = document.querySelector<HTMLCanvasElement>("#webgl-container")!;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const gl = canvas.getContext("webgl2")!;

if (!gl) {
  throw new Error("WebGL2 n'est pas supporté par votre navigateur");
}

const cube = new Cube(gl, [0.2, 0.2, 0]);
const cube2 = new Cube(gl, [0, 0, -3]);

function animate() {
  requestAnimationFrame(animate);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.clear(gl.DEPTH_BUFFER_BIT);
  cube.draw();
  cube2.draw();

  updateFPS();
}

animate();
