import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import {BasisTextureLoader} from 'three/examples/jsm/loaders/BasisTextureLoader.js'
//import * as BASIS from 'three/exmaples/js/libs/basis/basis_transcoder.js'

var inputProfilesList = require( "@webxr-input-profiles/registry/dist/profilesList.json");
import * as CANNON from 'cannon-es';
import * as TWEEN from '@tweenjs/tween.js';


import {Glove} from './glove.js';
import {Bag} from './bag.js';
import {BoxingSession, PunchingStats} from './gamelogic.js';



import { fetchProfile, MotionController } from '@webxr-input-profiles/motion-controllers';
import { Fog } from 'three';
import { Session } from './gamelogic.js';
import * as HUD from './StatsHud.js';
import {PageUI} from './pageUI.js';

import css from './styles.css';

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

let pmremGenerator = null;
let lightmaps = {};
let basisLoader = null;



let envMapObjects = {}
let hud = null;
let pageUI = null;

initialize();

function initialize()
{
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 30);
    camera.position.z = 5.0;
    camera.position.y = 2.0;
    //camera.rotation.x = -0.17;
    // add camera to scene so that objects attached to the camera get rendered
    scene.add(camera);

    hud = new HUD.StatsHud(camera);

    audioListener = new THREE.AudioListener();
    camera.add( audioListener );

    renderer = new THREE.WebGLRenderer( {antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    renderer.xr.setFramebufferScaleFactor(0.75);
    let color = new THREE.Color(0x000000);
    //color.convertSRGBToLinear();
    renderer.setClearColor(color);
    renderer.physicallyCorrectLights = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    // renderer.shadowMap.enabled = true;
    // renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    pageUI = new PageUI(renderer);


    document.body.appendChild(renderer.domElement);



    // let button = VRButton.createButton(renderer);
    // document.body.appendChild(button);

    // let para = document.createElement( 'p' );
    // para.innerHTML = "TESTING 123";
    // para.style.position = 'absolute';
    // para.style.bottom = "40px";
    // para.style.color = "#FF00FF";

    // document.body.appendChild(para);



    clock = new THREE.Clock();


    renderer.xr.addEventListener( 'sessionstart', onSessionStart);
    renderer.xr.addEventListener( 'sessionend', onSessionEnd);



    InitBasisLoader();
    //lightmaps['Room'] = LoadLightmapBasis("./content/Lightmaps_V8/", "Room_denoised.basis");

    let lightmapPromises = [];
    lightmapPromises.push(LoadBasisLightmapPromise('Room', "./content/Lightmaps_V8/Room_denoised.basis"));

    lightmapPromises.push(LoadBasisLightmapPromise('Floor', "./content/Lightmaps_V8/Floor_denoised.basis"));

    lightmapPromises.push(LoadBasisLightmapPromise('Ceiling', "./content/Lightmaps_V8/Ceiling_denoised.basis"));

    lightmapPromises.push(LoadBasisLightmapPromise('AccentWall', "./content/Lightmaps_V8/AccentWall_denoised.basis"));

    lightmapPromises.push(LoadBasisLightmapPromise('Baseboard', "./content/Lightmaps_V8/Baseboard_denoised.basis"));

    lightmapPromises.push(LoadBasisLightmapPromise('TV', "./content/Lightmaps_V8/TV_denoised.basis"));

    lightmapPromises.push(LoadEnvMapPromise());


    envMapObjects['Floor'] = { intensity: 0.2, roughness: 0.35};
    envMapObjects['AccentWall'] = { intensity: 0.5, roughness: 0.2};
    
    // What do I want to have happen for loading?
    // Load enviornment map
    // Load lightmaps
    // Load environment and apply lightmaps and envmap
    // Load bag and apply envmap
    // Load gloves
    // all done loading
    // post-load fixups

    
    const loadingManager = new THREE.LoadingManager();
    loadingManager.addHandler(/\.basis$/i, basisLoader);

    let loaderPromise = new Promise( (resolve) => {
        let loader = new GLTFLoader(loadingManager);
        loader.load('./content/gym_v8.gltf', resolve);
    });

    Promise.all(lightmapPromises).then(
        () => {
        loaderPromise.then(
            (gltf) => {

                for (let i = 0; i < gltf.scene.children.length; i++)
                {                
                    let obj = gltf.scene.children[i];       
                    obj.traverse(function (node) {

                        //console.log("NODE: " + node.name);
                        let nodeLightmap = lightmaps[node.name];
                        if (node.material && nodeLightmap && 'lightMap' in node.material) {
                            //console.log("--> LIGHTMAP: " + nodeLightmap.name);
                            node.material.lightMap = nodeLightmap;
                            node.material.lightMapIntensity = 1.0;
                            node.material.needsUpdate = true;
                        }

                        let emo = envMapObjects[node.name];
                            
                        if (emo)
                        {
                            //console.log("Setting EM on " + node.name);

                            node.material.envMap = scene.envMap;
                            node.material.envMapIntensity = emo.intensity;
                            node.material.roughness = emo.roughness;
                        }
                    });

                    if (obj.name == "Screen")
                    {
                        obj.material.emissiveIntensity = 1.25;
                    }
                }
                scene.add(gltf.scene);
                initScene(scene, camera, renderer);

            });
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
            if (leftHand.glove != null)
            {
                leftHand.glove.hide();
            }
            leftHand.controller = null;
            leftHand.isSetUp = false;
        }
        else
        {
            if (rightHand.glove != null)
            {
                rightHand.glove.hide();
            }
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

        if (evt.data.handedness == "left")
        {
            if (leftHand.glove != null)
            {
                leftHand.glove.hide();
            }
            leftHand.controller = null;
            leftHand.isSetUp = false;
        }
        else
        {
            if (rightHand.glove != null)
            {
                rightHand.glove.hide();
            }
            rightHand.controller = null;
            rightHand.isSetUp = false;
        }
    });


    renderer.setAnimationLoop(render); 
}

function render() {

    // hud.update();

    let dt = Math.min(clock.getDelta(), 0.0333);
    accumulatedTime += dt;
    // renderer.inputManager.update(dt, accumulatedTime);
    TWEEN.update(accumulatedTime);

    updateHands(dt, accumulatedTime);
    if (bag && gameLogic && punchingStats)
    {
        bag.update(dt, accumulatedTime);
        gameLogic.update(dt, accumulatedTime);
        punchingStats.update(dt, accumulatedTime);
    }

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
    gameLogic.initialize(pageUI.roundCount, pageUI.roundTime, pageUI.restTime);
    gameLogic.start();
}

function onSessionEnd()
{
    //renderer.xr.getSession().removeEventListener('inputsourceschange', onInputSourcesChange);
}

function initScene(scene, camera, renderer)
{
    bag = new Bag(audioListener, scene, camera, renderer);
    scene.add(bag);

    gameLogic = new BoxingSession(scene, audioListener, 3, 120, 20);
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


    if (hand.glove)
    {
        hand.glove.show();
    }
    else
    {
        hand.glove = new Glove(hand.controller, scene, whichHand);
    }
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

function LoadEnvMapPromise()
{
    pmremGenerator = new THREE.PMREMGenerator( renderer );
    pmremGenerator.compileEquirectangularShader();

    // THREE.DefaultLoadingManager.onLoad = function ( ) {

    //     this.pmremGenerator.dispose();
    //     this.pmremGenerator = null;

    // };

    return new Promise( (resolve, reject) => {
        
        new EXRLoader()
            .setDataType( THREE.HalfFloatType )
            .load( './content/gym_v8_envmap.exr',  ( texture ) => {

                let exrCubeRenderTarget = pmremGenerator.fromEquirectangular( texture );
                scene.envMap = exrCubeRenderTarget.texture;

                resolve();

            } );
        });
}


function InitBasisLoader()
{
    basisLoader = new BasisTextureLoader();
    basisLoader.setTranscoderPath( './basis/' );
    basisLoader.detectSupport( renderer );
}

function LoadLightmapPromise(meshName, filepath)
{
    return new Promise( (resolve, reject) => {
        new THREE.TextureLoader().load(filepath, (texture) => 
        {
            texture.name = filepath;
            texture.flipY = false;
            texture.encoding = THREE.RGBDEncoding;
            lightmaps[meshName] = texture;
            resolve();
        });
    });
}



function LoadBasisLightmapPromise(meshName, filepath)
{
    return new Promise( (resolve, reject) => {
        basisLoader.load(filepath, (texture) => {
            texture.name = filepath;
            texture.flipY = false;
            texture.encoding = THREE.RGBDEncoding;
            lightmaps[meshName] = texture;
            resolve();
        });
    });
}

export function OnStartButton()
{
    
    const sessionInit = { optionalFeatures: [ 
        'local-floor', 
        'bounded-floor', 
        'hand-tracking'
    ]};
    navigator.xr.requestSession( 'immersive-vr', sessionInit ).then( (session) => {
        renderer.xr.setSession(session);
    });
}