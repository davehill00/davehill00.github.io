import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import * as TWEEN from '@tweenjs/tween.js';
import * as ZONE from './zone.js';
import * as HUD from './StatsHud.js';

let clock = null;
let accumulatedTime = 0.0;
let scene = null;
let camera = null;
let renderer = null;
let listener = null;
let zone = null;
let hud = null;
const bShowHud = false;

initialize();

function initialize()
{
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5.0;
    camera.position.y = 2.0;
    //camera.rotation.x = 90.0;
    //camera.lookAt( {x:0.0, y:0.0, z:-10.0});

    // add camera to scene so that objects attached to the camera get rendered
    scene.add(camera);

    renderer = new THREE.WebGLRenderer( {antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.antialias = false;
    renderer.xr.enabled = true;
    renderer.setClearColor(0xfff4ed);

    document.body.appendChild(renderer.domElement);
    document.body.appendChild(VRButton.createButton(renderer));

    renderer.xr.addEventListener( 'sessionstart', onSessionStart);
    renderer.xr.addEventListener( 'sessionend', onSessionEnd);


    if (bShowHud) hud = new HUD.StatsHud(camera);

    // const controls = new OrbitControls(camera, renderer.domElement);
    // controls.target.set(0.0, 0.0, -3.0);
    // controls.update();



    clock = new THREE.Clock();

 

    zone = new ZONE.ZoneIntro(scene, renderer, camera);
    zone.onStart(accumulatedTime);

    renderer.setAnimationLoop(render);     
};


function render() {
    if (bShowHud) hud.update();

    let dt = Math.min(clock.getDelta(), 0.0333);
    accumulatedTime += dt;

    zone.update(dt, accumulatedTime);
    TWEEN.update(accumulatedTime);
    renderer.render(scene, camera);
}

function onSessionStart(event)
{
    zone.onEnd();
    zone = new ZONE.ZoneDefault(scene, renderer, camera);
    zone.onStart(accumulatedTime);
}
function onSessionEnd(event)
{
    zone.onEnd();

    zone = new ZONE.ZoneIntro(scene, renderer, camera);
    zone.onStart(accumulatedTime);
}