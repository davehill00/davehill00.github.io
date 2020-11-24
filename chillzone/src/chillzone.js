import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js'; //'three/examples/jsm/webxr/XRControllerModelFactory.js';
import * as CZScene from './scene.js';
import * as TWEEN from '@tweenjs/tween.js';
import * as INTERVAL from "./interval.js";

let clock = null;
let accumulatedTime = 0.0;
let scene = null;
let camera = null;
let renderer = null;

initialize();

function initialize()
{
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 0;

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


    const controls = new OrbitControls(camera, renderer.domElement);
    controls.update();

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(2, 2, 1);
    scene.add(directionalLight);

    const light = new THREE.AmbientLight(0xf58789); // soft white light
    scene.add(light);

    clock = new THREE.Clock();

    // create an AudioListener and add it to the camera
    const listener = new THREE.AudioListener();
    camera.add( listener );


    CZScene.initialize(renderer, listener, scene);

    renderer.setAnimationLoop(render);

        
};


function render() {
    let dt = clock.getDelta();
    CZScene.update(dt);
    accumulatedTime += dt;
    TWEEN.update(accumulatedTime);
    renderer.render(scene, camera);
}

function onSessionStart(event)
{
    CZScene.onSessionStart(accumulatedTime);
}
function onSessionEnd(event)
{
    CZScene.onSessionEnd(accumulatedTime);
}