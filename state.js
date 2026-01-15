export const state = {
  units: 'imperial',
  robot: {
    width: 26,
    depth: 26,
    speed: 120,
    rotationSpeed: 2.5,
  },
  turret: {
    yaw: 0,
    pitch: 0,
    offsetX: 0,
    offsetY: 0,
    offsetZ: 0,
    rotationSpeed: 2.0,
    autoAimMode: 'pitch' // 'pitch' or 'velocity'
  },
  fuel: {
    exitVelocity: 400,
    ballDiameter: 5.91,
    shootingError: 0
  },
  advancedPhysics: {
    mode: 'none', // 'none', 'drag', 'drag_calc'
    dragCoefficient: 0.47,
    airDensity: 1.2,
    referenceArea: 27.36,
    mass: 800
  },
  status: {
    distanceText: '--',
    distance: 0
  },
  debug: false
}
