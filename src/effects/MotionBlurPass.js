import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

const radialBlurShader = {
  uniforms: {
    tDiffuse: { value: null },
    strength: { value: 0 },
    center: { value: [0.5, 0.5] },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float strength;
    uniform vec2 center;
    varying vec2 vUv;

    void main() {
      vec2 direction = (vUv - center) * strength;
      vec4 color = vec4(0.0);
      for (int sampleIndex = 0; sampleIndex < 8; sampleIndex++) {
        float amount = float(sampleIndex) / 7.0;
        color += texture2D(tDiffuse, vUv - direction * amount);
      }
      gl_FragColor = color / 8.0;
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `,
};

// Converts scroll velocity into a short, damped radial zoom blur.
export class MotionBlurPass extends ShaderPass {
  constructor() {
    super(radialBlurShader);
    this.targetStrength = 0;
  }

  setVelocity(velocity) {
    this.targetStrength = Math.min(Math.abs(velocity) * 0.0025, 0.075);
  }

  update(deltaSeconds) {
    const blend = 1 - Math.exp(-deltaSeconds * 9);
    this.uniforms.strength.value += (this.targetStrength - this.uniforms.strength.value) * blend;
    this.targetStrength *= Math.exp(-deltaSeconds * 5);
  }
}
