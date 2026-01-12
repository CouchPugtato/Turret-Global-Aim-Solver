import * as THREE from 'three'
import { state } from './state.js'

export class ProjectileManager {
  constructor(scene) {
    this.scene = scene
    this.projectiles = []
    this.gravity = 386.09
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
      
      p.velocity.z -= this.gravity * dt
      
      p.mesh.position.addScaledVector(p.velocity, dt)
      
      const radius = p.mesh.geometry.parameters.radius
      
      if (p.mesh.position.z <= radius) {
        p.mesh.position.z = radius
        this.removeProjectile(i)
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
