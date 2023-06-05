const objectAssign = require('object-assign');
var assign = require('object-assign');

module.exports = function createMSDFShader (opt) {
  opt = opt || {};
  var opacity = typeof opt.opacity === 'number' ? opt.opacity : 1;
  var alphaTest = typeof opt.alphaTest === 'number' ? opt.alphaTest : 0.0001;
  var precision = opt.precision || 'highp';
  var color = opt.color;
  var map = opt.map;
  var negate = typeof opt.negate === 'boolean' ? opt.negate : true;
  var webGL2 = typeof opt.webGL2 == 'boolean' ? opt.webGL2 : true;

  // remove to satisfy r73
  delete opt.map;
  delete opt.color;
  delete opt.precision;
  delete opt.opacity;
  delete opt.negate;

  let vertexShaderCode;
  let fragmentShaderCode;
  if (webGL2)
  {
    //console.log("BUILDING WebGL2 Shaders");
    // vertexShaderCode = [
    //   '#version 300 es',
    //   'in vec2 uv;',
    //   'in vec4 position;',
    //   'uniform mat4 projectionMatrix;',
    //   'uniform mat4 modelViewMatrix;',
    //   'out vec2 vUv;',
    //   'void main() {',
    //   'vUv = uv;',
    //   'gl_Position = projectionMatrix * modelViewMatrix * position;',
    //   '}'
    // ].join('\n');

    vertexShaderCode = 
    `#version 300 es
    in vec2 uv;
    in vec4 position;
    uniform mat4 projectionMatrix;
    uniform mat4 modelViewMatrix;

    out vec2 vUv;
    
    void main() {
    
      vUv = uv;
      vec4 mvPosition = modelViewMatrix * position;
      gl_Position = projectionMatrix * mvPosition;
      // gl_Position.z -= 0.00001;
    
    }`;

    fragmentShaderCode = 
    `#version 300 es
    
    precision highp float;

    uniform float opacity;
    uniform vec3 color;
    uniform float pxRange;
    uniform sampler2D map;
    in vec2 vUv;
    out vec4 result;

    // uniform sampler2D u_texture;
    // uniform vec3 u_color;
    // uniform float u_opacity;
    // uniform float u_pxRange;
    // uniform bool u_useRGSS;
    
    // varying vec2 vUv;
    
    // #include <clipping_planes_pars_fragment>
    
    // functions from the original msdf repo:
    // https://github.com/Chlumsky/msdfgen#using-a-multi-channel-distance-field
    
    float median(float r, float g, float b) {
      return max(min(r, g), min(max(r, g), b));
    }
    
    float screenPxRange() {
      vec2 unitRange = vec2(pxRange)/vec2(textureSize(map, 0));
      vec2 screenTexSize = vec2(1.0)/fwidth(vUv);
      return max(0.5*dot(unitRange, screenTexSize), 1.0);
    }
    
    float tap(vec2 offsetUV) {
      vec3 msd = texture( map, offsetUV ).rgb;
      float sd = median(msd.r, msd.g, msd.b);
      float screenPxDistance = screenPxRange() * (sd - 0.5);
      float alpha = clamp(screenPxDistance + 0.5, 0.0, 1.0);
      return alpha;
    }
    
    void main() {
    
      float alpha;
    
      if ( true ) {
    
        // shader-based supersampling based on https://bgolus.medium.com/sharper-mipmapping-using-shader-based-supersampling-ed7aadb47bec
        // per pixel partial derivatives
        vec2 dx = dFdx(vUv);
        vec2 dy = dFdy(vUv);
    
        // rotated grid uv offsets
        vec2 uvOffsets = vec2(0.125, 0.375);
        vec2 offsetUV = vec2(0.0, 0.0);
    
        // supersampled using 2x2 rotated grid
        alpha = 0.0;
        offsetUV.xy = vUv + uvOffsets.x * dx + uvOffsets.y * dy;
        alpha += tap(offsetUV);
        offsetUV.xy = vUv - uvOffsets.x * dx - uvOffsets.y * dy;
        alpha += tap(offsetUV);
        offsetUV.xy = vUv + uvOffsets.y * dx - uvOffsets.x * dy;
        alpha += tap(offsetUV);
        offsetUV.xy = vUv - uvOffsets.y * dx + uvOffsets.x * dy;
        alpha += tap(offsetUV);
        alpha *= 0.25;
    
      } else {
    
        alpha = tap( vUv );
    
      }
    
    
      // apply the opacity
      alpha *= opacity;
    
      // this is useful to avoid z-fighting when quads overlap because of kerning
      if ( alpha < 0.3) discard;
    
    
      result = vec4( color, alpha );
    
      // #include <clipping_planes_fragment>
    
    }
    `;
    /*
    fragmentShaderCode = [
      '#version 300 es',
      'precision ' + precision + ' float;',
      'uniform float opacity;',
      'uniform vec3 color;',
      'uniform sampler2D map;',
      'in vec2 vUv;',
      'out vec4 result;',

      'float median(float r, float g, float b) {',
      '  return max(min(r, g), min(max(r, g), b));',
      '}',

      'void main() {',
      '  vec3 imageSample = ' + (negate ? '1.0 - ' : '') + 'texture(map, vUv, -1.0).rgb;',
      '  float sigDist = median(imageSample.r, imageSample.g, imageSample.b) - 0.5;',
      '  float alpha = clamp(sigDist/fwidth(sigDist) + 0.5, 0.0, 1.0);',
      '  result = vec4(color.xyz, alpha * opacity);',
      alphaTest === 0
        ? ''
        : '  if (result.a < ' + alphaTest + ') discard;',
      '}'
    ].join('\n');
    */
  }
  else
  {
    console.log("BUILDING WebGL1 Shaders");
    vertexShaderCode = [
      'attribute vec2 uv;',
      'attribute vec4 position;',
      'uniform mat4 projectionMatrix;',
      'uniform mat4 modelViewMatrix;',
      'varying vec2 vUv;',
      'void main() {',
      'vUv = uv;',
      'gl_Position = projectionMatrix * modelViewMatrix * position;',
      '}'
    ].join('\n');

    fragmentShaderCode = [
      '#ifdef GL_OES_standard_derivatives',
      '#extension GL_OES_standard_derivatives : enable',
      '#endif',
      'precision ' + precision + ' float;',
      'uniform float opacity;',
      'uniform vec3 color;',
      'uniform sampler2D map;',
      'varying vec2 vUv;',

      'float median(float r, float g, float b) {',
      '  return max(min(r, g), min(max(r, g), b));',
      '}',

      'void main() {',
      '  vec3 sample = ' + (negate ? '1.0 - ' : '') + 'texture2D(map, vUv).rgb;',
      '  float sigDist = median(sample.r, sample.g, sample.b) - 0.5;',
      '  float alpha = clamp(sigDist/fwidth(sigDist) + 0.5, 0.0, 1.0);',
      '  gl_FragColor = vec4(color.xyz, alpha * opacity);',
      alphaTest === 0
        ? ''
        : '  if (gl_FragColor.a < ' + alphaTest + ') discard;',
      '}'
    ].join('\n');
  }

  return assign({
    uniforms: {
      opacity: { type: 'f', value: opacity },
      map: { type: 't', value: map || new THREE.Texture() },
      color: { type: 'c', value: new THREE.Color(color) },
      pxRange: {type: 'f', value: 4},

    },
    vertexShader: vertexShaderCode,
    fragmentShader: fragmentShaderCode
  }, opt);
};
