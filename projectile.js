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

  spawn(position, velocity, diameter) {
    const radius = diameter / 2
    const geometry = new THREE.SphereGeometry(radius, 16, 16)
    const material = new THREE.MeshStandardMaterial({ 
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
      active: true
    })
  }

  update(dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i]
      
      const prevPos = p.mesh.position.clone()

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