// Boot: renderer, scene and the city. (First pass: a fly-over view of the city to check the look.)
import * as THREE from 'three';
import { createRandom } from './random.js';
import { generateCityLayout } from './citylayout.js';
import { buildCityMeshes } from './citymesh.js';
import { buildScenery } from './scenery.js';
import { createEnvironment } from './environment.js';

const canvas = document.getElementById('view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.3, 1200);
const rng = createRandom(1);
const layout = generateCityLayout(rng);
scene.add(buildCityMeshes(layout));
scene.add(buildScenery(layout));
const env = createEnvironment(scene);
const q = new URLSearchParams(location.search);
const v = (q.get('cam') ?? '250,60,200,320,0,0').split(',').map(Number);
camera.position.set(v[0], v[1], v[2]);
camera.lookAt(v[3], v[4], v[5]);
env.update(0, new THREE.Vector3(v[3], 0, v[5]), camera);
renderer.render(scene, camera);
