import * as THREE from 'three'
import { STLLoader } from 'three/addons/loaders/STLLoader.js'
import { state } from './state.js'

export class Robot {
  constructor(scene) {
    this.scene = scene
    this.mesh = null
    this.ballMesh = null
    this.turretMesh = null 
    this.turretPitchMesh = null 
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
        
        geometry.rotateX(Math.PI) 

        geometry.computeBoundingBox()
        const size = new THREE.Vector3()
        geometry.boundingBox.getSize(size)
        
        const scaleX = state.robot.width / size.x
        const scaleY = state.robot.depth / size.y 
        
        const scaleZ = (scaleX + scaleY) / 2 
        
        this.savedScale = { x: scaleX, y: scaleY, z: scaleZ }

        console.log(`Original Size: ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}. Scales: X=${scaleX.toFixed(4)}, Y=${scaleY.toFixed(4)}`)
        
        geometry.scale(scaleX, scaleY, scaleZ)
        
        geometry.computeBoundingBox()
        this.chassisHeight = geometry.boundingBox.max.z - geometry.boundingBox.min.z

        const material = new THREE.MeshStandardMaterial({ 
          color: 0x00ff00, 
          roughness: 0.5, 
          metalness: 0.5 
        })
        this.mesh = new THREE.Mesh(geometry, material)
        
        this.mesh.position.z = this.chassisHeight / 2
        this.mesh.castShadow = true
        this.mesh.receiveShadow = true
        
        this.scene.add(this.mesh)
        
        this.createTurret()
      },
      undefined,
      (error) => console.error('Error loading robot:', error)
    )
  }

  createTurret() {
    if (!this.mesh) return

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

    const radius = state.fuel.ballDiameter / 2
    
    this.turretMesh = new THREE.Group()

    const baseHeight = 0.5
    const baseGeo = new THREE.CylinderGeometry(radius, radius, baseHeight, 32)
    baseGeo.rotateX(Math.PI / 2)
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5, metalness: 0.8 })
    const baseMesh = new THREE.Mesh(baseGeo, baseMat)
    
    baseMesh.position.z = (this.chassisHeight / 2) + (baseHeight / 2)
    this.mesh.add(baseMesh)
    this.turretBaseMesh = baseMesh

    const turretHeight = 2
    const turretGeo = new THREE.CylinderGeometry(radius, radius, turretHeight, 32)
    turretGeo.rotateX(Math.PI / 2)
    const turretMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.4, metalness: 0.6 })
    const turretBody = new THREE.Mesh(turretGeo, turretMat)
    
    turretBody.position.z = turretHeight / 2
    this.turretMesh.add(turretBody)
    
    this.turretPitchMesh = new THREE.Group()
    this.turretPitchMesh.position.z = turretHeight 
    
    const pitchMountHeight = 0.5
    const pitchMountGeo = new THREE.CylinderGeometry(radius, radius, pitchMountHeight, 32)
    pitchMountGeo.rotateX(Math.PI / 2)
    const pitchMountMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.4, metalness: 0.7 })
    const pitchMountMesh = new THREE.Mesh(pitchMountGeo, pitchMountMat)
    
    pitchMountMesh.position.z = pitchMountHeight / 2
    
    this.turretPitchMesh.add(pitchMountMesh)
    
    this.turretMesh.add(this.turretPitchMesh)

    this.updateTurretPosition()
    
    this.mesh.add(this.turretMesh)

    this.addArrowHelper()
  }

  addArrowHelper() {
      const existingArrow = this.scene.getObjectByName('forwardArrow')
      if (existingArrow) this.scene.remove(existingArrow)

      const dir = new THREE.Vector3(1, 0, 0) 
      dir.normalize()
      
      const origin = new THREE.Vector3(0, 0, 0) 
      const length = 10
      const hex = 0xff0000 

      this.arrowHelper = new THREE.ArrowHelper(dir, origin, length, hex)
      this.arrowHelper.name = 'forwardArrow'
      this.scene.add(this.arrowHelper)
  }

  updateTurretPosition() {
      if (!this.mesh) return
      
      const baseHeight = 0.5
      const zBase = (this.chassisHeight / 2) + (baseHeight / 2)
      
      if (this.turretBaseMesh) {
          this.turretBaseMesh.position.set(
              state.turret.offsetX,
              state.turret.offsetY, 
              zBase + state.turret.offsetZ 
          )
      }
      
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

    if (this.ballMesh) {
        if (this.ballMesh.parent) {
            this.ballMesh.parent.remove(this.ballMesh)
        }
        this.ballMesh.geometry.dispose()
        this.ballMesh = null
    }

    const radius = state.fuel.ballDiameter / 2
    const geometry = new THREE.SphereGeometry(radius, 32, 32)
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xffff00, 
      roughness: 0.2, 
      metalness: 0.1 
    })
    this.ballMesh = new THREE.Mesh(geometry, material)
    
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

    if (this.turretMesh) {
       this.turretMesh.rotation.z = THREE.MathUtils.degToRad(state.turret.yaw)
       if (this.turretPitchMesh) {
           this.turretPitchMesh.rotation.y = THREE.MathUtils.degToRad(state.turret.pitch)
       }
    }

    const forwardInput = (this.keys.w ? 1 : 0) - (this.keys.s ? 1 : 0)
    const strafeInput = (this.keys.d ? 1 : 0) - (this.keys.a ? 1 : 0)
    
    const rotateInput = (this.keys.ArrowLeft || this.keys.q ? 1 : 0) - (this.keys.ArrowRight || this.keys.e ? 1 : 0)

    if (rotateInput !== 0) {
      this.mesh.rotation.z += rotateInput * state.robot.rotationSpeed * dt
    }

    if (forwardInput !== 0 || strafeInput !== 0) {
      const moveVec = new THREE.Vector3(forwardInput, -strafeInput, 0) 
      
      if (moveVec.lengthSq() > 0) {
        moveVec.normalize()
        
        this.mesh.position.addScaledVector(moveVec, state.robot.speed * dt)
      }
    }
    
    if (this.arrowHelper) {
        this.arrowHelper.position.copy(this.mesh.position)
        this.arrowHelper.position.z = 0.5 
    }
  }

  getMuzzleState() {
      if (!this.turretPitchMesh) return null

      const mountHeight = 0.5
      const radius = state.fuel.ballDiameter / 2
      const localPos = new THREE.Vector3(0, 0, mountHeight + radius)
      
      const worldPos = localPos.clone().applyMatrix4(this.turretPitchMesh.matrixWorld)
      
      const direction = new THREE.Vector3(0, 0, 1).transformDirection(this.turretPitchMesh.matrixWorld).normalize()
      
      const v = direction.multiplyScalar(state.fuel.exitVelocity)
      
      if (state.fuel.shootingError > 0) {
          const errorPercent = state.fuel.shootingError / 100
          const rx = (Math.random() * 2 - 1) * errorPercent
          const ry = (Math.random() * 2 - 1) * errorPercent
          const rz = (Math.random() * 2 - 1) * errorPercent
          
          v.x *= (1 + rx)
          v.y *= (1 + ry)
          v.z *= (1 + rz)
      }
      
      return {
          position: worldPos,
          velocity: v
      }
  }

  solveAim(targetPos) {
      if (!state.turret.autoAim || !this.turretPitchMesh) return

      // 1. calculate Yaw
      // get turret base position in world space to find direction to target
      const turretPos = new THREE.Vector3()
      this.turretMesh.getWorldPosition(turretPos)
      
      // calculate differences in X and Y to target
      const dx = targetPos.x - turretPos.x
      const dy = targetPos.y - turretPos.y
      
      // calculate target angle in global space (atan2 handles all quadrants)
      const targetYaw = Math.atan2(dy, dx)
      
      // get robot's current rotation (heading)
      const robotYaw = this.mesh.rotation.z
      
      // calculate local turret angle relative to robot body
      let localYaw = targetYaw - robotYaw
      
      // normalize angle to range [-PI, PI] for shortest rotation
      while (localYaw > Math.PI) localYaw -= 2 * Math.PI
      while (localYaw < -Math.PI) localYaw += 2 * Math.PI
      
      // apply calculated yaw to turret state (converted to degrees)
      state.turret.yaw = THREE.MathUtils.radToDeg(localYaw)

      // 2. calculate Pitch
      // get current muzzle position and velocity vector
      const muzzleState = this.getMuzzleState()
      if (!muzzleState) return

      // constants for physics calculation
      const v0 = state.fuel.exitVelocity // initial velocity magnitude
      const g = 386.09 // gravity (inches/s^2)
      
      // muzzle position
      const p0 = muzzleState.position
      
      // calculate horizontal distance (range) to target
      const horizDist = new THREE.Vector2(targetPos.x - p0.x, targetPos.y - p0.y).length()
      
      // calculate vertical height difference to target
      const h = targetPos.z - p0.z
      
      // set up Quadratic Equation for tan(theta): A*tan^2(theta) + B*tan(theta) + C = 0
      // derived from projectile motion equation: y = x*tan(theta) - (g*x^2)/(2*v^2*cos^2(theta))
      // using identity 1/cos^2(theta) = 1 + tan^2(theta)
      
      // coefficient A: (g * x^2) / (2 * v^2)
      const A = (g * horizDist * horizDist) / (2 * v0 * v0)
      
      // coefficient B: -x (horizontal distance)
      const B = -horizDist
      
      // coefficient C: y + A (height difference + A)
      const C = h + A
      
      // calculate Discriminant (B^2 - 4AC) to check for valid solutions
      const discrim = B*B - 4*A*C
      
      if (discrim >= 0) {
          const sqrtD = Math.sqrt(discrim)
          const u1 = (-B - sqrtD) / (2 * A)
          const u2 = (-B + sqrtD) / (2 * A)
          
          const theta1 = Math.atan(u1)
          const theta2 = Math.atan(u2)
          
          // use high arc (theta2) to ensure downward entry into funnel
          let theta = theta2 
          
          // if high arc is too steep (> 85 deg) or invalid, try low but on real just dont shoot
          if (theta > THREE.MathUtils.degToRad(89) || theta < THREE.MathUtils.degToRad(-45)) {
              theta = theta1
          }
          
          // convert standard elevation angle (0=Horizon, 90=Up) to robot pitch (0=up, 90=horizon)
          state.turret.pitch = 90 - THREE.MathUtils.radToDeg(theta)
      } else {
          state.turret.pitch = 45
      }
  }
}
