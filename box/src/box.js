import * as THREE from 'three';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import {BasisTextureLoader} from 'three/examples/jsm/loaders/BasisTextureLoader.js'
import {TGALoader} from 'three/examples/jsm/loaders/TGALoader.js'
import {OverrideXRFrameGetViewerPose} from "./overrideXRFrameGetViewerPose.js";
import {HTMLMesh} from 'three/examples/jsm/interactive/HTMLMesh.js'



//import * as BASIS from 'three/exmaples/js/libs/basis/basis_transcoder.js'

var inputProfilesList = require( "@webxr-input-profiles/registry/dist/profilesList.json");
// import * as TWEEN from '@tweenjs/tween.js';


import {Glove} from './glove.js';
import {HeavyBag} from './bag.js';
import {DoubleEndedBag} from './doubleEndedBag.js';
import {BoxingSession} from './gamelogic.js';
import {PlayerHud} from './playerHud.js';
import { Controllers} from './controllers.js';

import { fetchProfile, MotionController } from '@webxr-input-profiles/motion-controllers';
import { Session } from './gamelogic.js';
import * as HUD from './StatsHud.js';
import {PageUI} from './pageUI.js';

import css from './styles.css';
import { initializeTextBoxSystem } from './textBox.js';
import { MainMenu } from './menu.js';

const uri = './profiles/';
const motionControllers = {};
let controllers=[];

let scene = null;
let camera = null;
let renderer = null;
let quadCamera = null;
let quadScene = null;
let quadScreen = null;
let threeQuadLayer = null;

let quadPng = null;

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
let clearColorBlack = new THREE.Color(0x000000);
let clearColorQuadScene = new THREE.Color(0x808080);
let menu = null;

const blackoutMaterial = new THREE.MeshBasicMaterial(
    {
        color:0x000000, 
        opacity:0.0, 
        transparent:true,
        depthTest: false,
        fog: false
    }
);
const blackoutQuad = new THREE.Mesh(
    new THREE.PlaneGeometry(1000.0, 1000.0, 1, 1),
    blackoutMaterial);
blackoutQuad.position.z = -0.1;
let bDoBlackoutFade = false;
let blackoutFadeTimer = 0.0;
let kBlackoutFadeInTime = 0.5;


export let gControllers = null;

let matrixOverridePose = new THREE.Matrix4().compose(
    new THREE.Vector3(0,1.6,0), new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.707, 0, 0)), new THREE.Vector3(1,1,1));

// OverrideXRFrameGetViewerPose(matrixOverridePose.toArray()); // Enable this to hard-code the viewpoint for consistent performance testing

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
    // renderer.setOpaqueSort(opaqueSort);
    renderer.xr.enabled = true;
    renderer.xr.setFramebufferScaleFactor(1.0);


    let qH = 0.52;
    let qW = 0.52 * 16/10;
    quadCamera = new THREE.OrthographicCamera(-qW, qW, qH, -qH, 0.01, 100)
    quadCamera.position.z = 3;

    quadScene = new THREE.Scene();
    // quadScene.add(new THREE.DirectionalLight(0x808080, 3.0));
    // quadScene.add(new THREE.HemisphereLight(0xeeeeff, 0xaa9944, 0.2));
    quadScene.add(quadCamera);

  
    


    //color.convertSRGBToLinear();
    renderer.setClearColor(clearColorBlack);
 
    renderer.physicallyCorrectLights = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    // renderer.shadowMap.enabled = true;
    // renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // renderer.toneMappingExposure = 1.25;

    renderer.domElement.setAttribute("data-html2canvas-ignore", "true");
    document.body.appendChild(renderer.domElement);
    // document.body.appendChild(quadRenderer.domElement);
    pageUI = new PageUI(renderer);
    // pageUI.checkForXR();


    // document.body.appendChild(renderer.domElement);

    clock = new THREE.Clock();


    renderer.xr.addEventListener( 'sessionstart', onSessionStart);
    renderer.xr.addEventListener( 'sessionend', onSessionEnd);

    InitBasisLoader();

    let emp = LoadEnvMapPromise();
    emp.then(pageUI.checkForXR());
    
    gControllers = new Controllers(scene, renderer);

    initGlovesAndBag(scene, camera, renderer);
    menu = new MainMenu(scene, pageUI);
}

function setupHandForController(hand, controllerSpace, gamepad)
{
    console.assert(hand.glove);
    hand.glove.setController(controllerSpace, gamepad);
    hand.glove.hide();
    hand.isSetUp = true;

    // console.log("Got Gamepad for Controller " + id + ": " + evt.data.handedness );
    // controllers[id].gamepad = evt.data.gamepad;
    // if (evt.data.handedness == "left")
    // {
    //     console.assert(leftHand.glove);
    //     leftHand.glove.setController(gripSpace, gamepad); //controllers[id]);
    //     leftHand.glove.show();
    //     leftHand.isSetUp = true;
    // }
    // else
    // {
    //     console.assert(rightHand.glove);
    //     rightHand.glove.setController(controllers[id]);
    //     rightHand.glove.show();
    //     rightHand.isSetUp = true;
    // }
}

function wrapupHandForController(hand)
{
    hand.isSetUp = false;
    hand.controller = null;
    hand.gamepad = null;
}

function loadLevelAssets(addLoadingScreenDelay)
{
    let lightmapPromises = [];
    if (true)
    {
        if (addLoadingScreenDelay)
        {
            lightmapPromises.push(new Promise(resolve => setTimeout(resolve, 1200)));
        }

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
    // lightmapPromises.push(LoadEnvMapPromise());


    envMapObjects['Floor'] = { intensity: 0.03, roughness: 0.36};
    envMapObjects['AccentWall'] = { intensity: 0.35, roughness: 0.2};
    envMapObjects['Dumbell'] = { intensity: 0.25, roughness: 0.7};
    envMapObjects['Shelf'] = { intensity: 0.15, roughness: 0.2};
    envMapObjects['DumbellHandle'] = { intensity: 0.55, roughness: 0.1};
    envMapObjects['Baseboard2'] = { intensity: 0.15, roughness: 0.4};
    envMapObjects['TV'] = { intensity: 0.05, roughness: 0.45};
    envMapObjects['Ring'] = { intensity: 0.2, roughness: 0.25};
    envMapObjects['Screen'] = {intensity: 0.3, roughness: 0.82};
    
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

    Promise.all(lightmapPromises)
        
        .then( 
            () => {
                return new Promise( (resolve) => {
                    //console.log("LOAD GLTF");
                    let loader = new GLTFLoader(loadingManager);
                    loader.load('./content/gym_v8.gltf', resolve);
                })
            })
        .then(
            (gltf) => {
                console.log("GLTF is: " + gltf);
                return new Promise(
                    (resolve) => {
                    console.log("DO GLTF FIXUPS")
                    for (let i = 0; i < gltf.scene.children.length; i++)
                    {                
                        let obj = gltf.scene.children[i];
                        
                        // obj.renderOrder = 10; //render after gloves and bag

                        obj.traverse(function (node) {

                            node.renderOrder = 10;
                            if (false) //node.name == "Room" || node.name == "Ceiling" || node.name == "Screen")
                            {
                                let simpleMat = new THREE.MeshLambertMaterial();
                                simpleMat.color = node.material.color;
                                simpleMat.emissive = node.material.emissive;
                                node.material = simpleMat;
                            }

                            console.log("NODE: " + node.name);
                            let nodeLightmap = lightmaps[node.name];
                            if (nodeLightmap && node.material && 'lightMap' in node.material) {
                                console.log("--> LIGHTMAP: " + nodeLightmap.name);
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

                            if (node.material)
                            {
                                node.material.precision = 'mediump';
                                node.material.needsUpdate = true;
                            }
                        });

                        console.log("OBJECT: " + obj.name);
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

                // hide loading screen and start rendering the main scene?

                //console.log("CHECK FOR XR");
                // pageUI.checkForXR(); 
                doPostLoadGameInitialization();
            });


}



let adjustFramerate = false;
let bPause = false;
let lastTime = null;
let refreshRates = [60.0, 72.0, 90.0];
let targetRefreshRateIdx = refreshRates.length-1;
const kMaxFrameTimeWiggleRoom = 0.01; //0.3;
let targetMaxFrameTimeMs = computeTargetMaxFrameTimeMs(); //1.0/refreshRates[targetRefreshRateIdx] * 1000.0; //90.0;

// let desiredRefreshRate = 1.0/90.0;

function computeTargetMaxFrameTimeMs()
{
    return ((1.0/refreshRates[targetRefreshRateIdx]) * 1000.0) * (1.0 + kMaxFrameTimeWiggleRoom); // + kMaxFrameTimeWiggleRoom;
}

let slowFrameCountCooldown = 0.0;
let slowFrameCount = 0;

function adjustTargetFrameRate(indexDelta)
{
    let session = renderer.xr.getSession();
    if (session)
    {
        targetRefreshRateIdx = Math.max(0, Math.min(targetRefreshRateIdx + indexDelta, refreshRates.length-1));
        session.updateTargetFrameRate(refreshRates[targetRefreshRateIdx]);

        console.log("SETTING NEW TARGET FRAMERATE TO: " + refreshRates[targetRefreshRateIdx] );

        targetMaxFrameTimeMs = computeTargetMaxFrameTimeMs();
        adjustFramerate = true;
        slowFrameCount = Math.max(slowFrameCount - 50, 0);
    }
}

function onFrameRateChange(evt)
{
    console.log("framerate change: " + evt);
}


function render(time, frame) {


    let frameMs;
    if (lastTime !== null)
    {
        frameMs = time - lastTime;
    }
    else
    {
        frameMs = 16.0;
    }
    lastTime = time;

    if (adjustFramerate && !bPause)
    {
        if (frameMs > targetMaxFrameTimeMs * 1.5)
        {
            // We're running slow
            // console.log("RUNNING SLOWER THAN " + refreshRates[targetRefreshRateIdx] + " Hz (" + frameMs + " ms, " + (1000.0/frameMs).toFixed(1) + " Hz)");
            slowFrameCount++;

            slowFrameCountCooldown = time + 250.0;

            if (slowFrameCount > 100)
            {
                // desiredRefreshRate
                if (targetRefreshRateIdx > 0)
                {
                    adjustTargetFrameRate(-1);
                    /*
                    targetRefreshRateIdx--;
                    targetMaxFrameTimeMs = computeTargetMaxFrameTimeMs(); //1.0/refreshRates[targetRefreshRateIdx] * 1000.0;
                    slowFrameCount -= 50; // give us a bit of breathing room to see if we can recover
                    console.log("DROPPING TARGET RATE TO " + refreshRates[targetRefreshRateIdx] + " Hz (" + targetMaxFrameTimeMs + " ms)");
                    */
                }
            }
        }
        else if (time > slowFrameCountCooldown)
        {
            // if (slowFrameCount > 0)
            // {
            //     console.log("MEETING FRAMERATE - SLOW FRAMES: " + slowFrameCount);
            // }
            slowFrameCount = Math.max(slowFrameCount - 1, 0);        
        }
    }


    // hud.update();

    let dt = frameMs * 0.001;
    
    if (false && bPause)
    {
        dt = 0.0;
    }

    // let dt = Math.min(clock.getDelta(), 0.0333); // * 3.0;
    accumulatedTime += dt;
    // renderer.inputManager.update(dt, accumulatedTime);
    // TWEEN.update(accumulatedTime);

    if (bDoBlackoutFade)
    {
        blackoutFadeTimer += dt;
        if (blackoutFadeTimer < kBlackoutFadeInTime)
        {
            blackoutMaterial.opacity = 1.0 - blackoutFadeTimer / kBlackoutFadeInTime;
        }
        else
        {
            // all done
            scene.remove(blackoutQuad);
        }
    }



    updateHands(dt, accumulatedTime);
    if (gameLogic)
    {
        gameLogic.update(dt, accumulatedTime);
    }
    if(playerHud) 
        playerHud.update(dt);

    renderer.render(scene, camera);

    let session = renderer.xr.getSession();
    if (session)
    {
        if ((threeQuadLayer && quadScreen && (bDoBlackoutFade || quadScreen.needsRenderUpdate || (pageUI.layersPolyfill && pageUI.layersPolyfill.injected))))
        {
            quadScreen.needsRenderUpdate = false;

            let renderProps = renderer.properties.get(threeQuadLayer.renderTarget);
            renderProps.__ignoreDepthValues = false;

            
            // set viewport, rendertarget, and renderTargetTextures
            threeQuadLayer.setupToRender(renderer, frame);
            
            renderer.xr.enabled = false;
            renderer.setClearColor(clearColorQuadScene, 1.0);
            renderer.render(quadScene, quadCamera);
            renderer.setClearColor(clearColorBlack, 0.0);
            renderer.xr.enabled = true;
        }
        else
        {
            // console.log("skip render")
        }
    }
}

export function setDirectionalLightPositionFromBlenderQuaternion(light, bQuatW, bQuatX, bQuatY, bQuatZ)
{
    const quaternion = new THREE.Quaternion(bQuatX, bQuatZ, -bQuatY, bQuatW);
    light.position.set(0.0, 20.0, 0.0);
    light.position.applyQuaternion(quaternion);
}

function onSessionStart()
{

    let loadingScreen = false;
    if (pageUI.layersPolyfill && !pageUI.layersPolyfill.injected) //!pageUI.layersPolyfill || !pageUI.layersPolyfill.injected) 
    {
        loadingScreen = true;
        setupLoadingScreen();
    }


    // initGlovesAndBag(scene, camera, renderer);

    
    loadLevelAssets(loadingScreen);

    //renderer.xr.getSession().addEventListener('inputsourceschange', onInputSourcesChange);
    // gameLogic.initialize(pageUI.roundCount, pageUI.roundTime, pageUI.restTime, pageUI.bagType, pageUI.doBagSwap, pageUI.workoutType, pageUI.whichScriptedWorkout);
    // gameLogic.start();

    let session = renderer.xr.getSession();
    if (session.supportedFrameRates)
    {
        console.log("SUPPORTED FRAMERATES: " + session.supportedFrameRates);
        refreshRates = session.supportedFrameRates;
        targetRefreshRateIdx = refreshRates.length-1;
        while (refreshRates[targetRefreshRateIdx] > 90)
        {
            targetRefreshRateIdx--;
        }
        session.addEventListener("ontargetframeratechange", onFrameRateChange);
        adjustTargetFrameRate(0);
    }

    if (renderer.xr.setFoveation)
    {
        console.log("SETTING FOVEATION ON XR OBJECT");
        renderer.xr.setFoveation(1.0);
    }

    threeQuadLayer = renderer.xr.createQuadLayer(800, 500, 0.85532, 0.52);
    // renderer.xr.registerQuadLayer(threeQuadLayer, -1);

    // let stuffToHideInArMode_MaterialNames = [
    //     'Accent.Wall.001', 
    //     'Floor.001', 
    //     'Ceiling.001', 
    //     'Baseboard.001', 
    //     'Walls.001', 
    //     'Dumbell.Handle.001', 
    //     'Dumbell.001', 
    //     'Shelf.Legs.001',
    //     'FloorMarkings',
    //     'TV.001'
    // ]
    // if (pageUI.arMode)
    // {
    //     // walk through the scene and hide stuff
    //     scene.traverse((node) => {
    //         if (node.material && stuffToHideInArMode_MaterialNames.find( function(str) {return str == node.material.name}))
    //         {
    //             node.visible = false;
    //         }
    //     });

    //     renderer.setClearAlpha(0.0);
    // }
    // else
    // {
    //     // walk through the scene and show stuff
    //     // renderer.setClearAlpha(1.0);
    //     scene.traverse((node) => {
    //         if (node.material && stuffToHideInArMode_MaterialNames.find( function(str) {return str == node.material.name}))
    //         {
    //             node.visible = true;
    //         }
    //     });

    //     // renderer.setClearAlpha(0.0);
    // }

    // threeQuadLayer = renderer.xr.createQuadLayer(800, 500, 0.85532, 0.52);
    // renderer.xr.registerQuadLayer(threeQuadLayer, -1);

    // // position screen and quad layer
    // let quadLayer = threeQuadLayer.layer; //renderer.xr.getQuadLayer();

    // // get TV screen location
    // if(quadScreen != null)
    // {
    //     let screenOrientation = quadScreen.matrix;

    //     // position quadLayer at screenOrientation
    //     quadLayer.transform = new XRRigidTransform(quadScreen.position, quadScreen.quaternion);
    //     // quadLayer.height = 0.52;
    //     // quadLayer.width = quadLayer.height * 16/10;
    //     // set up the hole-punch mesh in the same place
    //     let holePunchMesh = new THREE.Mesh(
    //         new THREE.PlaneGeometry(2.0 * quadLayer.width, 2.0 * quadLayer.height),
    //         new THREE.MeshBasicMaterial(
    //             {
    //                 colorWrite: false,
    //             }
    //         )
    //     );
    //     holePunchMesh.position.copy(quadScreen.position);
    //     holePunchMesh.quaternion.copy(quadScreen.quaternion);
    //     scene.add(holePunchMesh);

    //     // move screen content (and children) to a default position/orientation in from of the quad-layer camera
    //     quadScreen.position.set(0,0,0);
    //     // quadScreen.translateX(-quadScreen.position.x)
    //     // quadScreen.translateY(-quadScreen.position.y)
    //     // quadScreen.translateZ(-quadScreen.position.z)

    //     quadScreen.rotation.set(0,0,0);
    //     //quadScreen.material.transparent = true;
    //     //quadScreen.material.opacity = 0.75;
    //     // quadScreen.updateMatrixWorld(true);
    // }

    // session.addEventListener('visibilitychange', e => {
    //     // remove hand controller while blurred
    //     if(e.session.visibilityState === 'visible-blurred') 
    //     {
    //         bPause = true;
    //         gameLogic.pause();
    //         if (leftHand.glove)
    //         {
    //             leftHand.glove.hide();
    //         }
    //         if (rightHand.glove)
    //         {
    //             rightHand.glove.hide();
    //         }
    //     }
    //     else
    //     {
    //         bPause = false;
    //         gameLogic.resume();
    //         if (leftHand.glove)
    //         {
    //             leftHand.glove.show();
    //         }
    //         if (rightHand.glove)
    //         {
    //             rightHand.glove.show();
    //         }
    //     }
    // });
}


function doPostLoadGameInitialization()
{
    // gameLogic.initialize(pageUI.roundCount, pageUI.roundTime, pageUI.restTime, pageUI.bagType, pageUI.doBagSwap, pageUI.workoutType, pageUI.whichScriptedWorkout);

    // gameLogic.start();
    gameLogic.startMenu();



    // threeQuadLayer = renderer.xr.createQuadLayer(800, 500, 0.85532, 0.52);
    // renderer.xr.registerQuadLayer(threeQuadLayer, -1);

    // position screen and quad layer
    let quadLayer = threeQuadLayer.layer; //renderer.xr.getQuadLayer();

    // get TV screen location
    if(quadScreen != null)
    {
        let screenOrientation = quadScreen.matrix;

        // position quadLayer at screenOrientation
        quadLayer.transform = new XRRigidTransform(quadScreen.position, quadScreen.quaternion);
        // quadLayer.height = 0.52;
        // quadLayer.width = quadLayer.height * 16/10;
        // set up the hole-punch mesh in the same place
        let holePunchMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(2.0 * quadLayer.width, 2.0 * quadLayer.height),
            new THREE.MeshBasicMaterial(
                {
                    colorWrite: false,
                }
            )
        );
        holePunchMesh.position.copy(quadScreen.position);
        holePunchMesh.quaternion.copy(quadScreen.quaternion);
        scene.add(holePunchMesh);

        // move screen content (and children) to a default position/orientation in from of the quad-layer camera
        quadScreen.position.set(0,0,0);
        // quadScreen.translateX(-quadScreen.position.x)
        // quadScreen.translateY(-quadScreen.position.y)
        // quadScreen.translateZ(-quadScreen.position.z)

        quadScreen.rotation.set(0,0,0);
        //quadScreen.material.transparent = true;
        //quadScreen.material.opacity = 0.75;
        // quadScreen.updateMatrixWorld(true);
    }

    let session = renderer.xr.getSession();
    session.addEventListener('visibilitychange', e => {
        // remove hand controller while blurred
        if(e.session.visibilityState === 'visible-blurred') 
        {
            bPause = true;
            gameLogic.pause();
            if (leftHand.glove)
            {
                leftHand.glove.hide();
            }
            if (rightHand.glove)
            {
                rightHand.glove.hide();
            }
        }
        else
        {
            bPause = false;
            gameLogic.resume();
            if (leftHand.glove)
            {
                leftHand.glove.show();
            }
            if (rightHand.glove)
            {
                rightHand.glove.show();
            }
        }
    });

    wrapupLoadingScreen();
}

function onSessionEnd()
{
    renderer.setAnimationLoop(null);
    //renderer.xr.getSession().removeEventListener('inputsourceschange', onInputSourcesChange);
    gameLogic.pause();
    location.reload();
}

let loadingQuadLayer = null;
let loadingCamera = null;
let loadingScene = null;
let loadingScreenQuadLocation = new THREE.Vector3(0.0, 1.0, -3.0);
let loadingScreenQuadQuaternion = new THREE.Quaternion();
function setupLoadingScreen()
{
    loadingQuadLayer = renderer.xr.createQuadLayer(1024, 1024, 1.0, 1.0);
    // threeQuadLayer = renderer.xr.createQuadLayer(800, 500, 0.85532, 0.52);
    renderer.xr.registerQuadLayer(loadingQuadLayer, -1);



    
    //@TODO --- set up loading camera, loading scene, get it rendering while loading is happening (with progress bar?)

    loadingCamera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.01, 100)
    loadingCamera.position.z = 20;

    loadingScene = new THREE.Scene();
    loadingScene.add(loadingCamera);
    let logo = new THREE.TextureLoader().load('./content/heavy_bag_trainer_logo.png');
    let loadingScreenMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1.0, 0.5),
        new THREE.MeshBasicMaterial( {color: 0x808080, map: logo} ));
    loadingScreenMesh.rotation.x = 0.707;
    loadingScreenMesh.position.z = -10
    
    loadingScene.add( loadingScreenMesh );

    loadingScene.add(blackoutQuad);
    blackoutMaterial.opacity = 0.0;
    // quadScene.add( loadingCamera );


    renderer.setAnimationLoop( loadingScreenRender );
}

let emptyScene = new THREE.Scene();

function loadingScreenRender(time, frame)
{
    renderer.render(emptyScene, camera);

    let renderProps = renderer.properties.get(loadingQuadLayer.renderTarget);
    renderProps.__ignoreDepthValues = false;

    loadingQuadLayer.layer.transform = new XRRigidTransform( loadingScreenQuadLocation, loadingScreenQuadQuaternion );

    // set viewport, rendertarget, and renderTargetTextures
    loadingQuadLayer.setupToRender(renderer, frame);
    
    renderer.xr.enabled = false;
    renderer.setClearColor(clearColorBlack, 1.0);
    renderer.render(loadingScene, loadingCamera);
    renderer.setClearColor(clearColorBlack, 0.0);
    renderer.xr.enabled = true;

}

function wrapupLoadingScreen()
{
    loadingQuadLayer = null;
    loadingScene = null;

    scene.add(blackoutQuad);
    bDoBlackoutFade = true;
    blackoutMaterial.opacity = 0.0;
    blackoutFadeTimer = 0.0;

    renderer.setAnimationLoop(render);
    quadScreen.needsRenderUpdate = true;
    renderer.xr.registerQuadLayer(threeQuadLayer, -1);
}

function initGlovesAndBag(scene, camera, renderer)
{
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
    gControllers.leftControllerConnectedCallbacks.push((index, targetRaySpace, gripSpace, gamepad) => {
        setupHandForController(leftHand, targetRaySpace, gamepad);
    });
    gControllers.leftControllerDisconnectedCallbacks.push(() => {
        wrapupHandForController(leftHand);
    });

    rightHand.glove = new Glove(scene, 2);
    rightHand.glove.heavyBag = heavyBag;
    rightHand.glove.doubleEndedBag = doubleEndedBag;
    gControllers.rightControllerConnectedCallbacks.push((index, targetRaySpace, gripSpace, gamepad) => {
        setupHandForController(rightHand, targetRaySpace, gamepad);
    });
    gControllers.rightControllerDisconnectedCallbacks.push(() => {
        wrapupHandForController(rightHand);
    });

    heavyBag.setGloves(leftHand.glove, rightHand.glove);
    doubleEndedBag.setGloves(leftHand.glove, rightHand.glove);
}

function initScene(scene, camera, renderer)
{
    initializeTextBoxSystem();
    
    

    // heavyBag = new HeavyBag(audioListener, scene, camera, renderer);
    // heavyBag.visible = false;
    // doubleEndedBag = new DoubleEndedBag(audioListener, scene, camera, renderer, playerHud);
    // doubleEndedBag.visible = false;

    // scene.add(heavyBag);
    // scene.add(doubleEndedBag);
    
    // leftHand.glove = new Glove(scene, 1);
    // leftHand.glove.heavyBag = heavyBag;
    // leftHand.glove.doubleEndedBag = doubleEndedBag;
    // rightHand.glove = new Glove(scene, 2);
    // rightHand.glove.heavyBag = heavyBag;
    // rightHand.glove.doubleEndedBag = doubleEndedBag;

    // heavyBag.setGloves(leftHand.glove, rightHand.glove);
    // doubleEndedBag.setGloves(leftHand.glove, rightHand.glove);

    // gameLogic = new BoxingSession(scene, camera, renderer, audioListener, heavyBag, doubleEndedBag, 3, 120, 20, 0, true);

    gameLogic = new BoxingSession(scene, pageUI, menu, camera, renderer, audioListener, heavyBag, doubleEndedBag, 3, 120, 20, 0, true);

    if (true && gameLogic.TV != null)
    {
        quadScreen = gameLogic.TV;
        scene.remove(quadScreen);

        quadScene.add(quadScreen);
    }

    
    // let qtb = new TextBox(400, "center", 1.667, "center", 1.0, 0xff00ff, "", "", true)
    // quadScene.add(qtb);
    // qtb.displayMessage("testing 1 2 3")

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
            // .setDataType( THREE.HalfFloatType )
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
            texture.encoding = THREE.LinearEncoding; //RGBDEncoding;
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
            texture.encoding = THREE.LinearEncoding; //RGBDEncoding  ;
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
            texture.encoding = THREE.LinearEncoding; //RGBDEncoding;
            aomaps[meshName] = texture;
            resolve();
        });
    });
}