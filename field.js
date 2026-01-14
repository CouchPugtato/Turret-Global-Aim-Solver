import * as THREE from 'three'
import { STLLoader } from 'three/addons/loaders/STLLoader.js'

export class Field {
  constructor(scene) {
    this.scene = scene
    this.hubMesh = null
    this.createHub()
    this.createWall()
  }

  createWall() {
    const wallHeight = 47
    const wallThickness = 1
    const wallWidth = 200 

    const distFromHubFace = 158.6
    const hubFaceX = 60 - (47 / 2)
    const wallFaceX = hubFaceX - distFromHubFace
    const wallCenterX = wallFaceX - (wallThickness / 2)

    const geometry = new THREE.BoxGeometry(wallThickness, wallWidth, wallHeight)
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x666666, 
      roughness: 0.8 
    })
    
    this.wallMesh = new THREE.Mesh(geometry, material)
    this.wallMesh.position.set(wallCenterX, 0, wallHeight / 2)
    this.wallMesh.castShadow = true
    this.wallMesh.receiveShadow = true
    
    this.scene.add(this.wallMesh)
  }

  createHub() {
    const baseSize = 47
    const funnelDiameter = 41.7
    const funnelRadius = funnelDiameter / 2
    const funnelHeight = 27

    console.log(`Creating 2026 Rebuilt Hub: Base Cube=${baseSize}", Funnel Dia=${funnelDiameter}", Funnel Height=${funnelHeight}"`)

    const group = new THREE.Group()

    const baseGeometry = new THREE.BoxGeometry(baseSize, baseSize, baseSize)
    
    const wallMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x444444, 
      roughness: 0.8,
      side: THREE.DoubleSide
    })

    const materials = [
        wallMaterial,
        wallMaterial,
        wallMaterial,
        wallMaterial,
        wallMaterial,
        wallMaterial
    ]

    const baseMesh = new THREE.Mesh(baseGeometry, materials)
    baseMesh.position.y = baseSize / 2
    baseMesh.castShadow = true
    baseMesh.receiveShadow = true
    group.add(baseMesh)

    const funnelGeometry = new THREE.CylinderGeometry(funnelRadius, funnelRadius, funnelHeight, 6, 1, true) 
    const funnelMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xFFD700,
      roughness: 0.2,
      metalness: 0.5,
      side: THREE.DoubleSide
    })
    const funnelMesh = new THREE.Mesh(funnelGeometry, funnelMaterial)
    
    funnelMesh.position.y = baseSize + (funnelHeight / 2)
    funnelMesh.rotation.y = Math.PI / 2
    funnelMesh.castShadow = true
    funnelMesh.receiveShadow = true
    group.add(funnelMesh)

    group.rotation.x = Math.PI / 2
    
    group.position.set(60, 0, 0)

    this.hubMesh = group
    this.scene.add(this.hubMesh)
  }

  getTargetPosition() {
      return new THREE.Vector3(60, 0, 74)
  }
}
