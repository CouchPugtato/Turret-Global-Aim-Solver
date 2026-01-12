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

  const unitsFolder = gui.addFolder('Units')
  unitsFolder.add(state, 'units', {
    'Imperial (in)': 'imperial',
    'Imperial (ft)': 'feet',
    'Metric (cm)': 'metric',
    'Metric (m)': 'meters'
  }).name('System').onChange(() => {
    setupUI(state, robot)
  })
  unitsFolder.open()

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

  robotFolder.add(state.robot, 'rotationSpeed', 0.1, 10).name('Rotation Speed (rad/s)')
  robotFolder.add({ reset: () => robot.resetPosition() }, 'reset').name('Reset Position')
  
  robotFolder.open()

  const turretFolder = gui.addFolder('Turret')
  
  turretFolder.add(state.turret, 'yaw', -180, 180, 1).name('Yaw (deg)').listen()
  turretFolder.add(state.turret, 'pitch', -45, 90, 1).name('Pitch (deg)').listen()
  turretFolder.add(state.turret, 'autoAim').name('Auto Aim')

  const turretOffsetUI = {
    x: toDisplay(state.turret.offsetX),
    y: toDisplay(state.turret.offsetY),
    z: toDisplay(state.turret.offsetZ)
  }

  turretFolder.add(turretOffsetUI, 'x', toDisplay(-20), toDisplay(20), toDisplay(0.1)).name('Offset X (Fwd)').onChange(v => {
    state.turret.offsetX = fromDisplay(v)
    if (robot.updateTurretPosition) robot.updateTurretPosition()
  })
  turretFolder.add(turretOffsetUI, 'y', toDisplay(-10), toDisplay(10), toDisplay(0.1)).name('Offset Y (Side)').onChange(v => {
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
    exitVelocity: toDisplay(state.fuel.exitVelocity),
    ballDiameter: toDisplay(state.fuel.ballDiameter)
  }

  fuelFolder.add(fuelUI, 'exitVelocity', toDisplay(100), toDisplay(500)).name(`Exit Velocity (${unitLabel}/s)`).onChange(v => {
    state.fuel.exitVelocity = fromDisplay(v)
  })

  fuelFolder.add(fuelUI, 'ballDiameter', toDisplay(5), toDisplay(7)).name(`Ball Diameter (${unitLabel})`).onChange(v => {
    state.fuel.ballDiameter = fromDisplay(v)
    reloadRobot()
  })
  
  fuelFolder.add(state.fuel, 'shootingError', 0, 20).name('Shooting Error (%)')

  fuelFolder.open()


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
