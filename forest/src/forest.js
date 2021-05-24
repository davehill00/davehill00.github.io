import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import { InitializeGridAssetManager, InitializeLevelGrid, UpdateLevelGrid, LevelGridRaycast, LoadGridProps, LoadGridAssets } from './levelGrid';
import {Flare} from './flare.js';
import { GrassSystem } from './grass';
import { KDTree } from './kdTree';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// MESH BVH SETUP
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast, CENTER, AVERAGE, SAH } from 'three-mesh-bvh';
import { InitializeInputManager } from './inputManager';
import { PlayerController } from './playerController';
// BVH: Add the extension functions
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

let scene;
let camera;
let cameraTranslationGroup;
let cameraRotationGroup;
let renderer;
let clock;
let moon;
let grass;
let kdTree;
let hr = {};

let playerController;

let gSimpleKDTree = false;

let rightHand = null;
let rightController = null;
let leftHand = null;
let leftController = null;

let pmremGenerator;
let torch;

let tVec0 = new THREE.Vector3();
let tVec1 = new THREE.Vector3();
let tVec2 = new THREE.Vector3();

let input = {
    move: 0.0,
    turn: 0.0
};

initialize();

function initialize()
{
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 500);
    camera.position.z = 0.0;
    camera.position.y = 2.0;
    
    

    // cameraTranslationGroup = new THREE.Group();
    // cameraRotationGroup = new THREE.Group();

    // cameraTranslationGroup.add(cameraRotationGroup);
    // cameraRotationGroup.add(camera);
    // // add camera to scene so that objects attached to the camera get rendered
    // scene.add(cameraTranslationGroup);

    //stencil:false doesn't appear to do anything by itself... if both stencil and depth are false, you get neither depth nor stencil
    renderer = new THREE.WebGLRenderer( {antialias: true}); //, stencil:false, depth:false}); 
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    renderer.xr.setFramebufferScaleFactor(1.0);

    renderer.physicallyCorrectLights = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0; //0.285;


    InitializeInputManager(renderer.xr);
    playerController = new PlayerController(scene, camera);

    let clearColor = new THREE.Color(0x606075); //0x000000); // new THREE.Color(0.97, 0.98, 1.0);
    clearColor.convertSRGBToLinear();
    renderer.setClearColor(clearColor);

    
    clock = new THREE.Clock();

    let sunColor = new THREE.Color(0.87, 0.88, 1.0);
    sunColor.convertSRGBToLinear();
    let moonLight = new THREE.DirectionalLight(sunColor, 0.28); //2.3); //1.185); //1.25); //2.0);
    moonLight.position.set(0.0, 1.0, 1.0);
    scene.add(moonLight);

    let ambientColor = new THREE.Color(0.31, 0.31, 0.5); //(0.05, 0.05, 0.3); //1.0, 0.88, 0.87);
    ambientColor.convertSRGBToLinear();
    let ambient = new THREE.AmbientLight(ambientColor, 0.6315); //0.25); //1.85);
    scene.add(ambient);

    let fog = new THREE.FogExp2(clearColor.getHex(), 0.024); //0.023);
    // let fog = new THREE.Fog(clearColor.getHex(), 10, 30);
    scene.fog = fog;

    let moonDirectionVector = moonLight.position.clone();
    moonDirectionVector.normalize();
    moonDirectionVector.multiplyScalar(100.0);
    moon = new Flare(moonDirectionVector, scene, playerController, renderer);


    // grass = new GrassSystem(scene, renderer);
    
    // let treeAssets = [];
    // let treeInstanceMesh;

    // let envMapPromise = LoadEnvMapPromise('./content/environment_map.exr');

    if (!gSimpleKDTree)
    {
        InitializeGridAssetManager();
        // let assetManagerPromise = InitializeGridAssetManager();

        LoadGridProps().then(
            ()=> { 
                return LoadGridAssets(); 
            }
        ).then( 
            ()=>{
                return InitializeLevelGrid(scene);
            }
        );
    }
    else
    {
        let loader = new GLTFLoader();
        loader.load("./content/test_level.gltf", (gltf) => 
            {
                let objects = [];
                gltf.scene.traverse(
                    function (node) {
                        if (node.geometry)
                        {
                            objects.push(node);
                            node.geometry.computeBoundsTree(
                                {
                                    lazyGeneration: false,
                                    strategy: AVERAGE,
                                    packData: false
                                }
                            );
                        }
                    });

                let box = new THREE.Box3(new THREE.Vector3(-300, -50, -300), new THREE.Vector3(300, 50, 300) );
                kdTree = new KDTree(box, []); // objects);
                objects.forEach((object) => {
                    kdTree.insert(object);
                })

                //kdTree.appendDebugMesh(scene);
                scene.add(gltf.scene);         
            });
    }



    document.body.appendChild(renderer.domElement);
    document.body.appendChild(VRButton.createButton(renderer));


    torch = new THREE.PointLight(0xee8020, 2.0, 5.0);
    // playerController.translationGroup.add(torch);
    // torch.position.y += 1.5;


    /*
    const controllerModelFactory = new XRControllerModelFactory();
    let con = renderer.xr.getControllerGrip(0);
    con.addEventListener("connected", onControllerConnected);
    con.addEventListener("disconnected", onControllerDisconnected);
    con.add(controllerModelFactory.createControllerModel(con));
    torch = new THREE.PointLight(0xee8020, 25.0, 10.0);
    torch.visible = false;

    cameraTranslationGroup.add(con);
    rightHand = con;

    con = renderer.xr.getControllerGrip(1);
    con.addEventListener("connected", onControllerConnected);
    con.addEventListener("disconnected", onControllerDisconnected);
    con.add(controllerModelFactory.createControllerModel(con));
    cameraTranslationGroup.add(con);
    leftHand = con;

    cameraTranslationGroup.add(torch);

    renderer.xr.addEventListener( 'sessionstart', onSessionStart);
    renderer.xr.addEventListener( 'sessionend', onSessionEnd);
    */

    renderer.setAnimationLoop(render);

    /*
    document.addEventListener('keydown', (event) => {onKeyDown(event)});
    document.addEventListener('keyup', (event) => {onKeyUp(event)});
    */
}

let frameNumber = 0;
function render() {
    let dt = Math.min(clock.getDelta(), 0.0333);

    frameNumber++;
    if ((frameNumber % 3) == 0)
    {
        torch.intensity += getRandomFloatInRange(-0.25, 0.25);
    }

    //updateInput(dt);
    playerController.update(dt);

    playerController.getPosition(tVec0);
    playerController.getHeading(tVec1);
    UpdateLevelGrid(tVec0, tVec1);

    // moon.update(dt);
    // grass.update(dt, cameraTranslationGroup.position);

    renderer.render(scene, camera);
}

function onSessionStart()
{
    // for (let i = 0; i < controllers.length; i++)
    // {
    //     let con = controllers[i].children[0];
    //     con.setEnvironmentMap(scene.envMap);
    // }
}

function onSessionEnd()
{

}

function LoadEnvMapPromise(pathname)
{
    pmremGenerator = new THREE.PMREMGenerator( renderer );
    pmremGenerator.compileEquirectangularShader();

    return new Promise( (resolve, reject) => {
        
        new EXRLoader()
            .setDataType( THREE.HalfFloatType )
            .load( pathname,  ( texture ) => {

                let exrCubeRenderTarget = pmremGenerator.fromEquirectangular( texture );
                scene.envMap = exrCubeRenderTarget.texture;

                const rt = new THREE.WebGLCubeRenderTarget(2048);
                rt.fromEquirectangularTexture(renderer, texture);
                scene.background = rt.texture;
                scene.envMap = rt;

                resolve();

            } );
        });
}

function getRandomFloatInRange(min, max)
{
    return Math.random() * (max - min) + min;
}

function getRandomIntInRange(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

function updateInput(dt)
{
    if (leftController)
    {


        let turnInput = Math.sign(leftController.gamepad.axes[2]) * Math.max(Math.abs(leftController.gamepad.axes[2]) - 0.2, 0.0) * 1.25;

        input.turn = turnInput;

        input.move = leftController.gamepad.axes[3];

        //cameraGroup.rotateOnWorldAxis(THREE.Object3D.DefaultUp, turnInput * dt * -1.57);
        //cameraGroup.position.addScaledVector(tVec1, leftController.gamepad.axes[2] * dt * 2.0);
        //cameraGroup.position.addScaledVector(tVec0, leftController.gamepad.axes[3] * dt * 2.0);
    }

    //let xrCamera = renderer.xr.getCamera(camera);
    cameraRotationGroup.getWorldDirection(tVec0); // Get forward axis
    tVec0.y = 0.0; // Project to XZ plane
    tVec0.normalize();
    //tVec1.crossVectors(tVec0, THREE.Object3D.DefaultUp); // Compute right axis
    //tVec1.normalize();
    cameraRotationGroup.rotateOnWorldAxis(THREE.Object3D.DefaultUp, input.turn * dt * -1.57);

    tVec1.copy(cameraTranslationGroup.position);
    tVec2.copy(tVec1);
    tVec2.addScaledVector(tVec0, input.move * dt * 2.0);
    if (raycastFromTo(tVec1, tVec2, hr))
    {

        console.log("Hit on translate: " + hr.t);
        if (hr.t > 0.001)
        {
            cameraTranslationGroup.position.lerpVectors(tVec1, tVec2, hr.t);
        }
        else
        {
            console.log("STOP");
        }
    }
    else
    {
        cameraTranslationGroup.position.copy(tVec2); //addScaledVector(tVec0, input.move * dt * 2.0);
    }
    

    // Raycast from above the terrain down to the terrain to figure out our location

    tVec0.copy(cameraTranslationGroup.position);
    tVec0.y += 2.0;

    tVec1.copy(tVec0);
    tVec1.y -= 104.0;

    
    if (raycastFromTo(tVec0, tVec1, hr))
    {
        // move to the hit point
        cameraTranslationGroup.position.y = tVec0.y + (tVec1.y - tVec0.y) * hr.t + 1.7;
    }
    else
    {
        // stay where we are, I guess
    }

    // input.turn = 0.0;
    // input.move = 0.0;
}

function onKeyDown(event)
{
    if (event.code == 'KeyW')
    {
        input.move = -4.0;
    }
    else if (event.code == 'KeyS')
    {
        input.move = 4.0;
    }
    else if (event.code == 'KeyA')
    {
        input.turn = -2.0;
    }
    else if (event.code == 'KeyD')
    {
        input.turn = 2.0;
    }
}
function onKeyUp(event)
{
    if (event.code == 'KeyW')
    {
        input.move = 0.0;
    }
    else if (event.code == 'KeyS')
    {
        input.move = 0.0;
    }
    else if (event.code == 'KeyA')
    {
        input.turn = 0.0;
    }
    else if (event.code == 'KeyD')
    {
        input.turn = 0.0;
    } 
}


function onControllerConnected(evt)
{
    if (evt.data && evt.data.handedness)
    {
        if (evt.data.handedness == "right")
        {
            rightController = evt.data;
            cameraTranslationGroup.remove(torch);
            rightHand.add(torch);

        }
        else
        {
            leftController = evt.data;
        }
    }
}

function onControllerDisconnected(evt)
{
    if (evt.data && evt.data.handedness)
    {
        if (evt.data.handedness == "right")
        {
            rightController = null; //evt.data;
            rightHand.remove(torch);
            cameraTranslationGroup.add(torch);
        }
        else
        {
            leftController = null; //evt.data;
        }
    }
}

function raycastFromTo(from, to, hr)
{
    hr.t = 1.0;
    
    if (!gSimpleKDTree)
    {
        return LevelGridRaycast(from, to, hr);
    }

    if (kdTree)
    {
        return kdTree.topLevelRaycast(from, to, hr);
    }
    else
    {
        return false;
    }
}