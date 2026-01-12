export const state = {
  units: 'imperial', // 'imperial' (inches) or 'metric' (cm)
  robot: {
    width: 26, // inches
    depth: 26, // inches
    ballDiameter: 6, // inches
    speed: 20, // inches per second
    rotationSpeed: 2.5, // radians per second
  },
  turret: {
    yaw: 0, // degrees
    pitch: 0,
    offsetX: 0, // inches
    offsetY: 0, // inches
    offsetZ: 0, // inches
    rotationSpeed: 2.0 // radians per second
  },
  debug: false
}
