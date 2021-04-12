import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import {BasisTextureLoader} from 'three/examples/jsm/loaders/BasisTextureLoader.js'

import {TGALoader} from 'three/examples/jsm/loaders/TGALoader.js'

//import * as BASIS from 'three/exmaples/js/libs/basis/basis_transcoder.js'

var inputProfilesList = require( "@webxr-input-profiles/registry/dist/profilesList.json");
// import * as TWEEN from '@tweenjs/tween.js';


import {Glove} from './glove.js';
import {HeavyBag} from './bag.js';
import {DoubleEndedBag} from './doubleEndedBag.js';
import {BoxingSession} from './gamelogic.js';
import {PlayerHud} from './playerHud.js';

import { fetchProfile, MotionController } from '@webxr-input-profiles/motion-controllers';
import { Session } from './gamelogic.js';
import * as HUD from './StatsHud.js';
import {PageUI} from './pageUI.js';

import css from './styles.css';
import { initializeTextBoxSystem } from './textBox.js';

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
let heavyBag  = null;
let doubleEndedBag = null;

let gameLogic = null;

let playerHud = null;

let pmremGenerator = null;
let lightmaps = {};
let aomaps = {};
let basisLoader = null;



let envMapObjects = {}
let hud = null;
let pageUI = null;
initialize();

function initialize()
{
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.01, 30);
    camera.position.z = 0.0;
    camera.position.y = 1.3;
    //camera.rotation.x = -0.17;
    // add camera to scene so that objects attached to the camera get rendered
    scene.add(camera);

    hud = new HUD.StatsHud(camera);

    audioListener = new THREE.AudioListener();
    camera.add( audioListener );

    renderer = new THREE.WebGLRenderer( {antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    //renderer.xr.setFramebufferScaleFactor(1.0) //0.75);
    let color = new THREE.Color(0x000000);
    //color.convertSRGBToLinear();
    renderer.setClearColor(color);
    renderer.physicallyCorrectLights = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    // renderer.shadowMap.enabled = true;
    // renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // renderer.toneMappingExposure = 1.25;

    pageUI = new PageUI(renderer);


    document.body.appendChild(renderer.domElement);

    clock = new THREE.Clock();


    renderer.xr.addEventListener( 'sessionstart', onSessionStart);
    renderer.xr.addEventListener( 'sessionend', onSessionEnd);



    InitBasisLoader();
    //lightmaps['Room'] = LoadLightmapBasis("./content/Lightmaps_V8/", "Room_denoised.basis");

    let lightmapPromises = [];
    if (true)
    {
        lightmapPromises.push(LoadBasisLightmapPromise('Room001', "./content/Lightmaps_V8/Room.001_denoised.basis"));
        lightmapPromises.push(LoadBasisLightmapPromise('Floor', "./content/Lightmaps_V8/Floor_denoised.basis"));
        lightmapPromises.push(LoadBasisLightmapPromise('Ceiling', "./content/Lightmaps_V8/Ceiling_denoised.basis"));
        lightmapPromises.push(LoadBasisLightmapPromise('AccentWall', "./content/Lightmaps_V8/AccentWall_denoised.basis"));
        lightmapPromises.push(LoadBasisLightmapPromise('Baseboard2', "./content/Lightmaps_V8/Baseboard2_denoised.basis"));
        lightmapPromises.push(LoadBasisLightmapPromise('TV', "./content/Lightmaps_V8/TV_denoised.basis"));
        lightmapPromises.push(LoadBasisLightmapPromise('Dumbell', "./content/Lightmaps_V8/Dumbell_denoised.basis"));
        lightmapPromises.push(LoadBasisLightmapPromise('DumbellHandle', "./content/Lightmaps_V8/DumbellHandle_denoised.basis"));
        lightmapPromises.push(LoadBasisLightmapPromise('Shelf', "./content/Lightmaps_V8/Shelf_denoised.basis"));
    }
    else if (true)
    {
        lightmapPromises.push(LoadBasisLightmapPromise('Room001', "./content/Lightmaps_V8/Room.001_baked_dir.basis"));
        lightmapPromises.push(LoadBasisLightmapPromise('Floor', "./content/Lightmaps_V8/Floor_baked_dir.basis"));
        lightmapPromises.push(LoadBasisLightmapPromise('Ceiling', "./content/Lightmaps_V8/Ceiling_baked_dir.basis"));
        lightmapPromises.push(LoadBasisLightmapPromise('AccentWall', "./content/Lightmaps_V8/AccentWall_baked_dir.basis"));
        lightmapPromises.push(LoadBasisLightmapPromise('Baseboard2', "./content/Lightmaps_V8/Baseboard2_baked_dir.basis"));
        lightmapPromises.push(LoadBasisLightmapPromise('TV', "./content/Lightmaps_V8/TV_baked_dir.basis"));
        lightmapPromises.push(LoadBasisLightmapPromise('Dumbell', "./content/Lightmaps_V8/Dumbell_baked_dir.basis"));
        lightmapPromises.push(LoadBasisLightmapPromise('DumbellHandle', "./content/Lightmaps_V8/DumbellHandle_baked_dir.basis"));
        lightmapPromises.push(LoadBasisLightmapPromise('Shelf', "./content/Lightmaps_V8/Shelf_baked_dir.basis"));

        lightmapPromises.push(LoadBasisAoPromise('Room001', "./content/Lightmaps_V8/Room.001_baked_ao.basis"));
        lightmapPromises.push(LoadBasisAoPromise('Floor', "./content/Lightmaps_V8/Floor_baked_ao.basis"));
        lightmapPromises.push(LoadBasisAoPromise('Ceiling', "./content/Lightmaps_V8/Ceiling_baked_ao.basis"));
        lightmapPromises.push(LoadBasisAoPromise('AccentWall', "./content/Lightmaps_V8/AccentWall_baked_ao.basis"));
        lightmapPromises.push(LoadBasisAoPromise('Baseboard2', "./content/Lightmaps_V8/Baseboard2_baked_ao.basis"));
        lightmapPromises.push(LoadBasisAoPromise('TV', "./content/Lightmaps_V8/TV_baked_ao.basis"));
        lightmapPromises.push(LoadBasisAoPromise('Dumbell', "./content/Lightmaps_V8/Dumbell_baked_ao.basis"));
        lightmapPromises.push(LoadBasisAoPromise('DumbellHandle', "./content/Lightmaps_V8/DumbellHandle_baked_ao.basis"));
        lightmapPromises.push(LoadBasisAoPromise('Shelf', "./content/Lightmaps_V8/Shelf_baked_ao.basis"));
    }
    else
    {
        // lightmapPromises.push(LoadLightmapPromise('Room', "./content/Lightmaps_V8/Room_denoised.tga"));
        lightmapPromises.push(LoadLightmapPromise('Room001', "./content/Lightmaps_V8/Room.001_denoised.tga"));
        lightmapPromises.push(LoadLightmapPromise('Floor', "./content/Lightmaps_V8/Floor_denoised.tga"));
        lightmapPromises.push(LoadLightmapPromise('Ceiling', "./content/Lightmaps_V8/Ceiling_denoised.tga"));
        lightmapPromises.push(LoadLightmapPromise('AccentWall', "./content/Lightmaps_V8/AccentWall_denoised.tga"));
        lightmapPromises.push(LoadLightmapPromise('Baseboard2', "./content/Lightmaps_V8/Baseboard2_denoised.tga"));
        lightmapPromises.push(LoadLightmapPromise('TV', "./content/Lightmaps_V8/TV_denoised.tga"));
        lightmapPromises.push(LoadLightmapPromise('Dumbell', "./content/Lightmaps_V8/Dumbell_denoised.tga"));
        lightmapPromises.push(LoadLightmapPromise('DumbellHandle', "./content/Lightmaps_V8/DumbellHandle_denoised.tga"));
        lightmapPromises.push(LoadLightmapPromise('Shelf', "./content/Lightmaps_V8/Shelf_denoised.tga"));
        // lightmapPromises.push(LoadLightmapPromise('ShelfLegs', "./content/Lightmaps_V8/ShelfLegs_denoised.tga"));
        
        
    }
    // lightmapPromises.push(LoadBasisLightmapPromise('Kettlebell', "./content/Lightmaps_V8/Kettlebell_denoised.basis"));
    // lightmapPromises.push(LoadBasisLightmapPromise('Legs', "./content/Lightmaps_V8/Legs_denoised.basis"));
    // lightmapPromises.push(LoadBasisLightmapPromise('Seat', "./content/Lightmaps_V8/Seat_denoised.basis"));

    lightmapPromises.push(LoadEnvMapPromise());


    envMapObjects['Floor'] = { intensity: 0.03, roughness: 0.36};
    envMapObjects['AccentWall'] = { intensity: 0.35, roughness: 0.2};
    envMapObjects['Dumbell'] = { intensity: 0.25, roughness: 0.7};
    envMapObjects['Shelf'] = { intensity: 0.15, roughness: 0.2};
    envMapObjects['DumbellHandle'] = { intensity: 0.55, roughness: 0.1};
    envMapObjects['Baseboard2'] = { intensity: 0.15, roughness: 0.4};
    envMapObjects['TV'] = { intensity: 0.05, roughness: 0.45};
    envMapObjects['Ring'] = { intensity: 0.2, roughness: 0.25};
    envMapObjects['Screen'] = {intensity: 0.3, roughness: 0.82};
    
    
    // envMapObjects['Seat'] = {intensity: 0.5, roughness: 0.3};
    // envMapObjects['Legs'] = {intensity: 0.5, roughness: 0.5};
    // envMapObjects['Kettlebell'] = {intensity: 0.75, roughness: 0.5};
    
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
    loadingManager.addHandler( /\.tga$/i, new TGALoader() );

    // let loaderPromise = new Promise( (resolve) => {
    //     let loader = new GLTFLoader(loadingManager);
    //     loader.load('./content/gym_v8.gltf', resolve);
    // });

    Promise.all(lightmapPromises)
        .then( 
            () => {
                return new Promise( (resolve) => {
                    console.log("LOAD GLTF");
                    let loader = new GLTFLoader(loadingManager);
                    loader.load('./content/gym_v8.gltf', resolve);
                })
            })
        .then(
            (gltf) => {
                // console.log("GLTF is: " + gltf);
                return new Promise(
                    (resolve) => {
                    console.log("DO GLTF FIXUPS")
                    for (let i = 0; i < gltf.scene.children.length; i++)
                    {                
                        let obj = gltf.scene.children[i];       
                        obj.traverse(function (node) {

                            if (false) //node.name == "Room" || node.name == "Ceiling" || node.name == "Screen")
                            {
                                let simpleMat = new THREE.MeshLambertMaterial();
                                simpleMat.color = node.material.color;
                                simpleMat.emissive = node.material.emissive;
                                node.material = simpleMat;
                            }

                            // console.log("NODE: " + node.name);
                            let nodeLightmap = lightmaps[node.name];
                            if (nodeLightmap && node.material && 'lightMap' in node.material) {
                                // console.log("--> LIGHTMAP: " + nodeLightmap.name);
                                node.material.lightMap = nodeLightmap;
                                node.material.lightMapIntensity = 1.0;
                                node.material.needsUpdate = true;
                            }

                            let nodeAomap = aomaps[node.name];
                            if(nodeAomap && node.material && 'aoMap' in node.material) {
                                node.material.aoMap = nodeAomap;
                                node.material.aoMapIntensity = 0.5;
                                node.material.needsUpdate = true;
                            }

                            let emo = envMapObjects[node.name];
                                
                            if (emo)
                            {
                                node.material.envMap = scene.envMap;
                                node.material.envMapIntensity = emo.intensity;
                                node.material.roughness = emo.roughness;
                            }
                        });

                        // console.log("OBJECT: " + obj.name);
                        if (obj.name == "Screen")
                        {
                            console.log
                            obj.material.emissiveIntensity = 0.03;
                            obj.material.color.setRGB(0.86, 0.86, 0.965);
                            let loader = new THREE.TextureLoader();
                            let tvBkgd = loader.load("./content/tv_background2.png");
                            tvBkgd.flipY = false;
                    
                            // obj.material.name = "TVSCREEN";
                            obj.material.map = tvBkgd;
            
                        }
                        else if (obj.name =="Floor")
                        {
                            obj.material.lightMapIntensity = 2.0;
                            obj.material.metalness = 0.5;
                        }
                        else if (obj.name == "AccentWall")
                        {
                            obj.material.lightMapIntensity = 1.5;
                        }
                    }
                    scene.add(gltf.scene);
                    initScene(scene, camera, renderer);
                    console.log("DONE LOADING AND FIXUPS");
                    resolve();
                });
            })
        .then(() =>
            {
                console.log("CHECK FOR XR");
                pageUI.checkForXR(); 
            });





    const controllerModelFactory = new XRControllerModelFactory();
    controllers.push(renderer.xr.getControllerGrip( 0 ));
    // let con0 = renderer.xr.getControllerGrip(0);
    // con0.add(controllerModelFactory.createControllerModel(con0));
    // scene.add(con0);
    scene.add( controllers[0] );
    
    renderer.xr.getControllerGrip(0).addEventListener("connected", (evt) => {
        setupHandForController(0, evt);
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

        setupHandForController(1, evt);
        // console.log("Got Gamepad for Controller 1: " + evt.data.handedness);
        // controllers[1].gamepad = evt.data.gamepad;
        // if (evt.data.handedness == "left")
        // {
        //     leftHand.setController(controllers[1]);
        //     setupHand(leftHand, 1);
        // }
        // else
        // {
        //     rightHand.setController(controllers[0]);
        //     setupHand(rightHand, 2);
        // }

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

function setupHandForController(id, evt)
{
    console.log("Got Gamepad for Controller " + id + ": " + evt.data.handedness );
    controllers[id].gamepad = evt.data.gamepad;
    if (evt.data.handedness == "left")
    {
        console.assert(leftHand.glove);
        leftHand.glove.setController(controllers[id]);
        leftHand.glove.show();
        leftHand.isSetUp = true;
    }
    else
    {
        console.assert(rightHand.glove);
        rightHand.glove.setController(controllers[id]);
        rightHand.glove.show();
        rightHand.isSetUp = true;
    }
}

function render() {

    // hud.update();

    let dt = Math.min(clock.getDelta(), 0.0333); // * 3.0;
    accumulatedTime += dt;
    // renderer.inputManager.update(dt, accumulatedTime);
    // TWEEN.update(accumulatedTime);

    updateHands(dt, accumulatedTime);
    if (gameLogic)
    {
        gameLogic.update(dt, accumulatedTime);
    }
    if(playerHud) 
        playerHud.update(dt);

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
    gameLogic.initialize(pageUI.roundCount, pageUI.roundTime, pageUI.restTime, pageUI.bagType, pageUI.doBagSwap, pageUI.workoutType, pageUI.whichScriptedWorkout);
    gameLogic.start();
}

function onSessionEnd()
{
    //renderer.xr.getSession().removeEventListener('inputsourceschange', onInputSourcesChange);
    gameLogic.pause();
}

function initScene(scene, camera, renderer)
{
    initializeTextBoxSystem();
    
    playerHud = new PlayerHud(camera, audioListener);

    heavyBag = new HeavyBag(audioListener, scene, camera, renderer);
    heavyBag.visible = false;
    doubleEndedBag = new DoubleEndedBag(audioListener, scene, camera, renderer, playerHud);
    doubleEndedBag.visible = false;

    scene.add(heavyBag);
    scene.add(doubleEndedBag);
    
    leftHand.glove = new Glove(scene, 1);
    leftHand.glove.heavyBag = heavyBag;
    leftHand.glove.doubleEndedBag = doubleEndedBag;
    rightHand.glove = new Glove(scene, 2);
    rightHand.glove.heavyBag = heavyBag;
    rightHand.glove.doubleEndedBag = doubleEndedBag;

    heavyBag.setGloves(leftHand.glove, rightHand.glove);
    doubleEndedBag.setGloves(leftHand.glove, rightHand.glove);

    gameLogic = new BoxingSession(scene, audioListener, heavyBag, doubleEndedBag, 3, 120, 20, 0, true);


}

/*
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
}*/

function updateHands(dt, accumulatedTime)
{
    if (leftHand.isSetUp && rightHand.isSetUp)
    {
        // if (leftHand.glove.bag == null || rightHand.glove.bag == null)
        // {
        //     bag.setGloves(leftHand.glove, rightHand.glove);

        //     leftHand.glove.bag = bag;
        //     rightHand.glove.bag = bag;
        // }
        // else
        // {
        leftHand.glove.update(dt, accumulatedTime);
        rightHand.glove.update(dt, accumulatedTime);
        // }
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
            .load( './content/gym_v8_envmap_2.exr',  ( texture ) => {

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
        new TGALoader().load(filepath, (texture) => 
        {
            console.log("LOADED: " + meshName + " -> " + filepath);
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
            texture.encoding = THREE.RGBDEncoding  ;
            lightmaps[meshName] = texture;
            resolve();
        });
    });
}

function LoadBasisAoPromise(meshName, filepath)
{
    return new Promise( (resolve, reject) => {
        basisLoader.load(filepath, (texture) => {
            texture.name = filepath;
            texture.flipY = false;
            texture.encoding = THREE.RGBDEncoding;
            aomaps[meshName] = texture;
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