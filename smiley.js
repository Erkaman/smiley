/*
  :^) :^) :^) :^) :^) :^) :^) :^) :^) :^) :^)
  :^) :^) :^) :^) :^) :^) :^) :^) :^) :^) :^)
  :^) :^) :^) :^) :^) :^) :^) :^) :^) :^) :^)
  :^) :^) :^) :^) :^) :^) :^) :^) :^) :^) :^)
  :^) :^) :^) :^) :^) :^) :^) :^) :^) :^) :^)
*/

const canvas = document.body.appendChild(document.createElement('canvas'))
const fit = require('canvas-fit')
var str = `<a href="https://github.com/Erkaman/smiley/"><img style="position: absolute; top: 0; left: 0; border: 0;" src="https://camo.githubusercontent.com/82b228a3648bf44fc1163ef44c62fcc60081495e/68747470733a2f2f73332e616d617a6f6e6177732e636f6d2f6769746875622f726962626f6e732f666f726b6d655f6c6566745f7265645f6161303030302e706e67" alt="Fork me on GitHub" data-canonical-src="https://s3.amazonaws.com/github/ribbons/forkme_left_red_aa0000.png"></a>`

var container = document.createElement('div')
container.innerHTML = str
document.body.appendChild(container)
window.addEventListener('resize', fit(canvas), false)

const regl = require('regl')({ canvas: canvas })

const perspective = require('gl-mat4/perspective')
const lookAt = require('gl-mat4/lookAt')
const invert = require('gl-mat4/invert')

const cube = regl.cube({
  min: 'linear', mag: 'linear',
  faces: [
    require('./assets/posx.js'),
    require('./assets/negx.js'),
    require('./assets/posy.js'),
    require('./assets/negy.js'),
    require('./assets/posz.js'),
    require('./assets/negz.js')
  ]}
)

var textMesh = require('./assets/mesh.js')

const drawText = regl({
  frag: `
  precision mediump float;

  uniform samplerCube envmap;

  varying vec3 vNormal;
  varying vec3 vPosition;

  uniform mat4 invView;

  void main () {

    vec3 eye = (invView * vec4(0, 0, 0, 1)).xyz;

    vec3 reflectDir = reflect(
      normalize(vPosition.xyz - eye.xyz),
      vNormal);

    vec3 l = vec3(-0.39, -0.87, 0.29);
    vec3 n = vNormal;
    vec3 v = normalize(eye - vPosition);

    vec3 spec = vec3(0.708281,0.555802,0.366065);

    vec3 c =
      vec3(0.30725, 0.1995, 0.0745) + // ambient
      vec3(0.80164,0.60648,0.22648) * clamp( dot(n, l), 0.0, 1.0 ) + // diffuse
      pow(clamp(dot(normalize(l+v),n),0.0,1.0), 0.4*128.0) * spec + // specular
      textureCube(envmap, reflectDir).xyz * spec * 0.3; // envmap

    gl_FragColor = vec4(c, 1.0);
  }`,

  vert: `
  precision mediump float;

  attribute vec3 position;
  attribute vec3 normal;

  varying vec3 vNormal;
  varying vec3 vPosition;

  uniform mat4 projection, view;

  void main () {
    vNormal = normal;
    vPosition = position;

    gl_Position = projection * view * vec4(position, 1);
  }`,

  attributes: {
    position: textMesh.positions,
    normal: require('normals').vertexNormals(textMesh.cells, textMesh.positions)
  },

  elements: textMesh.cells,

  context: {
    view: ({tick}) => {
      var t = -0.020 * tick
      var Z = 250
      return lookAt([],
                    [-100, Z * Math.sin(t), -Z * Math.cos(t)],
                    [0, 0, 0],
                    [-1, 0, 0])
    }
  },

  uniforms: {
    view: regl.context('view'),
    invView: ({view}) => invert([], view),
    envmap: cube,

    projection: ({viewportWidth, viewportHeight}) =>
      perspective([],
                  Math.PI / 4,
                  viewportWidth / viewportHeight,
                  0.01,
                  500)
  },

  cull: {enable: true}
})

regl.frame(({viewportWidth, viewportHeight}) => {
  regl.clear({
    depth: 1,
    color: [0.0, 0.0, 0.0, 1.0]
  })
  drawText()
})
