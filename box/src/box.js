import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';


var inputProfilesList = require( "@webxr-input-profiles/registry/dist/profilesList.json");
import * as CANNON from 'cannon-es';
import * as TWEEN from '@tweenjs/tween.js';

import {FistTarget} from './fistTarget.js';
import {Glove} from './glove.js';
import {Bag} from './bag.js';


import { fetchProfile, MotionController } from '@webxr-input-profiles/motion-controllers';
import { Fog } from 'three';

const uri = './profiles/';
const motionControllers = {};
let controllers=[];

let scene = null;
let camera = null;
let renderer = null;
let clock = null;
let accumulatedTime = 0.0;
let bag = null;

let leftHand = {};
let rightHand = {};

let audioListener = null;

initialize();

function initialize()
{
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 10.0;
    camera.position.y = 2.0;
    // add camera to scene so that objects attached to the camera get rendered
    scene.add(camera);

    audioListener = new THREE.AudioListener();
    camera.add( audioListener );

    renderer = new THREE.WebGLRenderer( {antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    let color = new THREE.Color(0x808080);
    color.convertSRGBToLinear();
    renderer.setClearColor(color);
    renderer.physicallyCorrectLights = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    // renderer.shadowMap.enabled = true;
    // renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    document.body.appendChild(renderer.domElement);
    let button = VRButton.createButton(renderer);
    document.body.appendChild(button);

    clock = new THREE.Clock();


    renderer.xr.addEventListener( 'sessionstart', onSessionStart);
    renderer.xr.addEventListener( 'sessionend', onSessionEnd);



    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
    directionalLight.color.convertSRGBToLinear();
    setDirectionalLightPositionFromBlenderQuaternion(directionalLight, 0.923, 0.320, 0.060, -0.205);
    scene.add(directionalLight);

    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    ambient.color.convertSRGBToLinear();
    scene.add(ambient);


    let groundMesh = new THREE.Mesh(
        new THREE.BoxGeometry(4.0, 0.1, 4.0), 
        new THREE.MeshStandardMaterial( {color: 0x303030, roughness: 0.7}));
    scene.add(groundMesh);
  

    const controllerModelFactory = new XRControllerModelFactory();
    controllers.push(renderer.xr.getControllerGrip( 0 ));
    // let con0 = renderer.xr.getControllerGrip(0);
    // con0.add(controllerModelFactory.createControllerModel(con0));
    // scene.add(con0);
    scene.add( controllers[0] );
    
    renderer.xr.getControllerGrip(0).addEventListener("connected", (evt) => {
        console.log("Got Gamepad for Controller 0: " + evt.data.handedness );
        controllers[0].gamepad = evt.data.gamepad;
        if (evt.data.handedness == "left")
        {
            leftHand.controller = controllers[0];
            setupHand(leftHand, 1);
        }
        else
        {
            rightHand.controller = controllers[0];
            setupHand(rightHand, 2);
        }
    });
    renderer.xr.getControllerGrip(0).addEventListener("disconnected", (evt) => {
        console.log("Lost Gamepad for Controller 0");
        controllers[0].gamepad = null;
        
    });

    controllers.push(renderer.xr.getControllerGrip( 1 ));
    scene.add( controllers[1] );
    // let con1 = renderer.xr.getControllerGrip(1);
    // con1.add(controllerModelFactory.createControllerModel(con1));
    // scene.add(con1);
    //controllers[1].add(controllerModelFactory.createControllerModel(controllers[1]));
   
    renderer.xr.getControllerGrip(1).addEventListener("connected", (evt) => {
        console.log("Got Gamepad for Controller 1: " + evt.data.handedness);
        controllers[1].gamepad = evt.data.gamepad;
        if (evt.data.handedness == "left")
        {
            leftHand.controller = controllers[1];
            setupHand(leftHand, 1);
        }
        else
        {
            rightHand.controller = controllers[1];
            setupHand(rightHand, 2);
        }

    });
    renderer.xr.getControllerGrip(1).addEventListener("disconnected", (evt) => {
        console.log("Lost Gamepad for Controller 1");
        controllers[1].gamepad = null;
    });

    initScene(scene);

    renderer.setAnimationLoop(render); 
}

const kPhysTimeStep = 1.0/240.0;
let _leftHandWorldPos = new THREE.Vector3();
let _rightHandWorldPos = new THREE.Vector3();

function render() {
    let dt = Math.min(clock.getDelta(), 0.0333);
    accumulatedTime += dt;
    // renderer.inputManager.update(dt, accumulatedTime);
    TWEEN.update(accumulatedTime);


    if (leftHand.isSetUp)
    {
        leftHand.mesh.getWorldPosition(_leftHandWorldPos);
    }
    if (rightHand.isSetUp)
    {
        rightHand.mesh.getWorldPosition(_rightHandWorldPos);
    }

    updateHands(dt, accumulatedTime);
    renderer.render(scene, camera);
}

export function setDirectionalLightPositionFromBlenderQuaternion(light, bQuatW, bQuatX, bQuatY, bQuatZ)
{
    const quaternion = new THREE.Quaternion(bQuatX, bQuatZ, -bQuatY, bQuatW);
    light.position.set(0.0, 20.0, 0.0);
    light.position.applyQuaternion(quaternion);
}

function onSessionStart()
{
    //renderer.xr.getSession().addEventListener('inputsourceschange', onInputSourcesChange);
}

function onSessionEnd()
{
    //renderer.xr.getSession().removeEventListener('inputsourceschange', onInputSourcesChange);
}

function initScene(scene)
{
}


function setupHand(hand, whichHand)
{
    hand.mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.2, 0.15), 
        new THREE.MeshStandardMaterial(
            {
                color: 0x802020,
                // wireframe: true
            }
        )
    );
    hand.mesh.rotation.set(0.45, 0.0, 0.0);
    //hand.mesh.position.x = 0.05;
    hand.controller.add(hand.mesh);
    hand.which = whichHand;

    hand.lastWorldPos = new THREE.Vector3();
    //@TODO - compute last world pos to initialize properly

    hand.glove = new Glove(hand.controller, scene, whichHand);


    hand.isSetUp = true;
}

function updateHands(dt, accumulatedTime)
{
    if (leftHand.isSetUp && rightHand.isSetUp)
    {
        if (bag == null)
        {
            bag = new Bag(leftHand.glove, rightHand.glove, audioListener);
            scene.add(bag);

            leftHand.glove.bag = bag;
            rightHand.glove.bag = bag;
        }
        else
        {
            leftHand.glove.update(dt);
            rightHand.glove.update(dt);
            bag.update(dt, accumulatedTime);
        }
    }
}

