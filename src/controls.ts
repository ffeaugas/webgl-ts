import { mat4, vec3, type mat4 as Mat4 } from "gl-matrix";

let keyPressed: { [key: string]: boolean } = {
  W: false,
  A: false,
  S: false,
  D: false,
};

const MOVEMENT_VELOCITY = 0.03;

let cameraPosition = vec3.fromValues(0, 0, 2);
let cameraTarget = vec3.fromValues(0, 0, 0);
let cameraUp = vec3.fromValues(0, 1, 0);

let yaw = Math.PI;
let pitch = 0;

document.addEventListener("keydown", (event) => {
  switch (event.key) {
    case "W":
    case "w":
      keyPressed.W = true;
      break;
    case "A":
    case "a":
      keyPressed.A = true;
      break;
    case "S":
    case "s":
      keyPressed.S = true;
      break;
    case "D":
    case "d":
      keyPressed.D = true;
      break;
  }
});

document.addEventListener("keyup", (event) => {
  switch (event.key) {
    case "W":
    case "w":
      keyPressed.W = false;
      break;
    case "A":
    case "a":
      keyPressed.A = false;
      break;
    case "S":
    case "s":
      keyPressed.S = false;
      break;
    case "D":
    case "d":
      keyPressed.D = false;
      break;
  }
});

export function initMouseControls(canvas: HTMLCanvasElement): void {
  cameraTarget[0] = cameraPosition[0] + Math.sin(yaw) * Math.cos(pitch);
  cameraTarget[1] = cameraPosition[1] + Math.sin(pitch);
  cameraTarget[2] = cameraPosition[2] + Math.cos(yaw) * Math.cos(pitch);

  canvas.addEventListener("click", () => {
    canvas.requestPointerLock();
  });

  document.addEventListener("pointerlockchange", () => {
    if (document.pointerLockElement === canvas) {
      document.addEventListener("mousemove", handleMouseMove);
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
    }
  });

  document.addEventListener("pointerlockerror", () => {
    console.warn("Erreur lors du verrouillage du pointeur");
  });

  function handleMouseMove(e: MouseEvent) {
    if (e.movementX !== undefined && e.movementY !== undefined) {
      yaw -= e.movementX * 0.002;
      pitch -= e.movementY * 0.002;
      pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));

      cameraTarget[0] = cameraPosition[0] + Math.sin(yaw) * Math.cos(pitch);
      cameraTarget[1] = cameraPosition[1] + Math.sin(pitch);
      cameraTarget[2] = cameraPosition[2] + Math.cos(yaw) * Math.cos(pitch);
    }
  }
}

export function updateViewMatrix(viewMatrix: Mat4): void {
  const forward = vec3.create();
  vec3.subtract(forward, cameraTarget, cameraPosition);
  vec3.normalize(forward, forward);

  const lateral = vec3.create();
  vec3.cross(lateral, forward, cameraUp);
  vec3.normalize(lateral, lateral);

  const movement = vec3.create();

  if (keyPressed.W) {
    vec3.scaleAndAdd(movement, movement, forward, MOVEMENT_VELOCITY);
  }
  if (keyPressed.S) {
    vec3.scaleAndAdd(movement, movement, forward, -MOVEMENT_VELOCITY);
  }

  if (keyPressed.A) {
    vec3.scaleAndAdd(movement, movement, lateral, -MOVEMENT_VELOCITY);
  }
  if (keyPressed.D) {
    vec3.scaleAndAdd(movement, movement, lateral, MOVEMENT_VELOCITY);
  }

  vec3.add(cameraPosition, cameraPosition, movement);

  cameraTarget[0] = cameraPosition[0] + Math.sin(yaw) * Math.cos(pitch);
  cameraTarget[1] = cameraPosition[1] + Math.sin(pitch);
  cameraTarget[2] = cameraPosition[2] + Math.cos(yaw) * Math.cos(pitch);

  mat4.lookAt(viewMatrix, cameraPosition, cameraTarget, cameraUp);
}
