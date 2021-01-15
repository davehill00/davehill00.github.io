import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

var inputProfilesList = require( "@webxr-input-profiles/registry/dist/profilesList.json");
import * as CANNON from 'cannon-es';
import * as TWEEN from '@tweenjs/tween.js';

import {FistTarget} from './fistTarget.js';
import {Glove} from './glove.js';
import {Bag} from './bag.js';
import {BoxingSession, PunchingStats} from './gamelogic.js';



import { fetchProfile, MotionController } from '@webxr-input-profiles/motion-controllers';
import { Fog } from 'three';
import { Session } from './gamelogic.js';

const uri = './profiles/';
const motionControllers = {};
let controllers=[];

let scene = null;
let camera = null;
let renderer = null;
let clock = null;
let accumulatedTime = 0.0;

let leftHand = {};
let rightHand = {};

let audioListener = null;
let bag = null;

let gameLogic = null;
let punchingStats = null;

initialize();

function initialize()
{
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 5.0;
    camera.position.y = 2.0;
    // add camera to scene so that objects attached to the camera get rendered
    scene.add(camera);

    audioListener = new THREE.AudioListener();
    camera.add( audioListener );

    renderer = new THREE.WebGLRenderer( {antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    renderer.xr.setFramebufferScaleFactor(0.75);
    let color = new THREE.Color(0x808080);
    color.convertSRGBToLinear();
    renderer.setClearColor(color);
    renderer.physicallyCorrectLights = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    document.body.appendChild(renderer.domElement);
    let button = VRButton.createButton(renderer);
    document.body.appendChild(button);

    clock = new THREE.Clock();


    renderer.xr.addEventListener( 'sessionstart', onSessionStart);
    renderer.xr.addEventListener( 'sessionend', onSessionEnd);



    // const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    // directionalLight.color.convertSRGBToLinear();
    // setDirectionalLightPositionFromBlenderQuaternion(directionalLight, 0.923, 0.320, 0.060, -0.205);
    // //directionalLight.position.set(0.0, 10.0, 0.0);
    // scene.add(directionalLight);




    let pointLight = new THREE.PointLight(0xffeedd, 12.0, 12.0);
    pointLight.position.set(3.0, 3.0, 1.0);

    const kSize = 5;

    pointLight.castShadow = false;
    pointLight.shadow.mapSize.width = 1024; // default
    pointLight.shadow.mapSize.height = 1024; // default
    pointLight.shadow.camera.near = 0.5; // default
    pointLight.shadow.camera.far = 100; // default
    pointLight.shadow.camera.left = -kSize;
    pointLight.shadow.camera.right = kSize;
    pointLight.shadow.camera.top = kSize;
    pointLight.shadow.camera.bottom = -kSize;
    pointLight.shadow.bias = -0.00055;

    scene.add(pointLight);

    pointLight = new THREE.PointLight(0xffeedd, 12.0, 12.0);
    pointLight.position.set(-3.0, 3.0, 1.0);

    pointLight.castShadow = false;
    pointLight.shadow.mapSize.width = 1024; // default
    pointLight.shadow.mapSize.height = 1024; // default
    pointLight.shadow.camera.near = 0.5; // default
    pointLight.shadow.camera.far = 100; // default
    pointLight.shadow.camera.left = -kSize;
    pointLight.shadow.camera.right = kSize;
    pointLight.shadow.camera.top = kSize;
    pointLight.shadow.camera.bottom = -kSize;
    pointLight.shadow.bias = -0.00055;

    scene.add(pointLight);


    const ambient = new THREE.AmbientLight(0xffffff, 0.75);
    ambient.color.convertSRGBToLinear();
    scene.add(ambient);

   
    let loaderPromise = new Promise( resolve => {
        let loader = new GLTFLoader();
        loader.load('./content/simple_room.gltf', resolve);
    });
    loaderPromise.then(
        gltf => {
            for (let i = 0; i < gltf.scene.children.length; i++)
            {
                let obj = gltf.scene.children[i];
                obj.receiveShadow = true;
            }
            scene.add(gltf.scene);
        });

    



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
        if (evt.data.handedness == "left")
        {
            leftHand.glove = null;
            leftHand.controller = null;
            leftHand.isSetUp = false;
        }
        else
        {
            rightHand.glove = null;
            rightHand.controller = null;
            rightHand.isSetUp = false;
        }
        
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

function render() {
    let dt = Math.min(clock.getDelta(), 0.0333);
    accumulatedTime += dt;
    // renderer.inputManager.update(dt, accumulatedTime);
    TWEEN.update(accumulatedTime);

    updateHands(dt, accumulatedTime);
    bag.update(dt, accumulatedTime);

    gameLogic.update(dt, accumulatedTime);
    punchingStats.update(dt, accumulatedTime);

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
    gameLogic.start();
}

function onSessionEnd()
{
    //renderer.xr.getSession().removeEventListener('inputsourceschange', onInputSourcesChange);
}

function initScene(scene)
{
    bag = new Bag(audioListener);
    scene.add(bag);

    gameLogic = new BoxingSession(scene, 3, 120, 20);
    punchingStats = new PunchingStats(scene, bag);
}


function setupHand(hand, whichHand)
{
    if (false) 
    {
        hand.mesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.2, 0.15),
            new THREE.MeshStandardMaterial(
                {
                    color: 0x552010,
                    roughness: 0.7,
                    metalness: 0.1
                    // wireframe: true
                }
            )
        );

        hand.mesh.material.color.convertSRGBToLinear();

        hand.mesh.rotation.set(0.45, 0.0, 0.0);
        //hand.mesh.position.x = 0.05;
        hand.controller.add(hand.mesh);
    }
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
        if (leftHand.glove.bag == null || rightHand.glove.bag == null)
        {
            bag.setGloves(leftHand.glove, rightHand.glove);

            leftHand.glove.bag = bag;
            rightHand.glove.bag = bag;
        }
        else
        {
            leftHand.glove.update(dt, accumulatedTime);
            rightHand.glove.update(dt, accumulatedTime);
        }
    }
}

