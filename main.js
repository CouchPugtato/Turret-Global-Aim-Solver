import { createScene } from './scene.js'
import { Robot } from './robot.js'
import { Field } from './field.js'
import { ProjectileManager } from './projectile.js'
import { state } from './state.js'
import { setupUI } from './ui.js'
import * as THREE from 'three'

const app = document.getElementById('app')
const { scene, camera, renderer, controls } = createScene(app)

const robot = new Robot(scene)
const field = new Field(scene)
const projectileManager = new ProjectileManager(scene, field)

setupUI(state, robot)

const clock = new THREE.Clock()
function toDisplayUnits(valInInches) {
  switch (state.units) {
    case 'feet': return valInInches / 12
    case 'metric': return valInInches * 2.54
    case 'meters': return valInInches * 0.0254
    case 'imperial':
    default: return valInInches
  }
}
function unitLabel() {
  switch (state.units) {
    case 'feet': return 'ft'
    case 'metric': return 'cm'
    case 'meters': return 'm'
    case 'imperial':
    default: return 'in'
  }
}

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        const muzzleState = robot.getMuzzleState()
        if (muzzleState) {
            projectileManager.spawn(
                muzzleState.position, 
                muzzleState.velocity, 
                state.fuel.ballDiameter
            )
        }
    }
})

function animate() {
  requestAnimationFrame(animate)
  
  const dt = clock.getDelta()
  robot.update(dt)
  robot.solveAim(field.getTargetPosition())
  projectileManager.update(dt)
  
  const muzzleState = robot.getMuzzleState()
  if (muzzleState && field.hubMesh) {
    let funnel = null
    for (const child of field.hubMesh.children) {
      if (child.geometry && child.geometry.parameters && typeof child.geometry.parameters.height === 'number') {
        funnel = child
        break
      }
    }
    if (funnel) {
      const center = new THREE.Vector3()
      funnel.getWorldPosition(center)
      const radius = funnel.geometry.parameters.radiusTop || funnel.geometry.parameters.radius || funnel.geometry.parameters.radiusBottom || 0
      const height = funnel.geometry.parameters.height || 0
      const horiz = Math.hypot(muzzleState.position.x - center.x, muzzleState.position.y - center.y)
      const dzOut = Math.max(0, Math.abs(muzzleState.position.z - center.z) - height / 2)
      const radial = Math.max(0, horiz - radius)
      const dSurface = Math.hypot(radial, dzOut)
      const dCenter = muzzleState.position.distanceTo(center)
      const dMin = Math.min(dSurface, dCenter)
      state.status.distance = dMin
      const dDisp = toDisplayUnits(dMin)
      state.status.distanceText = `${dDisp.toFixed(2)} ${unitLabel()}`
    }
  } else {
    state.status.distanceText = '--'
    state.status.distance = 0
  }
  
  controls.update()
  renderer.render(scene, camera)
}

animate()
