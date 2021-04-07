import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import { MeshBasicMaterial, MeshStandardMaterial } from 'three';

let scene;
let camera;
let renderer;
let clock;
let controllers = [];
let pmremGenerator;

initialize();

function initialize()
{
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 500);
    camera.position.z = 0.0;
    camera.position.y = 2.0;
    
    // add camera to scene so that objects attached to the camera get rendered
    scene.add(camera);

    renderer = new THREE.WebGLRenderer( {antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    //renderer.xr.setFramebufferScaleFactor(1.0);

    // renderer.physicallyCorrectLights = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.285;

    let color = new THREE.Color(0.97, 0.98, 1.0);
    color.convertSRGBToLinear();

    
    clock = new THREE.Clock();

    let sun = new THREE.DirectionalLight(color, 2.0);
    sun.position.set(1.0, 2.0, 1.0);
    scene.add(sun);

    let ambientColor = new THREE.Color(1.0, 0.88, 0.87);
    ambientColor.convertSRGBToLinear();
    let ambient = new THREE.AmbientLight(ambientColor, 1.85);
    scene.add(ambient);

    let envMapPromise = LoadEnvMapPromise('./content/environment_map.exr');

    let loaderPromise = new Promise( (resolve) => {
        let loader = new GLTFLoader();
        loader.load('./content/environment.gltf', resolve);
    });

    envMapPromise.then(()=>{return loaderPromise}).then(
            (gltf) => {
                for (let i = 0; i < gltf.scene.children.length; i++)
                {                
                    //  let obj = gltf.scene.children[i];       
                    //  if (obj.name == "Suzanne")
                    //  {
                    //      obj.material.envMap = scene.envMap;

                    //      for (let j = 0; j < gltf.scene.children.length; j++)
                    //      {
                    //          let otherObj = gltf.scene.children[j];
                    //          otherObj.traverse(
                    //              function (node) {
                    //                  if (node.material) // && 'envmap' in node.material)
                    //                  {
                    //                      //console.log("Setting EnvMap on " + node.name + " with intensity " + node.material.envMapIntensity);
                    //                      node.material = obj.material; //.envMap = scene.envMap;
                    //                  }
                    //              });

                    //      }
                    //  }
                //     obj.traverse(
                //         function (node)
                //         {
                //             if (scene.envMap && node.material) // && 'envmap' in node.material)
                //             {
                //                 console.log("Setting EnvMap on " + node.name + " with intensity " + node.material.envMapIntensity);
                //                 node.material.envMap = scene.envMap;
                //             }
                //         });
                }
                // gltf.scene.traverse(
                //     function(node)
                //     {
                //         if (node.material)
                //         {
                //             let mat = new THREE.MeshLambertMaterial({color: 0x800080, side: THREE.FrontSide});
                //             mat.color = node.material.color;
                //             // mat.specular = node.material.roughness;
                //             node.material = mat;
                //             console.log("REPLACE MATERIAL ON: " + node.name);
                //         }
                //     }
                // )
                scene.add(gltf.scene);
            });

    document.body.appendChild(renderer.domElement);
    document.body.appendChild(VRButton.createButton(renderer));

    const controllerModelFactory = new XRControllerModelFactory();
    let con = renderer.xr.getControllerGrip(0);
    con.add(controllerModelFactory.createControllerModel(con));
    //scene.add(con);
    controllers.push(con);
    con = renderer.xr.getControllerGrip(1);
    con.add(controllerModelFactory.createControllerModel(con));
    //scene.add(con);
    controllers.push(con);

    renderer.xr.addEventListener( 'sessionstart', onSessionStart);
    renderer.xr.addEventListener( 'sessionend', onSessionEnd);

    renderer.setAnimationLoop(render);
}

function render() {
    let dt = Math.min(clock.getDelta(), 0.0333);

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
            .setDataType( THREE.FloatType )
            .load( pathname,  ( texture ) => {

                let exrCubeRenderTarget = pmremGenerator.fromEquirectangular( texture );
                scene.envMap = exrCubeRenderTarget.texture;

                const rt = new THREE.WebGLCubeRenderTarget(2048);
                rt.fromEquirectangularTexture(renderer, texture);
                scene.background = rt.texture;
                // scene.envMap = rt;

                resolve();

            } );
        });
}