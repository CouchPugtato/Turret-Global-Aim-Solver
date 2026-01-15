import GUI from 'https://unpkg.com/lil-gui@0.18/dist/lil-gui.esm.js'

export function setupUI(state, robot) {
  if (window.__sim_gui) window.__sim_gui.destroy()
  const gui = new GUI({ title: 'Simulation Settings' })
  window.__sim_gui = gui

  let factor = 1
  let unitLabel = 'in'

  switch (state.units) {
    case 'metric': // cm
      factor = 2.54
      unitLabel = 'cm'
      break
    case 'meters': // m
      factor = 0.0254
      unitLabel = 'm'
      break
    case 'feet': // ft
      factor = 1 / 12
      unitLabel = 'ft'
      break
    case 'imperial': // inches
    default:
      factor = 1
      unitLabel = 'in'
      break
  }
  
  const toDisplay = (val) => val * factor
  const fromDisplay = (val) => val / factor

  const unitsFolder = gui.addFolder('System')
  unitsFolder.add(state, 'units', {
    'Imperial (in)': 'imperial',
    'Imperial (ft)': 'feet',
    'Metric (cm)': 'metric',
    'Metric (m)': 'meters'
  }).name('Units').onChange(() => {
    setupUI(state, robot)
  })
  unitsFolder.open()
  const telemetry = {}
  Object.defineProperty(telemetry, 'distance', {
    get() { return toDisplay(state.status.distance) }
  })
  unitsFolder.add(telemetry, 'distance', toDisplay(0), toDisplay(300)).name(`Distance (${unitLabel})`).listen()

  const robotFolder = gui.addFolder(`Robot (${unitLabel})`)
  
  const dimsUI = {
    width: toDisplay(state.robot.width),
    depth: toDisplay(state.robot.depth)
  }

  robotFolder.add(dimsUI, 'width', toDisplay(1), toDisplay(50), toDisplay(0.1)).name('Width').onFinishChange((v) => {
    state.robot.width = fromDisplay(v)
    reloadRobot()
  })

  robotFolder.add(dimsUI, 'depth', toDisplay(1), toDisplay(50), toDisplay(0.1)).name('Depth').onFinishChange((v) => {
    state.robot.depth = fromDisplay(v)
    reloadRobot()
  })

  const speedUI = {
    speed: toDisplay(state.robot.speed)
  }
  
  robotFolder.add(speedUI, 'speed', toDisplay(1), toDisplay(200)).name(`Max Speed (${unitLabel}/s)`).onChange(v => {
    state.robot.speed = fromDisplay(v)
  })
  robotFolder.add({ reset: () => robot.resetPosition() }, 'reset').name('Reset Position')
  
  robotFolder.open()

  const turretFolder = gui.addFolder('Turret')
  
  turretFolder.add(state.turret, 'yaw', -180, 180, 1).name('Yaw (deg)').listen()
  turretFolder.add(state.turret, 'pitch', -45, 90, 1).name('Pitch (deg)').listen()
  turretFolder.add(state.turret, 'autoAimMode', {
    'Pitch Control': 'pitch',
    'Exit Velocity Control': 'velocity',
    'Off': 'off'
  }).name('Auto Aim Mode')

  const turretOffsetUI = {
    x: toDisplay(state.turret.offsetX),
    y: toDisplay(state.turret.offsetY),
    z: toDisplay(state.turret.offsetZ)
  }

  turretFolder.add(turretOffsetUI, 'x', toDisplay(-20), toDisplay(20), toDisplay(0.1)).name('Offset X (Fwd)').onChange(v => {
    state.turret.offsetX = fromDisplay(v)
    if (robot.updateTurretPosition) robot.updateTurretPosition()
  })
  turretFolder.add(turretOffsetUI, 'y', toDisplay(-20), toDisplay(20), toDisplay(0.1)).name('Offset Y (Side)').onChange(v => {
    state.turret.offsetY = fromDisplay(v)
    if (robot.updateTurretPosition) robot.updateTurretPosition()
  })
  turretFolder.add(turretOffsetUI, 'z', toDisplay(-20), toDisplay(20), toDisplay(0.1)).name('Offset Z (Height)').onChange(v => {
    state.turret.offsetZ = fromDisplay(v)
    if (robot.updateTurretPosition) robot.updateTurretPosition()
  })
  
  turretFolder.open()

  const fuelFolder = gui.addFolder('Fuel')
  
  const fuelUI = {
    ballDiameter: toDisplay(state.fuel.ballDiameter)
  }
  const fuelProxy = {}
  Object.defineProperty(fuelProxy, 'exitVelocity', {
    get() { return toDisplay(state.fuel.exitVelocity) },
    set(v) { state.fuel.exitVelocity = fromDisplay(v) }
  })

  fuelFolder.add(fuelProxy, 'exitVelocity', toDisplay(100), toDisplay(500)).name(`Exit Velocity (${unitLabel}/s)`).listen()

  fuelFolder.add(fuelUI, 'ballDiameter', toDisplay(5), toDisplay(7)).name(`Ball Diameter (${unitLabel})`).onChange(v => {
    state.fuel.ballDiameter = fromDisplay(v)
    reloadRobot()
  })
  
  fuelFolder.add(state.fuel, 'shootingError', 0, 20).name('Shooting Error (%)')

  fuelFolder.open()

  const advancedFolder = gui.addFolder('Advanced Physics')

  advancedFolder.add(state.advancedPhysics, 'mode', {
    'None': 'none',
    'With Drag': 'drag',
    'Aim With Drag': 'drag_calc'
  }).name('Physics Mode')

  advancedFolder.add(state.advancedPhysics, 'dragCoefficient', 0, 2, 0.01).name('Drag Coefficient (dimensionless)')
  advancedFolder.add(state.advancedPhysics, 'airDensity', 0, 5, 0.01).name('Air Density (kg/m³)')
  advancedFolder.add(state.advancedPhysics, 'referenceArea', 0, toDisplay(100), toDisplay(0.1)).name(`Ref Area (${unitLabel}²)`)
  advancedFolder.add(state.advancedPhysics, 'mass', 100, 2000, 1).name('Ball Mass (g)')

  advancedFolder.open()


  function reloadRobot() {
    if (robot.mesh) {
      robot.scene.remove(robot.mesh)
      robot.loadModel()
    }
  }

  function updateBall() {
    if (robot.ballMesh) {
      const radius = state.fuel.ballDiameter / 2
      robot.ballMesh.geometry.dispose()
      robot.ballMesh.geometry = new robot.THREE.SphereGeometry(radius, 32, 32)
      
      if (robot.chassisHeight) {
         let zPos = (robot.chassisHeight / 2) + radius + 1
         if (robot.turretMesh) {
             zPos += 2
         }
         robot.ballMesh.position.z = zPos
      }
    }
  }

  return gui
}
