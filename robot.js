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
        // Removed -90 deg X rotation to keep Z-up (STL native)
        geometry.rotateX(Math.PI) // Keep flip if needed (assuming model is upside down or backwards)

        // 3. Scaling
        geometry.computeBoundingBox()
        const size = new THREE.Vector3()
        geometry.boundingBox.getSize(size)
        
        // Scale to match state.robot.width (X) and state.robot.depth (Y in Z-up)
        const scaleX = state.robot.width / size.x
        const scaleY = state.robot.depth / size.y // Depth is now Y
        
        const scaleZ = (scaleX + scaleY) / 2 // Height is Z
        
        // Save scales for turret
        this.savedScale = { x: scaleX, y: scaleY, z: scaleZ }

        console.log(`Original Size: ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}. Scales: X=${scaleX.toFixed(4)}, Y=${scaleY.toFixed(4)}`)
        
        geometry.scale(scaleX, scaleY, scaleZ)
        
        // Update bounding box after scaling
        geometry.computeBoundingBox()
        this.chassisHeight = geometry.boundingBox.max.z - geometry.boundingBox.min.z

        // Create Mesh
        const material = new THREE.MeshStandardMaterial({ 
          color: 0x00ff00, 
          roughness: 0.5, 
          metalness: 0.5 
        })
        this.mesh = new THREE.Mesh(geometry, material)
        
        // Position slightly above ground (Z-up)
        this.mesh.position.z = this.chassisHeight / 2
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
    
    // Turret Group (This will rotate YAW around Z)
    this.turretMesh = new THREE.Group()

    // 1. Flat Base Cylinder (Static relative to chassis)
    const baseHeight = 0.5
    // Cylinder is Y-up by default. Rotate to Z-up.
    const baseGeo = new THREE.CylinderGeometry(radius, radius, baseHeight, 32)
    baseGeo.rotateX(Math.PI / 2)
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5, metalness: 0.8 })
    const baseMesh = new THREE.Mesh(baseGeo, baseMat)
    
    // Position base on top of chassis (Z axis)
    // Base center z = chassis/2 + baseHeight/2
    baseMesh.position.z = (this.chassisHeight / 2) + (baseHeight / 2)
    this.mesh.add(baseMesh)
    this.turretBaseMesh = baseMesh

    // 2. Rotating Cylinder (Yaw Body)
    const turretHeight = 2
    const turretGeo = new THREE.CylinderGeometry(radius, radius, turretHeight, 32)
    turretGeo.rotateX(Math.PI / 2)
    const turretMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.4, metalness: 0.6 })
    const turretBody = new THREE.Mesh(turretGeo, turretMat)
    
    // Position yaw body inside the yaw group
    // Inside the group, the body should sit at z=0 (bottom) -> z=height/2 (center)
    turretBody.position.z = turretHeight / 2
    this.turretMesh.add(turretBody)
    
    // 3. Pitch Group (Sits on top of Yaw Body)
    this.turretPitchMesh = new THREE.Group()
    this.turretPitchMesh.position.z = turretHeight // Top of the yaw cylinder
    
    // Pitch Mount
    const pitchMountHeight = 0.5
    const pitchMountGeo = new THREE.CylinderGeometry(radius, radius, pitchMountHeight, 32)
    pitchMountGeo.rotateX(Math.PI / 2)
    const pitchMountMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.4, metalness: 0.7 })
    const pitchMountMesh = new THREE.Mesh(pitchMountGeo, pitchMountMat)
    
    // Position it so its bottom is at 0 (pivot point)
    pitchMountMesh.position.z = pitchMountHeight / 2
    
    this.turretPitchMesh.add(pitchMountMesh)
    
    // Add pitch group to yaw group
    this.turretMesh.add(this.turretPitchMesh)

    // Initial position
    this.updateTurretPosition()
    
    this.mesh.add(this.turretMesh)

    // Create Ball (Attached to Pitch Group)
    this.createBall(pitchMountHeight)
    
    // Add Arrow Helper
    this.addArrowHelper()
  }

  addArrowHelper() {
      // Remove existing from scene if any
      const existingArrow = this.scene.getObjectByName('forwardArrow')
      if (existingArrow) this.scene.remove(existingArrow)

      // Forward is +X (Field Centric W)
      const dir = new THREE.Vector3(1, 0, 0) 
      dir.normalize()
      
      const origin = new THREE.Vector3(0, 0, 0) 
      const length = 10
      const hex = 0xff0000 // Red

      this.arrowHelper = new THREE.ArrowHelper(dir, origin, length, hex)
      this.arrowHelper.name = 'forwardArrow'
      this.scene.add(this.arrowHelper)
  }

  updateTurretPosition() {
      if (!this.mesh) return
      
      const baseHeight = 0.5
      const zBase = (this.chassisHeight / 2) + (baseHeight / 2)
      
      // Update Base Position
      if (this.turretBaseMesh) {
          this.turretBaseMesh.position.set(
              state.turret.offsetX,
              state.turret.offsetY, // Y is now depth/side
              zBase + state.turret.offsetZ // Z is height
          )
      }
      
      // Update Rotating Turret Position
      const zTurret = (this.chassisHeight / 2) + baseHeight
      
      if (this.turretMesh) {
          this.turretMesh.position.set(
              state.turret.offsetX,
              state.turret.offsetY,
              zTurret + state.turret.offsetZ
          )
      }
  }

  createBall(mountHeight) {
    if (!this.mesh) return

    // Clean up existing ball
    if (this.ballMesh) {
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
    
    // Position ball on top of the pitch mount (Z axis)
    this.ballMesh.position.z = mountHeight + radius
    
    if (this.turretPitchMesh) {
        this.turretPitchMesh.add(this.ballMesh)
    } else {
        this.ballMesh.position.z = (this.chassisHeight / 2) + 2 + radius 
        this.mesh.add(this.ballMesh)
    }
  }

  resetPosition() {
    if (this.mesh) {
      this.mesh.position.set(0, 0, this.mesh.position.z)
      this.mesh.rotation.set(0, 0, 0)
    }
  }

  update(dt) {
    if (!this.mesh) return

    // Update Turret Rotation
    // Yaw around Z
    if (this.turretMesh) {
       this.turretMesh.rotation.z = THREE.MathUtils.degToRad(state.turret.yaw)
       // Pitch around Y (local axis after yaw)
       if (this.turretPitchMesh) {
           this.turretPitchMesh.rotation.y = THREE.MathUtils.degToRad(state.turret.pitch)
       }
    }

    // Drive Logic (Field Centric or Robot Centric? Code seems Field Centric relative to input)
    const forwardInput = (this.keys.w ? 1 : 0) - (this.keys.s ? 1 : 0)
    const strafeInput = (this.keys.d ? 1 : 0) - (this.keys.a ? 1 : 0)
    
    // Rotation (Q/E or Arrows) - Rotate around Z
    const rotateInput = (this.keys.ArrowLeft || this.keys.q ? 1 : 0) - (this.keys.ArrowRight || this.keys.e ? 1 : 0)

    // Apply Rotation
    if (rotateInput !== 0) {
      this.mesh.rotation.z += rotateInput * state.robot.rotationSpeed * dt
    }

    // Apply Movement
    // W = +X, S = -X
    // A = +Y, D = -Y (Standard Z-up: X Forward, Y Left)
    // Wait, D is strafe RIGHT. So D should be -Y.
    // A is strafe LEFT. So A should be +Y.
    // strafeInput = (D:1) - (A:0) = 1 -> We want -Y.
    // So Y component should be -strafeInput.
    
    if (forwardInput !== 0 || strafeInput !== 0) {
      const moveVec = new THREE.Vector3(forwardInput, -strafeInput, 0) // X, Y, Z
      
      if (moveVec.lengthSq() > 0) {
        moveVec.normalize()
        // Transform direction by robot rotation if we want robot-centric
        // Previous code was field-centric but used mesh.position.addScaledVector(moveVec) directly?
        // Actually, without applying quaternion, it is World-Centric (Field-Centric).
        // If the user wants "W drives towards positive direction", that implies Field-Centric +X.
        // If the robot rotates, W still drives +X?
        // Usually W drives Robot-Forward.
        // Let's check previous code: `moveVec` was (strafe, 0, -forward).
        // It didn't use robot rotation. So it was Field-Centric.
        // I'll keep it Field-Centric +X.
        
        this.mesh.position.addScaledVector(moveVec, state.robot.speed * dt)
      }
    }
    
    // Update Arrow Helper Position
    if (this.arrowHelper) {
        this.arrowHelper.position.copy(this.mesh.position)
        this.arrowHelper.position.z = 0.5 // Keep on ground (slightly elevated)
    }
  }
}
