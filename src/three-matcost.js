import * as THREE from 'three';
//import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import {VRButton} from './vrButton.js';
import {OverrideXRFrameGetViewerPose} from "./overrideXRFrameGetViewerPose.js";

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js'; //'three/examples/jsm/webxr/XRControllerModelFactory.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// add camera to scene so that objects attached to the camera get rendered
scene.add(camera);

const renderer = new THREE.WebGLRenderer( {antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
renderer.xr.setFramebufferScaleFactor(1.0); //0.25);
renderer.setClearColor(0x000000); //0x303030);

renderer.useOldRenderObjectsLogic = true;

let matrixOverridePose = new THREE.Matrix4().compose(
    new THREE.Vector3(0,0,10), new THREE.Quaternion().identity(), new THREE.Vector3(1,1,1));

OverrideXRFrameGetViewerPose(matrixOverridePose.toArray());

document.body.appendChild(renderer.domElement);
//document.body.appendChild(VRButton.createButton(renderer));
let vrButton = new VRButton(renderer);

const controls = new OrbitControls(camera, renderer.domElement);
controls.update();

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.75);
directionalLight.position.set(2, 2, 2);
scene.add(directionalLight);

const light = new THREE.AmbientLight(0x202020); // soft white light
scene.add(light);

let sphereGeo = new THREE.SphereGeometry(0.75, 16, 10);

let scenes = [];

// MATERIAL BALLS SCENE

const z = -8;
scenes[0] = new THREE.Group();
let sphere = new THREE.Mesh(sphereGeo, new THREE.MeshStandardMaterial({color: 0xff2020, roughness: 0.2}));
scenes[0].add(sphere);
sphere.position.x = -4.0;
sphere.position.z = z;

sphere = new THREE.Mesh(sphereGeo, new THREE.MeshStandardMaterial({color: 0xff2020, roughness: 0.2, precision:'mediump'}));
scenes[0].add(sphere);
sphere.position.x = -2.0;
sphere.position.z = z;

sphere = new THREE.Mesh(sphereGeo, new THREE.MeshStandardMaterial({color: 0xff2020, roughness: 0.2, precision:'lowp'}));
scenes[0].add(sphere);
sphere.position.x = 0.0;
sphere.position.z = z;

sphere = new THREE.Mesh(sphereGeo, new THREE.MeshPhongMaterial({color: 0xff2020, shininess: 200.0}));
scenes[0].add(sphere);
sphere.position.x = 2.0;
sphere.position.z = z;

sphere = new THREE.Mesh(sphereGeo, new THREE.MeshLambertMaterial({color: 0xff2020}));
scenes[0].add(sphere);
sphere.position.x = 4.0;
sphere.position.z = z;

// sphere = new THREE.Mesh(sphereGeo, new THREE.MeshBasicMaterial({color: 0xff2020}));
// scenes[0].add(sphere);
// sphere.position.x = 4.0;
// sphere.position.z = -5.0;


// SKY OVERDRAW SCENE
scenes[1] = new THREE.Group();

sphere = new THREE.Mesh(new THREE.SphereGeometry(50.0, 32, 24), new THREE.MeshBasicMaterial({color:0xaaccff, side: THREE.BackSide}));
sphere.renderOrder = 110;
scenes[1].add(sphere);
let ground = new THREE.Mesh(new THREE.PlaneGeometry(125, 125, 10, 10), new THREE.MeshPhongMaterial({color: 0x405020, shininess: 0.0}));
ground.renderOrder = 100;
ground.rotation.x = -1.57;
ground.position.y = -1.0;
scenes[1].add(ground);

let tree = new THREE.Mesh(new THREE.ConeGeometry(1.0, 3.0, 8), new THREE.MeshPhongMaterial({color: 0x103010, flatShading: true, shininess: 10.0}));
let trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.5, 8), new THREE.MeshPhongMaterial({color:0x302000, shininess: 0.0}));
tree.add(trunk);
trunk.position.y = -1.75;

tree.renderOrder = 90;
trunk.renderOrder = 90;

scenes[1].add(tree);
tree.position.x = 2.0;
tree.position.y = 0.95;
tree.position.z = -5.0;

tree = tree.clone();
scenes[1].add(tree);
tree.position.x = -2.0;
tree.position.y = 0.95;
tree.position.z = -6.0;

tree = tree.clone();
scenes[1].add(tree);
tree.position.x = -4.0;
tree.position.y = 0.95;
tree.position.z = -4.0;

tree = tree.clone();
scenes[1].add(tree);
tree.position.x = 3.6;
tree.position.y = 0.95;
tree.position.z = -3.5;



// MATERIAL FILL RATE
scenes[2] = new THREE.Group();
let planeGeo = new THREE.PlaneGeometry(50, 50, 10, 10);
let planeMat = new THREE.MeshStandardMaterial({color: 0x404040, roughness: 0.2, precision:'highp'});
const kMaxIdx = 30;
for (let idx = 0; idx < kMaxIdx; idx++)
{
    let quad = new THREE.Mesh(planeGeo, planeMat);
    scenes[2].add(quad);
    quad.position.z = -3.0 + 0.1 * idx;
    quad.renderOrder = kMaxIdx - idx;
}

/*quad = new THREE.Mesh(new THREE.PlaneGeometry(10, 10, 10, 10), new THREE.MeshStandardMaterial({color: 0x404040, roughness: 0.2, precision:'highp'}));
scenes[2].add(quad);
quad.position.z = -3.1;
quad.renderOrder = 1;

quad = new THREE.Mesh(new THREE.PlaneGeometry(10, 10, 10, 10), new THREE.MeshStandardMaterial({color: 0x404040, roughness: 0.2, precision:'highp'}));
scenes[2].add(quad);
quad.position.z = -3.2;
quad.renderOrder = 2;

quad = new THREE.Mesh(new THREE.PlaneGeometry(10, 10, 10, 10), new THREE.MeshStandardMaterial({color: 0x404040, roughness: 0.2, precision:'highp'}));
scenes[2].add(quad);
quad.position.z = -3.3;
quad.renderOrder = 3;

quad = new THREE.Mesh(new THREE.PlaneGeometry(10, 10, 10, 10), new THREE.MeshStandardMaterial({color: 0x404040, roughness: 0.2, precision:'highp'}));
scenes[2].add(quad);
quad.position.z = -3.4;
quad.renderOrder = 4;
*/



for (let i = 0; i < scenes.length; i++)
{
    scene.add(scenes[i]);
    scenes[i].visible = false;
}
let curScene = 1;
scenes[curScene].visible = true;

// const boxGeometry = new THREE.BoxGeometry();
// const boxMaterials = [new THREE.MeshBasicMaterial({ color: 0xff8020 }), new THREE.MeshBasicMaterial({ color: 0xaaaaaa })];

// let i;
// const kSpread = 30;

// var drawGroups = new Array();
// const groupSize = 10;
// var currentGroup = new THREE.Group();
// var groupCounter = 0;

// for (i = 0; i < kSpread * kSpread; i++) {
//     let cube = new THREE.Mesh(boxGeometry, boxMaterials[i%2]);
//     let row = i % kSpread;
//     let col = Math.floor(i / kSpread);
//     //cube.position.set(-kSpread + row * 2.0, -kSpread + col * 2.0, -2 * kSpread);
//     cube.position.set(-kSpread + row * 2.0, -kSpread + (col + 0.5) * 2.0, -2 * kSpread - 10);
//     cube.rotation.x = 0.707;
//     cube.rotation.y = 0.707;
//     currentGroup.add(cube);
//     groupCounter++;

//     if (groupCounter == groupSize)
//     {
//         scene.add(currentGroup);
//         currentGroup.visible = false;
//         drawGroups.push(currentGroup);
//         currentGroup = new THREE.Group();
//         groupCounter = 0;
//     }
// }
// if (currentGroup.children.length != 0)
// {
//     scene.add(currentGroup);
//     currentGroup.visible = false;
// }

// var firstInvisible = -1;
// initVisibility(42); //(kSpread*kSpread*0.25)/groupSize);
vrButton.checkForXR()
/*
var createGeometry = require('three-bmfont-text')
var loadFont = require('load-bmfont')

var fontGeometry;
var fontMesh;

loadFont('fonts/arial.fnt', function (err, font) {
    // create a geometry of packed bitmap glyphs,
    // word wrapped to 300px and right-aligned
    fontGeometry = createGeometry({
        width: 350,
        align: 'right',
        font: font
    })

    // the texture atlas containing our glyphs
    var texture = new THREE.TextureLoader().load('fonts/arial.png');

    // we can use a simple ThreeJS material
    var fontMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        color: 0xffffff
    });

    // scale and position the mesh to get it doing something reasonable
    fontMesh = new THREE.Mesh(fontGeometry, fontMaterial);
    fontMesh.position.set(0, -0.75, -5);
    fontMesh.scale.set(0.0035, 0.0035, 0.0035);
    fontMesh.rotation.set(3.14, 0, 0);

    camera.add(fontMesh);


    let messageGeo = createGeometry({
        width: 1000,
        align: 'center',
        font: font
    });
    messageGeo.update("Use L and R triggers to increase or decrease the number of objects rendered.")
    let messageMesh = new THREE.Mesh(messageGeo, fontMaterial);
    messageMesh.position.set(-1.85, 2.0, -4);
    messageMesh.scale.set(0.0035, 0.0035, 0.0035);
    messageMesh.rotation.set(3.14, 0.0, 0.0);

    scene.add(messageMesh);
});
*/

function onSelectStart(event)
{
}
function onSelectEnd(event)
{
    let increment = event.data.handedness == "right";
    updateVisibility(increment);
}

function onSqueezeEnd(event)
{
//     let enableSlowPath = event.data.handedness == "left";
//     renderer.useOldRenderObjectsLogic = enableSlowPath;
}

/*
const controllerModelFactory = new XRControllerModelFactory();
const controllerGrip0 = renderer.xr.getControllerGrip(0);
const model0 = controllerModelFactory.createControllerModel( controllerGrip0 );
controllerGrip0.add( model0 );
scene.add( controllerGrip0 );
controllerGrip0.visible = false;
const controllerGrip1 = renderer.xr.getControllerGrip(1);
const model1 = controllerModelFactory.createControllerModel( controllerGrip1 );
controllerGrip1.add( model1 );
scene.add( controllerGrip1 );
controllerGrip0.visible = false;
*/

const controller0 = renderer.xr.getController(0);
controller0.addEventListener('selectstart', onSelectStart);
controller0.addEventListener('selectend', onSelectEnd);
controller0.addEventListener('squeezeend', onSqueezeEnd);
const controller1 = renderer.xr.getController(1);
controller1.addEventListener('selectstart', onSelectStart);
controller1.addEventListener('selectend', onSelectEnd);
controller1.addEventListener('squeezeend', onSqueezeEnd);


document.onkeydown = function(e) {
    switch(e.key)
    {
        case ",":
            updateVisibility(false);
            break;
        case ".":
            updateVisibility(true);
            break;
    }
};

// var endOfLastFrame = 0.0;
// var startOfCurrentFrame = 0.0;
// var averageDelta = 0.0;
// const kFpsSmoothing = 0.10;
// var curMaxDelta = 0.0;
// var expiryMaxDelta = performance.now();
// var curMinHertz = 90.0;
// var expiryMinHertz = performance.now();
// const kMaxPersist = 2000.0;

renderer.setAnimationLoop(
    function () {
        /*
        endOfLastFrame = performance.now();
        let delta = endOfLastFrame - startOfCurrentFrame;
        if (delta > curMaxDelta || endOfLastFrame > expiryMaxDelta) {
            curMaxDelta = delta;
            expiryMaxDelta = endOfLastFrame + kMaxPersist;
        }
        averageDelta = (delta * kFpsSmoothing) + (averageDelta * (1.0 - kFpsSmoothing));
        let hertz = 1000.0 / averageDelta;
        if (hertz < curMinHertz || endOfLastFrame > expiryMinHertz) {
            curMinHertz = hertz;
            expiryMinHertz = endOfLastFrame + kMaxPersist;
        }

        startOfCurrentFrame = performance.now();
        if (fontGeometry) {
            fontGeometry.update(
                (firstInvisible * groupSize) + " objs " +
                delta.toFixed(1) + "(" + curMaxDelta.toFixed(1) + ") ms " +
                (1000.0 / averageDelta).toFixed(0) + "(" + curMinHertz.toFixed(0) + ") Hz");
        }

        */
        renderer.render(scene, camera);
    });

// function initVisibility(numVisible)
// {
//     firstInvisible = 0;
//     for(firstInvisible = 0; firstInvisible < numVisible; firstInvisible++)
//     {
//         if (firstInvisible >= drawGroups.length)
//             break;

//         drawGroups[firstInvisible].visible = true;
//     }
// }

function updateVisibility(increment)
{
    scenes[curScene].visible = false;
    if (increment)
    {
        curScene = (curScene + 1) % scenes.length;
    }
    else
    {
        curScene = (curScene - 1) % scenes.length;
        if (curScene < 0)
            curScene += scenes.length;
    }
    scenes[curScene].visible = true;

}