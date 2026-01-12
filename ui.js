import GUI from 'https://unpkg.com/lil-gui@0.18/dist/lil-gui.esm.js'

export function setupUI(state, robot) {
  if (window.__sim_gui) window.__sim_gui.destroy()
  const gui = new GUI({ title: 'Robot Settings' })
  window.__sim_gui = gui

  const factor = state.units === 'metric' ? 2.54 : 1
  const unitLabel = state.units === 'metric' ? 'cm' : 'in'
  
  const toDisplay = (val) => val * factor
  const fromDisplay = (val) => val / factor

  const unitsFolder = gui.addFolder('Units')
  unitsFolder.add(state, 'units', ['imperial', 'metric']).name('System').onChange(() => {
    setupUI(state, robot)
  })
  unitsFolder.open()

  const robotFolder = gui.addFolder(`Robot (${unitLabel})`)
  
  const dimsUI = {
    width: toDisplay(state.robot.width),
    depth: toDisplay(state.robot.depth),
    ballDiameter: toDisplay(state.robot.ballDiameter)
  }

  robotFolder.add(dimsUI, 'width', toDisplay(1), toDisplay(50), toDisplay(0.1)).name('Width').onFinishChange((v) => {
    state.robot.width = fromDisplay(v)
    reloadRobot()
  })

  robotFolder.add(dimsUI, 'depth', toDisplay(1), toDisplay(50), toDisplay(0.1)).name('Depth').onFinishChange((v) => {
    state.robot.depth = fromDisplay(v)
    reloadRobot()
  })

  robotFolder.add(dimsUI, 'ballDiameter', toDisplay(1), toDisplay(20), toDisplay(0.1)).name('Ball Diameter').onChange((v) => {
    state.robot.ballDiameter = fromDisplay(v)
    updateBall()
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

  function reloadRobot() {
    if (robot.mesh) {
      robot.scene.remove(robot.mesh)
      robot.loadModel()
    }
  }

  function updateBall() {
    if (robot.ballMesh) {
      const radius = state.robot.ballDiameter / 2
      robot.ballMesh.geometry.dispose()
      robot.ballMesh.geometry = new robot.THREE.SphereGeometry(radius, 32, 32)
      
      if (robot.chassisHeight) {
         robot.ballMesh.position.y = (robot.chassisHeight / 2) + radius
      }
    }
  }

  return gui
}
