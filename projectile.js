import * as THREE from 'three'
import { state } from './state.js'

export class ProjectileManager {
  constructor(scene, field) {
    this.scene = scene
    this.field = field
    this.projectiles = []
    this.gravity = 386.09
    this.raycaster = new THREE.Raycaster()
  }

  spawn(position, velocity, diameter, physicsModeOverride) {
    const radius = diameter / 2
    const geometry = new THREE.SphereGeometry(radius, 16, 16)
    
    const physMode = physicsModeOverride || (state.advancedPhysics ? (state.advancedPhysics.mode || 'none') : 'none')
    const useAdvanced = (physMode !== 'none')

    const material = useAdvanced
      ? new THREE.MeshStandardMaterial({
          color: 0xff0000,
          roughness: 0.2,
          metalness: 0.1,
          transparent: true,
          opacity: 0.4
        })
      : new THREE.MeshStandardMaterial({
          color: 0xffff00,
          roughness: 0.2,
          metalness: 0.1
        })
    const mesh = new THREE.Mesh(geometry, material)
    
    mesh.position.copy(position)
    mesh.castShadow = true
    mesh.receiveShadow = true
    
    this.scene.add(mesh)
    
    this.projectiles.push({
      mesh: mesh,
      velocity: velocity.clone(),
      active: true,
      age: 0,
      advanced: useAdvanced,
      physicsMode: physMode
    })
  }

  update(dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i]
      
      p.age += dt
      if (p.age >= 10) {
        this.removeProjectile(i)
        continue
      }
      
      const prevPos = p.mesh.position.clone()

      if ((p.physicsMode === 'drag' || p.physicsMode === 'drag_calc') && state.advancedPhysics) {          
        const speed = p.velocity.length() // inches/sec
        if (speed > 0) {
          const dragConfig = state.advancedPhysics
          
          const metersPerInch = 0.0254 // m/inch to convert from equation native units
      
          const v_SI = speed * metersPerInch // mps
          const area_SI = dragConfig.referenceArea * metersPerInch * metersPerInch // area in m^2 (input is in^2)
                
          const cd = dragConfig.dragCoefficient
          const dragForce_SI = 0.5 * dragConfig.airDensity * v_SI * v_SI * cd * area_SI // newtons (kg*m/s^2)
      
          const mass_kg = (dragConfig.mass || 1) / 1000
          const acc_SI = dragForce_SI / mass_kg
          const acc_imperial = acc_SI / metersPerInch
          
          const dragAcc = p.velocity.clone().normalize().multiplyScalar(-acc_imperial)
          
          p.velocity.addScaledVector(dragAcc, dt)
        }
      }

      p.velocity.z -= this.gravity * dt
      
      const displacement = p.velocity.clone().multiplyScalar(dt)
      const dist = displacement.length()
      
      let collided = false

      if (this.field && this.field.hubMesh && dist > 0) {
          this.raycaster.set(prevPos, displacement.clone().normalize())
          this.raycaster.far = dist

          const intersects = this.raycaster.intersectObject(this.field.hubMesh, true)
          
          if (intersects.length > 0) {
              collided = true
              const hit = intersects[0]
              
              if (hit.face) {
                  let normal = hit.face.normal.clone()
                  normal.transformDirection(hit.object.matrixWorld).normalize()
                  
                  if (displacement.dot(normal) > 0) {
                      normal.negate()
                  }

                  const radius = p.mesh.geometry.parameters.radius
                  p.mesh.position.copy(hit.point).addScaledVector(normal, radius + 0.001)
                  
                  const v = p.velocity.clone()
                  const dot = v.dot(normal)
                  const reflect = v.sub(normal.multiplyScalar(2 * dot))
                  
                  p.velocity.copy(reflect).multiplyScalar(0.6)
              }
          }
      }

      if (!collided) {
        p.mesh.position.add(displacement)
      }
      
      const radius = p.mesh.geometry.parameters.radius
      
      if (p.mesh.position.z <= radius) {
        p.mesh.position.z = radius
        
        if (Math.abs(p.velocity.z) > 20) {
            p.velocity.z = -p.velocity.z * 0.5 
            p.velocity.x *= 0.8 
            p.velocity.y *= 0.8 
        } else {
            p.velocity.z = 0
            p.velocity.x *= 0.9
            p.velocity.y *= 0.9
        }

        if (p.velocity.lengthSq() < 10) {
            this.removeProjectile(i)
        }
      }
    }
  }

  removeProjectile(index) {
    const p = this.projectiles[index]
    this.scene.remove(p.mesh)
    p.mesh.geometry.dispose()
    p.mesh.material.dispose()
    this.projectiles.splice(index, 1)
  }
}
