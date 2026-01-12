export const state = {
  units: 'imperial',
  robot: {
    width: 26,
    depth: 26,
    speed: 20,
    rotationSpeed: 2.5,
  },
  turret: {
    yaw: 0,
    pitch: 0,
    offsetX: 0,
    offsetY: 0,
    offsetZ: 0,
    rotationSpeed: 2.0,
    autoAim: true
  },
  fuel: {
    exitVelocity: 400,
    ballDiameter: 6
  },
  debug: false
}
