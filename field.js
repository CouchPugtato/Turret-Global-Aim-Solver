import * as THREE from 'three'
import { STLLoader } from 'three/addons/loaders/STLLoader.js'

export class Field {
  constructor(scene) {
    this.scene = scene
    this.hubMesh = null
    this.createHub()
  }

  createHub() {
    // 2026 Rebuilt Hub Generation - Updated per user request
    // Base: Cube 47" x 47" x 47"
    // Funnel: Inset Hexagon, Diameter 41.7", Height 27"
    // Funnel placed inside the cube, top flush with cube top.

    const baseSize = 47
    const funnelDiameter = 41.7
    const funnelRadius = funnelDiameter / 2
    const funnelHeight = 27

    console.log(`Creating 2026 Rebuilt Hub: Base Cube=${baseSize}", Funnel Dia=${funnelDiameter}", Funnel Height=${funnelHeight}"`)

    const group = new THREE.Group()

    // 1. The Base (Cube)
    // Solid cube base.
    const baseGeometry = new THREE.BoxGeometry(baseSize, baseSize, baseSize)
    
    // Materials: [Right, Left, Top, Bottom, Front, Back]
    const wallMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x444444, 
      roughness: 0.8,
      side: THREE.DoubleSide
    })

    const materials = [
        wallMaterial, // +x
        wallMaterial, // -x
        wallMaterial, // +y (Top)
        wallMaterial, // -y (Bottom)
        wallMaterial, // +z
        wallMaterial  // -z
    ]

    const baseMesh = new THREE.Mesh(baseGeometry, materials)
    baseMesh.position.y = baseSize / 2 // Move up so bottom is at 0
    baseMesh.castShadow = true
    baseMesh.receiveShadow = true
    group.add(baseMesh)

    // 2. The Funnel (Hexagon)
    const funnelGeometry = new THREE.CylinderGeometry(funnelRadius, funnelRadius, funnelHeight, 6, 1, true) 
    const funnelMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xFFD700, // Gold
      roughness: 0.2,
      metalness: 0.5,
      side: THREE.DoubleSide
    })
    const funnelMesh = new THREE.Mesh(funnelGeometry, funnelMaterial)
    
    // Position: On top of the box
    // Box Top Y = baseSize
    // Funnel Center Y = baseSize + (funnelHeight / 2)
    funnelMesh.position.y = baseSize + (funnelHeight / 2)
    
    funnelMesh.castShadow = true
    funnelMesh.receiveShadow = true
    group.add(funnelMesh)

    // Final Group Adjustment
    // Rotate Group to match World Z-up (from Local Y-up)
    group.rotation.x = Math.PI / 2
    
    // Position "halfway forwards" (X=60)
    group.position.set(60, 0, 0)

    this.hubMesh = group
    this.scene.add(this.hubMesh)
  }
}
