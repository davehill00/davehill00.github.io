import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import { MeshBasicMaterial, MeshStandardMaterial } from 'three';
import { InitializeGridAssetManager, InitializeLevelGrid, UpdateLevelGrid } from './levelGrid';
import {Flare} from './flare.js';

let scene;
let camera;
let cameraGroup;
let renderer;
let clock;
let moon;

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
    
    

    cameraGroup = new THREE.Group();
    cameraGroup.add(camera);
    // add camera to scene so that objects attached to the camera get rendered
    scene.add(cameraGroup);

    //stencil:false doesn't appear to do anything by itself... if both stencil and depth are false, you get neither depth nor stencil
    renderer = new THREE.WebGLRenderer( {antialias: true}); //, stencil:false, depth:false}); 
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    //renderer.xr.setFramebufferScaleFactor(1.0);

    renderer.physicallyCorrectLights = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.285;

    let clearColor = new THREE.Color(0x202045); // new THREE.Color(0.97, 0.98, 1.0);
    clearColor.convertSRGBToLinear();
    renderer.setClearColor(clearColor);

    
    clock = new THREE.Clock();

    let sunColor = new THREE.Color(0.87, 0.88, 1.0);
    sunColor.convertSRGBToLinear();
    let moonLight = new THREE.DirectionalLight(sunColor, 1.185); //1.25); //2.0);
    moonLight.position.set(1.0, 2.0, 1.0);
    scene.add(moonLight);

    let ambientColor = new THREE.Color(0.1, 0.1, 1.0); //(0.05, 0.05, 0.3); //1.0, 0.88, 0.87);
    ambientColor.convertSRGBToLinear();
    let ambient = new THREE.AmbientLight(ambientColor, 0.37); //0.25); //1.85);
    scene.add(ambient);

    let fog = new THREE.FogExp2(clearColor.getHex(), 0.023);
    // let fog = new THREE.Fog(clearColor.getHex(), 10, 30);
    scene.fog = fog;

    let moonDirectionVector = moonLight.position.clone();
    moonDirectionVector.normalize();
    moonDirectionVector.multiplyScalar(100.0);
    moon = new Flare(moonDirectionVector, scene, camera, renderer);


    // let treeAssets = [];
    // let treeInstanceMesh;

    // let loader = new GLTFLoader();
    // let envMapPromise = LoadEnvMapPromise('./content/environment_map.exr');

    let assetManagerPromise = InitializeGridAssetManager();

    assetManagerPromise.then( 
        ()=>{
            return InitializeLevelGrid(scene);
        }
    );

    // let loadTreePromise = new Promise((resolve) => {
    //     loader.load('./content/dead_tree_1.gltf', (gltf) => 
    //         {
    //             treeAssets.push(gltf.scene.children[0]);
    //             resolve();
    //         });
    // });

    // let loadScenePromise = new Promise( (resolve) => {
        
    //     loader.load('./content/TerrainSquare2.gltf', resolve);
    // });

    
    // loadTreePromise.then(()=>{return loadScenePromise}).then(
    //         (gltf) => {
    //             //let terrainSquare = gltf.scene;

    //             //scene.add(gltf.scene);
    //             treeInstanceMesh = new THREE.InstancedMesh(
    //                 treeAssets[0].geometry,
    //                 new THREE.MeshPhongMaterial({color: 0x808080}),
    //                 100
    //             );

    //             let treeInstanceCount = 0;
    //             let matrix = new THREE.Matrix4();
    //             const kTreeInstanceName = "TreeInstance";
    //             let terrainSquare = new THREE.Group();
    //             for (let i = 0; i < gltf.scene.children.length; i++)
    //             {
    //                 let obj = gltf.scene.children[i];
    //                 if (obj.name.startsWith(kTreeInstanceName))
    //                     {
    //                         matrix.compose(obj.position, obj.quaternion, obj.scale);
    //                         treeInstanceMesh.setMatrixAt(treeInstanceCount++, matrix);
    //                     }
    //                     else
    //                     {
    //                         terrainSquare.add(obj);
    //                     }
    //             }
    //             /*gltf.scene.traverse(
    //                 function (node) {
    //                     if (node.name.startsWith(kTreeInstanceName))
    //                     {
    //                         matrix.compose(node.position, node.quaternion, node.scale);
    //                         treeInstanceMesh.setMatrixAt(treeInstanceCount++, matrix);
    //                     }
    //                     else
    //                     {
    //                         terrainSquare.add(node);
    //                     }
    //                 });
    //             */
    //             treeInstanceMesh.instanceMatrix.needsUpdate = true;
    //             treeInstanceMesh.count = treeInstanceCount;
    //             terrainSquare.add(treeInstanceMesh);

    //             let terrainInst;
    //             terrainInst = terrainSquare.clone();
    //             terrainInst.renderOrder = 0;
    //             scene.add(terrainInst);

    //             let kOffset = 25.0;
    //             terrainInst = terrainSquare.clone();
    //             terrainInst.position.set(kOffset, 0.0, 0.0);
    //             terrainInst.renderOrder = 1;
    //             scene.add(terrainInst);

    //             terrainInst = terrainSquare.clone();
    //             terrainInst.position.set(kOffset, 0.0, kOffset);
    //             terrainInst.renderOrder = 1;
    //             scene.add(terrainInst);

    //             terrainInst = terrainSquare.clone();
    //             terrainInst.position.set(kOffset, 0.0, -kOffset);
    //             terrainInst.renderOrder = 1;
    //             scene.add(terrainInst);


    //             terrainInst = terrainSquare.clone();
    //             terrainInst.position.set(0.0, 0.0, kOffset);
    //             terrainInst.renderOrder = 1;
    //             scene.add(terrainInst);

    //             terrainInst = terrainSquare.clone();
    //             terrainInst.position.set(0.0, 0.0, -kOffset);
    //             terrainInst.renderOrder = 1;
    //             scene.add(terrainInst);


    //             terrainInst = terrainSquare.clone();
    //             terrainInst.position.set(-kOffset, 0.0, 0.0);
    //             terrainInst.renderOrder = 1;
    //             scene.add(terrainInst);

    //             terrainInst = terrainSquare.clone();
    //             terrainInst.position.set(-kOffset, 0.0, kOffset);
    //             terrainInst.renderOrder = 1;
    //             scene.add(terrainInst);

    //             terrainInst = terrainSquare.clone();
    //             terrainInst.position.set(-kOffset, 0.0, -kOffset);
    //             terrainInst.renderOrder = 1;
    //             scene.add(terrainInst);

    //             // scene.add(treeAssets[0]);
    //             /*

    //             let pos = new THREE.Vector3();
    //             let euler = new THREE.Euler();
    //             // euler.set(0.0, 0.0, 0.0);
    //             let rot = new THREE.Quaternion();
    //             // rot.setFromEuler(euler);
    //             let scale = new THREE.Vector3(1,1,1);

    //             for (let i = 0; i < treeInstanceMesh.count; i++)
    //             {

    //                 let x, y, z;
    //                 x = getRandomIntInRange(-100, 100);
    //                 z = getRandomIntInRange(-100, 100);
    //                 pos.set(x, 0.0, z);

    //                 x = getRandomFloatInRange(0.75, 1.05);
    //                 y = getRandomFloatInRange(0.75, 1.05);
    //                 scale.set(x, y, x);

    //                 // euler.set(0.0, getRandomFloatInRange(0.0, 3.14), 0.0);
    //                 // rot.setFromEuler(euler);

    //                 treeInstanceMesh.setMatrixAt(i,
    //                     new THREE.Matrix4().compose(
    //                         pos, rot, scale
    //                     ));
    //             }

    //             treeInstanceMesh.instanceMatrix.needsUpdate = true;
    //             */
    //             scene.add(treeInstanceMesh);
                
    //         });

    document.body.appendChild(renderer.domElement);
    document.body.appendChild(VRButton.createButton(renderer));

    const controllerModelFactory = new XRControllerModelFactory();
    let con = renderer.xr.getControllerGrip(0);
    con.addEventListener("connected", onControllerConnected);
    con.addEventListener("disconnected", onControllerDisconnected);
    con.add(controllerModelFactory.createControllerModel(con));
    torch = new THREE.PointLight(0xee8020, 25.0, 10.0);
    torch.visible = false;

    cameraGroup.add(con);
    rightHand = con;

    con = renderer.xr.getControllerGrip(1);
    con.addEventListener("connected", onControllerConnected);
    con.addEventListener("disconnected", onControllerDisconnected);
    con.add(controllerModelFactory.createControllerModel(con));
    cameraGroup.add(con);
    leftHand = con;

    cameraGroup.add(torch);

    renderer.xr.addEventListener( 'sessionstart', onSessionStart);
    renderer.xr.addEventListener( 'sessionend', onSessionEnd);

    renderer.setAnimationLoop(render);

    document.addEventListener('keydown', (event) => {onKeyDown(event)});
    document.addEventListener('keyup', (event) => {onKeyUp(event)});
}

let frameNumber = 0;
function render() {
    let dt = Math.min(clock.getDelta(), 0.0333);

    frameNumber++;
    if ((frameNumber % 3) == 0)
    {
        torch.intensity += getRandomFloatInRange(-0.15, 0.15);
    }

    updateInput(dt);
    UpdateLevelGrid(cameraGroup.position);

    moon.update(dt);

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
    cameraGroup.getWorldDirection(tVec0); // Get forward axis
    tVec0.y = 0.0; // Project to XZ plane
    tVec0.normalize();
    //tVec1.crossVectors(tVec0, THREE.Object3D.DefaultUp); // Compute right axis
    //tVec1.normalize();
    cameraGroup.rotateOnWorldAxis(THREE.Object3D.DefaultUp, input.turn * dt * -1.57);
    cameraGroup.position.addScaledVector(tVec0, input.move * dt * 2.0);
    
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
            cameraGroup.remove(torch);
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
            cameraGroup.add(torch);
        }
        else
        {
            leftController = null; //evt.data;
        }
    }
}