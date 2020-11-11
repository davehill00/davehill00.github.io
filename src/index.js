import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js'; //'three/examples/jsm/webxr/XRControllerModelFactory.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);



const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.antialias = true;
renderer.xr.enabled = true;

document.body.appendChild(renderer.domElement);

document.body.appendChild(VRButton.createButton(renderer));

camera.position.z = 5;

const controls = new OrbitControls(camera, renderer.domElement);
controls.update();

const controllerModelFactory = new XRControllerModelFactory();

const boxGeometry = new THREE.BoxGeometry();
//const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const material = new THREE.MeshPhysicalMaterial({ color: 0xff40ff });

//			const cube = new THREE.Mesh( geometry, material );
//			scene.add( cube );
let i;
const spread = 40;
for (i = 0; i < spread * spread; i++) {
    let cube = new THREE.Mesh(boxGeometry, material);
    let row = i % spread;
    let col = Math.floor(i / spread);
    cube.position.set(-spread + row * 2.0, -spread + col * 2.0, -2 * spread);
    cube.rotation.x = 0.707;
    cube.rotation.y = 0.707;
    scene.add(cube);
    //cube.matrixWorldNeedsUpdate = true;
    //cube.matrixAutoUpdate = false;      
}

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.75);
directionalLight.position.set(2, 2, 1);

const light = new THREE.AmbientLight(0x404040); // soft white light
scene.add(light);

scene.add(directionalLight);
scene.add(camera);




var createGeometry = require('three-bmfont-text')
var loadFont = require('load-bmfont')

var fontGeometry;
var fontMesh;

loadFont('fonts/arial.fnt', function (err, font) {
    // create a geometry of packed bitmap glyphs,
    // word wrapped to 300px and right-aligned
    fontGeometry = createGeometry({
        width: 500,
        align: 'right',
        font: font
    })


    // the texture atlas containing our glyphs
    var texture = new THREE.TextureLoader().load('fonts/arial.png');

    // we can use a simple ThreeJS material
    var fontMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: false,
        side: THREE.DoubleSide,
        color: 0xffffff
    });

    // now do something with our mesh!
    fontMesh = new THREE.Mesh(fontGeometry, fontMaterial);
    fontMesh.position.set(1, 0, -5);
    fontMesh.scale.set(0.005, 0.005, 0.005);
    fontMesh.rotation.set(3.14, 0, 0);

    //var fontObject = new THREE.Object3D();
    //fontObject.scale.multiplyScalar(0.005);
    //fontObject.add(fontMesh);
    //fontObject.position.set(0,0,-10.0);
    //camera.add(fontMesh);

    camera.add(fontMesh);
});



// change text and other options as desired
// the options sepcified in constructor will
// be used as defaults
//fontGeometry.update('Lorem ipsum\nDolor sit amet.')

// the resulting layout has metrics and bounds
//   console.log(geometry.layout.height)
//   console.log(geometry.layout.descender)
function onSelectStart(event)
{
    console.log(event);
}
function onSelectEnd(event)
{
    console.log(event);
}

const controllerGrip0 = renderer.xr.getControllerGrip(0);
const model0 = controllerModelFactory.createControllerModel( controllerGrip0 );
controllerGrip0.add( model0 );
scene.add( controllerGrip0 );
const controllerGrip1 = renderer.xr.getControllerGrip(1);
const model1 = controllerModelFactory.createControllerModel( controllerGrip1 );
controllerGrip1.add( model1 );
scene.add( controllerGrip1 );

const controller1 = renderer.xr.getController(0);
controller1.addEventListener('selectstart', onSelectStart);
controller1.addEventListener('selectend', onSelectEnd);




var lastFrameTime = 0.0;

var textObject;
var textParams = {}

var endOfLastFrame = 0.0;
var startOfCurrentFrame = 0.0;
renderer.setAnimationLoop(function () {
    endOfLastFrame = performance.now();
    if (fontGeometry) {
        let delta = endOfLastFrame - startOfCurrentFrame;
        fontGeometry.update((spread * spread) + " objects, " + delta.toFixed(3) + " ms, " + (1000.0 / delta).toFixed(0) + "Hz");
        // console.log(fontGeometry.layout.height)
        // console.log(fontGeometry.layout.descender)
        //fontMesh.rotation.y += 0.01;
    }

    //        textObject = new THREE.TextGeometry( lastFrameTime + "ms", parameters );
    startOfCurrentFrame = performance.now();
    renderer.render(scene, camera);
});

