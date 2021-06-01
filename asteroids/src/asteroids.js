import * as BABYLON from 'babylonjs/babylon.max'
import * as LOADERS from 'babylonjs-loaders';
// import { GLTFFileLoader } from 'babylonjs-loaders/glTF/glTFFileLoader';

const canvas = document.getElementById("renderCanvas"); // Get the canvas element
const engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine

const RAND = require('random-seed').create("asteroids");

var createScene = async function () {
    var scene = new BABYLON.Scene(engine);
    var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 1, 1), scene);
    camera.farZ = 1500.0;
    camera.nearZ = 0.1;
    // camera.setTarget(BABYLON.Vector3.Zero());
    camera.attachControl(canvas, true);
    // var hemi = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 0, -1), scene);
    // hemi.diffuse = new BABYLON.Color3(0.1,0.9,0.9).toLinearSpace();
    // hemi.ground = new BABYLON.Color3(0.9,0.0,0.9).toLinearSpace();
    // hemi.intensity = 1.4;

    var light = new BABYLON.DirectionalLight("sun", new BABYLON.Vector3(0,-1,2), scene);
    light.diffuse = new BABYLON.Color3(1.0, 0.4, 0.1);
    light.intensity = 1;
    // var sphere = BABYLON.Mesh.CreateSphere("sphere1", 16, 2, scene);
    // sphere.position.y = 1;
  
    BABYLON.SceneLoader.RegisterPlugin(new LOADERS.GLTFFileLoader());

    /*
    let gltf;
    BABYLON.SceneLoader.ImportMesh("", "content/", "asteroid.gltf", scene, (scene) => {
        gltf = scene;
    });
    */
    let asteroid_meshes = [];

    let container = await BABYLON.SceneLoader.LoadAssetContainerAsync("content/", "asteroid.gltf", scene);
    
    //, (container) => {
        let meshes = container.meshes;
        // meshes[1].setParent(null);
        meshes[1].isVisible = false;
        meshes[1].isPickable = false;
        // scene.removeMesh(meshes[1]);
        scene.addMesh(meshes[1]);

        let matrices = [];
        let position = new BABYLON.Vector3();
        let rotation = new BABYLON.Vector3();
        let quaternion = new BABYLON.Quaternion();
        let scaling = new BABYLON.Vector3();

        if (false)
        {
            for (let i = 0; i < 1000; i++) {
                //Unintuitively, clone adds the mesh directly to the scene. :\
                //let mesh = meshes[1].createInstance("instance_" + i);


                const kDist = 100.0;
                position.x = RAND.floatBetween(-kDist, kDist);
                position.y = RAND.floatBetween(-kDist, kDist);
                position.z = RAND.floatBetween(-kDist, kDist);

                const kTwoPi = 2.0 * Math.PI;
                rotation.x = RAND.floatBetween(0.0, kTwoPi);
                rotation.y = RAND.floatBetween(0.0, kTwoPi);
                rotation.z = RAND.floatBetween(0.0, kTwoPi);
                let quat = BABYLON.Quaternion.FromEulerAngles(rotation.x, rotation.y, rotation.z, quaternion);

                const kMinScale = 0.9;
                const kMaxScale = 2.2;
                let scale = RAND.floatBetween(kMinScale, kMaxScale);
                scaling.setAll(scale);

                let matrix = BABYLON.Matrix.Compose(scaling, quat, position);
                // matrix.setTranslationFromFloats(position.x, position.y, position.z);
                matrices.push(matrix);
            }

            meshes[1].thinInstanceAdd(matrices);
        }
        else
        {
            var sphere = BABYLON.Mesh.CreateSphere("sphere1", 16, 2, scene);
            for (let i = 0; i < 200; i++) {
                //Unintuitively, clone adds the mesh directly to the scene. :\
                // let mesh = sphere.createInstance("instance_" + i);
                let mesh = meshes[1].createInstance("instance_" + i);
                mesh.setParent(meshes[1].parent);
    
                const kDist = 130.0;
                mesh.position.x = RAND.floatBetween(-kDist, kDist);
                mesh.position.y = RAND.floatBetween(-kDist, kDist);
                mesh.position.z = RAND.floatBetween(-kDist, kDist);
    
                const kTwoPi = 2.0 * Math.PI;
                mesh.rotation.x = RAND.floatBetween(0.0, kTwoPi);
                mesh.rotation.y = RAND.floatBetween(0.0, kTwoPi);
                mesh.rotation.z = RAND.floatBetween(0.0, kTwoPi);
                // let quat = BABYLON.Quaternion.FromEulerAngles(rotation.x, rotation.y, rotation.z, quaternion);
    
                const kMinScale = 0.9;
                const kMaxScale = 2.2;
                let scale = RAND.floatBetween(kMinScale, kMaxScale);
                mesh.scaling.setAll(scale);
    

                asteroid_meshes.push(mesh);
                // let matrix = BABYLON.Matrix.Compose(scaling, quat, position);
                // matrix.setTranslationFromFloats(position.x, position.y, position.z);
                // matrices.push(matrix);
            }
    
            // meshes[1].thinInstanceAdd(matrices);
        }
    //});

    scene.fogMode = BABYLON.Scene.FOGMODE_NONE;
    scene.clearColor = new BABYLON.Color3(0.73,0.73,0.73).toLinearSpace();

    /*
    const env = scene.createDefaultEnvironment(
        {
            createGround: true,
            groundSize: 30,
            enableGroundMirror: false,
            createSkybox: false,
            groundColor: new BABYLON.Color3(1,1,1),
            groundOpacity: 1.0,
            enableGroundShadow: false,

            rootPosition: new BABYLON.Vector3(0,-5,0),
            cameraExposure: 1.0,
            sizeAuto: false,
            setupImageProcessing: false,
            environmentTexture: null

        }
    );
    */

    let ground = BABYLON.MeshBuilder.CreatePlane("ground_plane", {size: 4.0, sideOrientation: BABYLON.Mesh.FRONTSIDE}, scene);
    ground.position.y = -1.0;
    ground.rotation.x = 1.57;
    ground.material = new BABYLON.StandardMaterial("ground", scene);
    ground.material.diffuseColor = new BABYLON.Color3(0.25, 0.25, 0.3);
    ground.material.specularColor = ground.material.diffuseColor;
  
    asteroid_meshes.push(ground);
    // here we add XR support
    const xrHelper = await scene.createDefaultXRExperienceAsync({
        floorMeshes: asteroid_meshes,
        // optionalFeatures: ['high-fixed-foveation-level'],
        disableDefaultUI: false,
        disablePointerSelection: true,
        disableTeleportation: false,
        inputOptions: {
            doNotLoadControllerMeshes: true
        }
    });

    // xrHelper.teleportation.parabolicRayEnabled = true;
    xrHelper.teleportation.parabolicCheckRadius = 10.0;
    // xrHelper.teleportation.straightRayEnabled = false;
    

    
    return scene;
  };

  // Add your code here matching the playground format
let scene = null;
createScene().then((result) => {scene = result; engine.runRenderLoop(renderLoop)})

function renderLoop()
{
    scene.render();
}