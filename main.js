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
  
  controls.update()
  renderer.render(scene, camera)
}

animate()
