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
const FIRE_INTERVAL = 0.12
let isShooting = false
let shootCooldown = 0

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

function fireShot() {
  const muzzleState = robot.getMuzzleState()
  if (!muzzleState) return

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

window.addEventListener('keydown', (e) => {
  if (e.code !== 'Space') return
  e.preventDefault()
  if (!isShooting) {
    isShooting = true
    shootCooldown = FIRE_INTERVAL
    fireShot()
  }
})

window.addEventListener('keyup', (e) => {
  if (e.code !== 'Space') return
  e.preventDefault()
  isShooting = false
  shootCooldown = 0
})

window.addEventListener('blur', () => {
  isShooting = false
  shootCooldown = 0
})

function animate() {
  requestAnimationFrame(animate)
  
  const dt = clock.getDelta()
  if (isShooting) {
    shootCooldown -= dt
    while (shootCooldown <= 0) {
      fireShot()
      shootCooldown += FIRE_INTERVAL
    }
  }
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
