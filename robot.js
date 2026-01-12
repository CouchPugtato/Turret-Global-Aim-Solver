import * as THREE from 'three'
import { STLLoader } from 'three/addons/loaders/STLLoader.js'
import { state } from './state.js'

export class Robot {
  constructor(scene) {
    this.scene = scene
    this.mesh = null
    this.ballMesh = null
    this.chassisHeight = 0
    this.velocity = new THREE.Vector3()
    this.keys = {
      w: false, a: false, s: false, d: false,
      ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false,
      q: false, e: false
    }
        this.THREE = THREE
    
    this.initInput()
    this.loadModel()
  }

  initInput() {
    window.addEventListener('keydown', (e) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
      if (this.keys.hasOwnProperty(key)) {
        this.keys[key] = true
      }
    })

    window.addEventListener('keyup', (e) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
      if (this.keys.hasOwnProperty(key)) {
        this.keys[key] = false
      }
    })
  }

  loadModel() {
    const loader = new STLLoader()
    loader.load(
      './models/robot_base.stl',
      (geometry) => {
        geometry.computeBoundingBox()
        const center = geometry.boundingBox.getCenter(new THREE.Vector3())
        geometry.translate(-center.x, -center.y, -center.z)
        geometry.rotateX(-Math.PI / 2)
        geometry.rotateX(Math.PI)

        geometry.computeBoundingBox()
        const size = new THREE.Vector3()
        geometry.boundingBox.getSize(size)
        
        const scaleX = state.robot.width / size.x
        const scaleZ = state.robot.depth / size.z
        
        const scaleY = (scaleX + scaleZ) / 2
        
        console.log(`Original Size: ${size.x.toFixed(2)} x ${size.z.toFixed(2)}. Scales: X=${scaleX.toFixed(4)}, Z=${scaleZ.toFixed(4)}`)
        
        geometry.scale(scaleX, scaleY, scaleZ)
        
        geometry.computeBoundingBox()
        this.chassisHeight = geometry.boundingBox.max.y - geometry.boundingBox.min.y

        const material = new THREE.MeshStandardMaterial({ 
          color: 0x00ff00, 
          roughness: 0.5, 
          metalness: 0.5 
        })
        this.mesh = new THREE.Mesh(geometry, material)
        
        this.mesh.position.y = this.chassisHeight / 2
        this.mesh.castShadow = true
        this.mesh.receiveShadow = true
        
        this.scene.add(this.mesh)
        
        this.createBall()
      },
      undefined,
      (error) => console.error('Error loading robot:', error)
    )
  }

  createBall() {
    if (!this.mesh) return

    const radius = state.robot.ballDiameter / 2
    const geometry = new THREE.SphereGeometry(radius, 32, 32)
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xffff00, // Yellow
      roughness: 0.2, 
      metalness: 0.1 
    })
    this.ballMesh = new THREE.Mesh(geometry, material)
    
    this.ballMesh.position.y = (this.chassisHeight / 2) + radius
    
    this.mesh.add(this.ballMesh)
  }

  resetPosition() {
    if (this.mesh) {
      this.mesh.position.set(0, this.mesh.position.y, 0)
      this.mesh.rotation.set(0, 0, 0)
    }
  }

  update(dt) {
    if (!this.mesh) return
    
    const forwardInput = (this.keys.w ? 1 : 0) - (this.keys.s ? 1 : 0)
    const strafeInput = (this.keys.d ? 1 : 0) - (this.keys.a ? 1 : 0)
    
    const rotateInput = (this.keys.ArrowLeft || this.keys.q ? 1 : 0) - (this.keys.ArrowRight || this.keys.e ? 1 : 0)

    if (rotateInput !== 0) {
      this.mesh.rotation.y += rotateInput * state.robot.rotationSpeed * dt
    }
    if (forwardInput !== 0 || strafeInput !== 0) {
      const moveVec = new THREE.Vector3(strafeInput, 0, -forwardInput)
      if (moveVec.lengthSq() > 0) {
        moveVec.normalize()
        this.mesh.position.addScaledVector(moveVec, state.robot.speed * dt)
      }
    }
  }
}
