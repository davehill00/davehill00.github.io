import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import * as TWEEN from '@tweenjs/tween.js';
import * as ZONE from './zone.js';
import * as HUD from './StatsHud.js';
import { InputManager } from './inputManager.js';

//import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';

let clock = null;
let accumulatedTime = 0.0;
let scene = null;
let camera = null;
let renderer = null;
let listener = null;
let zone = null;
let hud = null;
const bShowHud = false;
let controllers = [];

let pmremGenerator = null;


initialize();

function initialize()
{
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5.0;
    //camera.position.y = 2.0;
    //camera.rotation.x = 90.0;
    //camera.lookAt( {x:0.0, y:0.0, z:-10.0});

    // add camera to scene so that objects attached to the camera get rendered
    scene.add(camera);

    renderer = new THREE.WebGLRenderer( {antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    let color = new THREE.Color(0xfffbf8);
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

    renderer.xr.addEventListener( 'sessionstart', onSessionStart);
    renderer.xr.addEventListener( 'sessionend', onSessionEnd);


    if (bShowHud) hud = new HUD.StatsHud(camera);

    // const controls = new OrbitControls(camera, renderer.domElement);
    // controls.target.set(0.0, 0.0, -3.0);
    // controls.update();


    controllers.push(renderer.xr.getController( 0 ));
    scene.add( controllers[0] );

    renderer.xr.getControllerGrip(0).addEventListener("connected", (evt) => {
        controllers[0].gamepad = evt.data.gamepad;
    });

    controllers.push(renderer.xr.getController( 1 ));
    scene.add( controllers[1] );

    renderer.xr.getControllerGrip(1).addEventListener("connected", (evt) => {
        controllers[1].gamepad = evt.data.gamepad;
    });

    clock = new THREE.Clock();

 
    scene.controllers = controllers;

    renderer.inputManager = new InputManager(renderer.xr);

    zone = new ZONE.ZoneIntro(scene, renderer, camera);
    zone.onStart(accumulatedTime);

    loadEnvMap();

    renderer.setAnimationLoop(render);     
};


function render() {
    if (bShowHud) hud.update();

    let dt = Math.min(clock.getDelta(), 0.0333);
    accumulatedTime += dt;

    renderer.inputManager.update(dt, accumulatedTime);
    zone.update(dt, accumulatedTime);
    TWEEN.update(accumulatedTime);
    renderer.render(scene, camera);
}

function onSessionStart(event)
{
    zone.onEnd();
    zone = new ZONE.ZoneDefault(scene, renderer, camera);
    zone.onStart(accumulatedTime);
}
function onSessionEnd(event)
{
    zone.onEnd();

    zone = new ZONE.ZoneIntro(scene, renderer, camera);
    zone.onStart(accumulatedTime);
}


function loadEnvMap()
{
    pmremGenerator = new THREE.PMREMGenerator( renderer );
    pmremGenerator.compileEquirectangularShader();

    // THREE.DefaultLoadingManager.onLoad = function ( ) {

    //     this.pmremGenerator.dispose();
    //     this.pmremGenerator = null;

    // };

    // new EXRLoader()
    //     .setDataType( THREE.UnsignedByteType )
    //     .load( './content/threejs-piz_compressed.exr',  ( texture ) => {

    //         let exrCubeRenderTarget = pmremGenerator.fromEquirectangular( texture );
    //         renderer.exrCube = exrCubeRenderTarget.texture;

    //         texture.dispose();

    //     } );

    new THREE.TextureLoader().load( './content/envmap.png', ( texture ) => {

        texture.encoding = THREE.sRGBEncoding;

        renderer.envMapRT = pmremGenerator.fromEquirectangular( texture );

        renderer.envMapCube = renderer.envMapRT.texture;

        renderer.envMapFromDisk = texture;
        //texture.dispose();

    } );



}