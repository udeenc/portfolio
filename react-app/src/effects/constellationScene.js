import * as THREE from 'three'
import { createConstellationData, createDissolveOffsets, constellationConfig as config } from '../data/constellation3d.js'
import { clampProgress, dissolveEase } from './heroDissolve.js'

const pointVertex = `
 attribute float size;
 attribute float phase;
 attribute float strength;
 attribute vec3 tint;
 uniform float clock;
 uniform float pixelRatio;
 uniform float visibility;
 varying vec3 color;
 varying float opacity;
 void main() {
   vec4 view = modelViewMatrix * vec4(position, 1.0);
   gl_Position = projectionMatrix * view;
   gl_PointSize = size * 5.0 * pixelRatio * clamp(15.0 / -view.z, .65, 1.4);
   color = tint;
   opacity = strength * (.92 + .08 * sin(clock * .4 + phase)) * visibility;
 }
`
const pointFragment = `
 varying vec3 color;
 varying float opacity;
 void main() {
   float radius = length(gl_PointCoord - .5) * 2.0;
   if (radius > 1.0) discard;
   float core = 1.0 - smoothstep(.08, .24, radius);
   float halo = pow(1.0 - radius, 3.0) * .22;
   gl_FragColor = vec4(color, (core + halo) * opacity);
   #include <colorspace_fragment>
 }
`

export function createConstellationScene(host, {
  createRenderer = () => new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' }),
} = {}) {
  const geometries = [], materials = []
  let renderer, disposed = false
  const dispose = () => {
    if (disposed) return
    disposed = true
    for (const geometry of geometries) geometry.dispose()
    for (const material of materials) material.dispose()
    renderer?.dispose(); renderer?.forceContextLoss(); renderer?.domElement.remove()
  }
  try {
    renderer = createRenderer()
    renderer.setClearColor(0x080d16, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    let shaderFailed = false
    renderer.debug.onShaderError = () => { shaderFailed = true }
    const canvas = renderer.domElement
    canvas.setAttribute('aria-hidden', 'true'); canvas.setAttribute('tabindex', '-1')
    host.appendChild(canvas)
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, 1, .1, 50)
    camera.position.z = 15
    const group = new THREE.Group()
    group.position.x = 3 // Rotate around the dense right cluster, away from the text.
    scene.add(group)
    const { nodes, edges } = createConstellationData()
    const offsets = createDissolveOffsets(nodes)
    const colors = nodes.flatMap(node => new THREE.Color(node.violet ? '#a58aff' : '#61e8db').toArray())
    const geometry = () => { const value = new THREE.BufferGeometry(); geometries.push(value); return value }
    const attr = (geo, name, array, size, dynamic = false) => {
      const value = new THREE.Float32BufferAttribute(array, size)
      if (dynamic) value.setUsage(THREE.DynamicDrawUsage)
      geo.setAttribute(name, value)
      return value.array
    }
    const points = (geo, sizes, phases, strengths, tints) => {
      attr(geo, 'size', sizes, 1); attr(geo, 'phase', phases, 1)
      attr(geo, 'strength', strengths, 1); attr(geo, 'tint', tints, 3)
      const material = new THREE.ShaderMaterial({ vertexShader: pointVertex, fragmentShader: pointFragment,
        transparent: true, depthWrite: false, depthTest: false,
        uniforms: { clock: { value: 0 }, pixelRatio: { value: 1 }, visibility: { value: 1 } } })
      materials.push(material)
      const cloud = new THREE.Points(geo, material)
      cloud.frustumCulled = false; group.add(cloud)
      return material
    }
    const nodeGeometry = geometry()
    const nodePositions = attr(nodeGeometry, 'position', new Float32Array(nodes.length * 3), 3, true)
    const nodeMaterial = points(nodeGeometry, nodes.map(n => n.size), nodes.map(n => n.phase),
      nodes.map(n => .45 + (n.position[2] + 1.3) / 5.2), colors)
    const lineGeometry = geometry()
    const linePositions = attr(lineGeometry, 'position', new Float32Array(edges.length * 6), 3, true)
    attr(lineGeometry, 'color', edges.flatMap(([a, b]) => [...colors.slice(a * 3, a * 3 + 3), ...colors.slice(b * 3, b * 3 + 3)]), 3)
    const lineMaterial = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: .15, depthWrite: false, depthTest: false })
    materials.push(lineMaterial)
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial)
    lines.frustumCulled = false; group.add(lines)
    const flowGeometry = geometry()
    const flows = Math.min(config.flows, edges.length)
    const flowEdges = Array.from({ length: flows }, (_, i) => edges[Math.floor((i + .5) / flows * edges.length)])
    const flowPositions = attr(flowGeometry, 'position', new Float32Array(flows * 3), 3, true)
    const flowMaterial = points(flowGeometry, Array(flows).fill(3.2), Array(flows).fill(0), Array(flows).fill(0),
      Array.from({ length: flows }, (_, i) => colors.slice(i * 12, i * 12 + 3)).flat())
    const flowPoints = group.children[group.children.length - 1]
    const strengths = flowGeometry.attributes.strength
    strengths.setUsage(THREE.DynamicDrawUsage)
    return {
      canvas,
      healthy: () => !shaderFailed && !renderer.getContext().isContextLost(),
      resize(width, height, dpr) {
        const ratio = Math.min(config.dpr, dpr)
        renderer.setPixelRatio(ratio); renderer.setSize(width, height)
        nodeMaterial.uniforms.pixelRatio.value = flowMaterial.uniforms.pixelRatio.value = ratio
        camera.aspect = width / height
        // Match H1 SVG xMidYMid slice framing.
        camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.min(10, 16 / camera.aspect) / 30))
        camera.updateProjectionMatrix()
      },
      render(time, pointer, progress = 0) {
        progress = clampProgress(progress)
        const spread = dissolveEase(.25, .85, progress) * (.15 + .85 * dissolveEase(.55, .95, progress))
        nodeMaterial.uniforms.visibility.value = 1 - dissolveEase(.55, 1, progress)
        flowMaterial.uniforms.visibility.value = 1 - dissolveEase(.25, .55, progress)
        flowPoints.visible = flowMaterial.uniforms.visibility.value > 0
        lineMaterial.opacity = .15 * (1 - dissolveEase(.25, .65, progress))
        lines.visible = lineMaterial.opacity > 0
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i]
          for (let axis = 0; axis < 3; axis++) {
            nodePositions[i * 3 + axis] = node.position[axis] - (axis === 0 ? 3 : 0) +
              Math.sin(time * (.12 + axis * .025) + node.phase + axis) * .035 + offsets[i][axis] * spread
          }
        }
        for (let i = 0; lines.visible && i < edges.length; i++) {
          const [a, b] = edges[i]
          for (let axis = 0; axis < 3; axis++) {
            linePositions[i * 6 + axis] = nodePositions[a * 3 + axis]
            linePositions[i * 6 + 3 + axis] = nodePositions[b * 3 + axis]
          }
        }
        for (let i = 0; flowPoints.visible && i < flows; i++) {
          const [a, b] = flowEdges[i]
          const progress = (time / (12 + i * 1.7) + i / flows) % 1
          for (let axis = 0; axis < 3; axis++) {
            flowPositions[i * 3 + axis] = THREE.MathUtils.lerp(nodePositions[a * 3 + axis], nodePositions[b * 3 + axis], progress)
          }
          strengths.array[i] = Math.sin(progress * Math.PI) * .65
        }
        nodeGeometry.attributes.position.needsUpdate = true
        if (lines.visible) lineGeometry.attributes.position.needsUpdate = true
        if (flowPoints.visible) {
          flowGeometry.attributes.position.needsUpdate = true
          strengths.needsUpdate = true
        }
        group.rotation.y = Math.sin(time * .07) * .016 + pointer.x * .035
        group.rotation.x = Math.sin(time * .05) * .008 + pointer.y * .018
        nodeMaterial.uniforms.clock.value = flowMaterial.uniforms.clock.value = time
        renderer.render(scene, camera)
      },
      dispose,
    }
  } catch (error) { dispose(); throw error }
}
