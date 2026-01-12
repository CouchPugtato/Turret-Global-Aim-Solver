import { createScene } from './scene.js'
import { Robot } from './robot.js'
import { Field } from './field.js'
import { state } from './state.js'
import { setupUI } from './ui.js'
import * as THREE from 'three'

const app = document.getElementById('app')
const { scene, camera, renderer, controls } = createScene(app)

const robot = new Robot(scene)
const field = new Field(scene)

setupUI(state, robot)

const clock = new THREE.Clock()

function animate() {
  requestAnimationFrame(animate)
  
  const dt = clock.getDelta()
  robot.update(dt)
  
  controls.update()
  renderer.render(scene, camera)
}

animate()
