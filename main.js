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

function getAimTarget() {
  if (state.system.targetMode === 'manual') {
    return new THREE.Vector3(
      state.system.aimTargetX,
      state.system.aimTargetY,
      state.system.aimTargetZ
    )
  }

  return field.getTargetPosition()
}

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        const muzzleState = robot.getMuzzleState()
        if (muzzleState) {
            const mode = state.advancedPhysics ? (state.advancedPhysics.mode || 'none') : 'none'
            if (mode === 'drag') {
                projectileManager.spawn(
                    muzzleState.position,
                    muzzleState.velocity,
                    state.fuel.ballDiameter,
                    'none'
                )
                projectileManager.spawn(
                    muzzleState.position,
                    muzzleState.velocity,
                    state.fuel.ballDiameter,
                    'drag'
                )
            } else if (mode === 'drag_calc') {
                projectileManager.spawn(
                    muzzleState.position,
                    muzzleState.velocity,
                    state.fuel.ballDiameter,
                    'drag'
                )
            } else {
                projectileManager.spawn(
                    muzzleState.position, 
                    muzzleState.velocity, 
                    state.fuel.ballDiameter,
                    'none'
                )
            }
        }
    }
})

function animate() {
  requestAnimationFrame(animate)
  
  const dt = clock.getDelta()
  robot.update(dt)
  const aimTarget = getAimTarget()
  field.updateTargetMarker(aimTarget)
  robot.solveAim(aimTarget)
  projectileManager.update(dt)
  
  const muzzleState = robot.getMuzzleState()
  if (muzzleState) {
    const dMin = muzzleState.position.distanceTo(aimTarget)
    state.status.distance = dMin
    const dDisp = toDisplayUnits(dMin)
    state.status.distanceText = `${dDisp.toFixed(2)} ${unitLabel()}`
  } else {
    state.status.distanceText = '--'
    state.status.distance = 0
  }
  
  controls.update()
  renderer.render(scene, camera)
}

animate()
