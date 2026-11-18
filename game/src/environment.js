// Sun-soaked afternoon: gradient sky dome with a sun disc, warm key light with a shadow box that
// follows the player, sky/ground fill, haze, and an animated sea with a foam line.

import * as THREE from 'three';

export const SUN_DIRECTION = new THREE.Vector3(0.55, 0.62, 0.36).normalize();

export function createEnvironment(scene) {
  scene.background = new THREE.Color('#9fd3ee');
  scene.fog = new THREE.Fog('#cfe6ef', 160, 560);

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(900, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: { sunDir: { value: SUN_DIRECTION } },
      vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `
        uniform vec3 sunDir; varying vec3 vDir;
        void main(){
          float h = clamp(vDir.y, -0.1, 1.0);
          vec3 horizon = vec3(1.0, 0.86, 0.70);
          vec3 mid = vec3(0.55, 0.80, 0.95);
          vec3 zenith = vec3(0.16, 0.45, 0.82);
          vec3 col = mix(horizon, mid, smoothstep(0.0, 0.18, h));
          col = mix(col, zenith, smoothstep(0.18, 0.9, h));
          float s = max(dot(normalize(vDir), sunDir), 0.0);
          col += vec3(1.0, 0.85, 0.55) * pow(s, 18.0) * 0.55 + vec3(1.0, 0.95, 0.85) * pow(s, 900.0) * 3.0;
          gl_FragColor = vec4(col, 1.0);
        }`,
    }),
  );
  sky.name = 'sky';
  sky.renderOrder = -10;
  scene.add(sky);

  const hemi = new THREE.HemisphereLight('#bfe3ff', '#d8b98a', 1.25);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight('#ffe3b5', 2.6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const cam = sun.shadow.camera;
  cam.left = -90; cam.right = 90; cam.top = 90; cam.bottom = -90; cam.near = 1; cam.far = 500;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.4;
  scene.add(sun);
  scene.add(sun.target);

  const ocean = createOcean();
  scene.add(ocean);

  return {
    sky, sun, hemi, ocean,
    /** Keep the sky centred on the camera and the shadow box on the focus point. */
    update(time, focus, camera) {
      sky.position.copy(camera.position);
      sun.position.set(focus.x + SUN_DIRECTION.x * 220, SUN_DIRECTION.y * 220, focus.z + SUN_DIRECTION.z * 220);
      sun.target.position.set(focus.x, 0, focus.z);
      ocean.material.uniforms.time.value = time;
    },
  };
}

function createOcean() {
  const geo = new THREE.PlaneGeometry(2600, 2600, 1, 1);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.ShaderMaterial({
    fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { time: { value: 0 }, sunDir: { value: SUN_DIRECTION } }]),
    vertexShader: `
      #include <fog_pars_vertex>
      varying vec3 vWorld;
      void main(){
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorld = wp.xyz;
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `
      #include <fog_pars_fragment>
      uniform float time; uniform vec3 sunDir; varying vec3 vWorld;
      float wave(vec2 p){ return sin(p.x*0.09 + time*1.1) * cos(p.y*0.07 - time*0.8) + 0.5*sin((p.x+p.y)*0.21 + time*1.7); }
      void main(){
        vec2 p = vWorld.xz;
        float e = 0.6;
        vec3 n = normalize(vec3(wave(p+vec2(e,0.0)) - wave(p-vec2(e,0.0)), 3.0, wave(p+vec2(0.0,e)) - wave(p-vec2(0.0,e))));
        // Shallow turquoise near the island fading to deep blue.
        float shore = max(max(abs(p.x - 20.0) - 400.0, abs(p.y) - 360.0), 0.0);
        vec3 shallow = vec3(0.20, 0.78, 0.80);
        vec3 deep = vec3(0.04, 0.33, 0.58);
        vec3 col = mix(shallow, deep, smoothstep(0.0, 140.0, shore));
        vec3 viewDir = normalize(cameraPosition - vWorld);
        float spec = pow(max(dot(reflect(-sunDir, n), viewDir), 0.0), 60.0);
        float fres = pow(1.0 - max(dot(n, viewDir), 0.0), 3.0);
        col = mix(col, vec3(0.75, 0.88, 0.97), fres * 0.5) + vec3(1.0, 0.9, 0.7) * spec * 1.4;
        float foam = smoothstep(0.75, 1.0, wave(p*2.3) * 0.5 + 0.5) * (1.0 - smoothstep(0.0, 25.0, shore));
        col = mix(col, vec3(1.0), foam * 0.35);
        gl_FragColor = vec4(pow(col, vec3(2.2)), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = -0.45;
  mesh.name = 'ocean';
  return mesh;
}
