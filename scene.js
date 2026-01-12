import * as THREE from 'three'
import { OrbitControls } from 'https://unpkg.com/three@0.158.0/examples/jsm/controls/OrbitControls.js'

export function createScene(root) {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#0e0e10')
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000)
  camera.up.set(0, 0, 1)
  camera.position.set(80, -60, 60)
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))
  root.appendChild(renderer.domElement)
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  const ambient = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambient)
  const dir = new THREE.DirectionalLight(0xffffff, 0.8)
  dir.position.set(60, 40, 100)
  scene.add(dir)
  const grid = new THREE.GridHelper(240, 240, 0x666666, 0x222222)
  grid.rotateX(Math.PI / 2)
  scene.add(grid)
  return { scene, camera, renderer, controls, THREE }
}
