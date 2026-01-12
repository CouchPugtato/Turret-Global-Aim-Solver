import * as THREE from 'three'
import { STLLoader } from 'three/addons/loaders/STLLoader.js'
import { state } from './state.js'

export class Robot {
  constructor(scene) {
    this.scene = scene
    this.mesh = null
    this.ballMesh = null
    this.turretMesh = null // This is the Yaw group
    this.turretPitchMesh = null // This is the Pitch group
    this.chassisHeight = 0
    this.velocity = new THREE.Vector3()
    this.keys = {
      w: false, a: false, s: false, d: false,
      ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false,
      q: false, e: false
    }
    
    // Expose THREE for UI access if needed
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
        // 1. Initial Geometry Processing
        geometry.computeBoundingBox()
        const center = geometry.boundingBox.getCenter(new THREE.Vector3())
        geometry.translate(-center.x, -center.y, -center.z)
        
        // 2. Initial Rotation
        geometry.rotateX(-Math.PI / 2) // Original fix
        geometry.rotateX(Math.PI)      // Flip 180 pitch

        // 3. Scaling
        geometry.computeBoundingBox()
        const size = new THREE.Vector3()
        geometry.boundingBox.getSize(size)
        
        // Scale to match state.robot.width (X) and state.robot.depth (Z)
        const scaleX = state.robot.width / size.x
        const scaleZ = state.robot.depth / size.z
        
        const scaleY = (scaleX + scaleZ) / 2
        
        // Save scales for turret
        this.savedScale = { x: scaleX, y: scaleY, z: scaleZ }

        console.log(`Original Size: ${size.x.toFixed(2)} x ${size.z.toFixed(2)}. Scales: X=${scaleX.toFixed(4)}, Z=${scaleZ.toFixed(4)}`)
        
        geometry.scale(scaleX, scaleY, scaleZ)
        
        // Update bounding box after scaling
        geometry.computeBoundingBox()
        this.chassisHeight = geometry.boundingBox.max.y - geometry.boundingBox.min.y

        // Create Mesh
        const material = new THREE.MeshStandardMaterial({ 
          color: 0x00ff00, 
          roughness: 0.5, 
          metalness: 0.5 
        })
        this.mesh = new THREE.Mesh(geometry, material)
        
        // Position slightly above ground
        this.mesh.position.y = this.chassisHeight / 2
        this.mesh.castShadow = true
        this.mesh.receiveShadow = true
        
        this.scene.add(this.mesh)
        
        // Load Turret (Procedural)
        this.createTurret()
      },
      undefined,
      (error) => console.error('Error loading robot:', error)
    )
  }

  createTurret() {
    if (!this.mesh) return

    // Clean up existing turret if any
    if (this.turretMesh) {
        this.mesh.remove(this.turretMesh)
        this.turretMesh.traverse((child) => {
            if (child.isMesh) {
                child.geometry.dispose()
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.dispose())
                } else {
                    child.material.dispose()
                }
            }
        })
        this.turretMesh = null
        this.turretPitchMesh = null
    }

    if (this.turretBaseMesh) {
        this.mesh.remove(this.turretBaseMesh)
        this.turretBaseMesh.geometry.dispose()
        this.turretBaseMesh.material.dispose()
        this.turretBaseMesh = null
    }

    const radius = state.robot.ballDiameter / 2
    
    // Turret Group (This will rotate YAW)
    this.turretMesh = new THREE.Group()

    // 1. Flat Base Cylinder (Static relative to chassis)
    const baseHeight = 0.5
    const baseGeo = new THREE.CylinderGeometry(radius, radius, baseHeight, 32)
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5, metalness: 0.8 })
    const baseMesh = new THREE.Mesh(baseGeo, baseMat)
    
    // Position base on top of chassis
    // Base center y = chassis/2 + baseHeight/2
    baseMesh.position.y = (this.chassisHeight / 2) + (baseHeight / 2)
    this.mesh.add(baseMesh)
    this.turretBaseMesh = baseMesh

    // 2. Rotating Cylinder (Yaw Body)
    const turretHeight = 2
    const turretGeo = new THREE.CylinderGeometry(radius, radius, turretHeight, 32)
    const turretMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.4, metalness: 0.6 })
    const turretBody = new THREE.Mesh(turretGeo, turretMat)
    
    // Position yaw body inside the yaw group
    // Inside the group, the body should sit at y=0 (bottom) -> y=height/2 (center)
    turretBody.position.y = turretHeight / 2
    this.turretMesh.add(turretBody)
    
    // 3. Pitch Group (Sits on top of Yaw Body)
    this.turretPitchMesh = new THREE.Group()
    this.turretPitchMesh.position.y = turretHeight // Top of the yaw cylinder
    
    // Add a visual for the pitch part (e.g., a horizontal pivot or just the ball holder)
    // Replaced box with cylinder as requested
    const pitchMountHeight = 0.5
    // Cylinder: radius top, radius bottom, height, segments
    const pitchMountGeo = new THREE.CylinderGeometry(radius, radius, pitchMountHeight, 32)
    const pitchMountMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.4, metalness: 0.7 })
    const pitchMountMesh = new THREE.Mesh(pitchMountGeo, pitchMountMat)
    
    // Position it so its bottom is at 0 (pivot point)
    pitchMountMesh.position.y = pitchMountHeight / 2
    
    this.turretPitchMesh.add(pitchMountMesh)
    
    // Add pitch group to yaw group
    this.turretMesh.add(this.turretPitchMesh)

    // Position the whole yaw group at the top of the base
    this.turretMesh.position.y = (this.chassisHeight / 2) + baseHeight
    
    this.mesh.add(this.turretMesh)

    // Create Ball (Attached to Pitch Group)
    this.createBall(pitchMountHeight)
  }

  createBall(mountHeight) {
    if (!this.mesh) return

    // Clean up existing ball
    if (this.ballMesh) {
        // Check parent and remove
        if (this.ballMesh.parent) {
            this.ballMesh.parent.remove(this.ballMesh)
        }
        this.ballMesh.geometry.dispose()
        this.ballMesh = null
    }

    const radius = state.robot.ballDiameter / 2
    const geometry = new THREE.SphereGeometry(radius, 32, 32)
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xffff00, // Yellow
      roughness: 0.2, 
      metalness: 0.1 
    })
    this.ballMesh = new THREE.Mesh(geometry, material)
    
    // Position ball on top of the pitch mount
    // y = mountHeight + radius
    // Since it's child of pitchMesh, 0 is the pivot point (top of yaw cylinder)
    this.ballMesh.position.y = mountHeight + radius
    
    if (this.turretPitchMesh) {
        this.turretPitchMesh.add(this.ballMesh)
    } else {
        // Fallback if no turret structure (shouldn't happen with current flow)
        this.ballMesh.position.y = (this.chassisHeight / 2) + 2 + radius 
        this.mesh.add(this.ballMesh)
    }
  }

  resetPosition() {
    if (this.mesh) {
      this.mesh.position.set(0, this.mesh.position.y, 0)
      this.mesh.rotation.set(0, 0, 0)
    }
  }

  update(dt) {
    if (!this.mesh) return

    // Update Turret Rotation
    if (this.turretMesh) {
       this.turretMesh.rotation.y = THREE.MathUtils.degToRad(state.turret.yaw)
       if (this.turretPitchMesh) {
           this.turretPitchMesh.rotation.x = THREE.MathUtils.degToRad(state.turret.pitch)
       }
    }

    // Swerve / Holonomic Drive Logic (Field Centric)
    const forwardInput = (this.keys.w ? 1 : 0) - (this.keys.s ? 1 : 0)
    const strafeInput = (this.keys.d ? 1 : 0) - (this.keys.a ? 1 : 0)
    
    // Rotation (Q/E or Arrows)
    const rotateInput = (this.keys.ArrowLeft || this.keys.q ? 1 : 0) - (this.keys.ArrowRight || this.keys.e ? 1 : 0)

    // Apply Rotation
    if (rotateInput !== 0) {
      this.mesh.rotation.y += rotateInput * state.robot.rotationSpeed * dt
    }

    // Apply Movement (Field-Centric)
    if (forwardInput !== 0 || strafeInput !== 0) {
      const moveVec = new THREE.Vector3(strafeInput, 0, -forwardInput) // X, Y, Z
      
      if (moveVec.lengthSq() > 0) {
        moveVec.normalize()
        this.mesh.position.addScaledVector(moveVec, state.robot.speed * dt)
      }
    }
  }
}
