import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js'; //'three/examples/jsm/webxr/XRControllerModelFactory.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// add camera to scene so that objects attached to the camera get rendered
scene.add(camera);

const renderer = new THREE.WebGLRenderer( {antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.antialias = false;
renderer.xr.enabled = true;
renderer.setClearColor(0x303030);

document.body.appendChild(renderer.domElement);
document.body.appendChild(VRButton.createButton(renderer));

const controls = new OrbitControls(camera, renderer.domElement);
controls.update();

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.75);
directionalLight.position.set(2, 2, 1);
scene.add(directionalLight);

const light = new THREE.AmbientLight(0x202020); // soft white light
scene.add(light);



const boxGeometry = new THREE.BoxGeometry();
const boxMaterials = [new THREE.MeshPhysicalMaterial({ color: 0xff8020 }), new THREE.MeshPhysicalMaterial({ color: 0xaaaaaa })];

let i;
const kSpread = 20;

var drawGroups = new Array();
const groupSize = 10;
var currentGroup = new THREE.Group();
var groupCounter = 0;

for (i = 0; i < kSpread * kSpread; i++) {
    let cube = new THREE.Mesh(boxGeometry, boxMaterials[i%2]);
    let row = i % kSpread;
    let col = Math.floor(i / kSpread);
    //cube.position.set(-kSpread + row * 2.0, -kSpread + col * 2.0, -2 * kSpread);
    cube.position.set(-kSpread + row * 2.0, -kSpread + (col + 0.5) * 2.0, -2 * kSpread - 10);
    cube.rotation.x = 0.707;
    cube.rotation.y = 0.707;
    currentGroup.add(cube);
    groupCounter++;

    if (groupCounter == groupSize)
    {
        scene.add(currentGroup);
        currentGroup.visible = false;
        drawGroups.push(currentGroup);
        currentGroup = new THREE.Group();
        groupCounter = 0;
    }
}
if (currentGroup.children.length != 0)
{
    scene.add(currentGroup);
    currentGroup.visible = false;
}

var firstInvisible = -1;
initVisibility((kSpread*kSpread*0.25)/groupSize);


var createGeometry = require('three-bmfont-text')
var loadFont = require('load-bmfont')

var fontGeometry;
var fontMesh;

loadFont('fonts/arial.fnt', function (err, font) {
    // create a geometry of packed bitmap glyphs,
    // word wrapped to 300px and right-aligned
    fontGeometry = createGeometry({
        width: 350,
        align: 'right',
        font: font
    })

    // the texture atlas containing our glyphs
    var texture = new THREE.TextureLoader().load('fonts/arial.png');

    // we can use a simple ThreeJS material
    var fontMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        color: 0xffffff
    });

    // scale and position the mesh to get it doing something reasonable
    fontMesh = new THREE.Mesh(fontGeometry, fontMaterial);
    fontMesh.position.set(0, -0.75, -5);
    fontMesh.scale.set(0.0035, 0.0035, 0.0035);
    fontMesh.rotation.set(3.14, 0, 0);

    camera.add(fontMesh);


    let messageGeo = createGeometry({
        width: 1000,
        align: 'center',
        font: font
    });
    messageGeo.update("Use L and R triggers to increase or decrease the number of objects rendered.")
    let messageMesh = new THREE.Mesh(messageGeo, fontMaterial);
    messageMesh.position.set(-1.85, 2.0, -4);
    messageMesh.scale.set(0.0035, 0.0035, 0.0035);
    messageMesh.rotation.set(3.14, 0.0, 0.0);

    scene.add(messageMesh);
});


function onSelectStart(event)
{
}
function onSelectEnd(event)
{
    let increment = event.data.handedness == "right";
    updateVisibility(increment);
}

const controllerModelFactory = new XRControllerModelFactory();
const controllerGrip0 = renderer.xr.getControllerGrip(0);
const model0 = controllerModelFactory.createControllerModel( controllerGrip0 );
controllerGrip0.add( model0 );
scene.add( controllerGrip0 );
const controllerGrip1 = renderer.xr.getControllerGrip(1);
const model1 = controllerModelFactory.createControllerModel( controllerGrip1 );
controllerGrip1.add( model1 );
scene.add( controllerGrip1 );

const controller0 = renderer.xr.getController(0);
controller0.addEventListener('selectstart', onSelectStart);
controller0.addEventListener('selectend', onSelectEnd);

const controller1 = renderer.xr.getController(1);
controller1.addEventListener('selectstart', onSelectStart);
controller1.addEventListener('selectend', onSelectEnd);


document.onkeydown = function(e) {
    switch(e.key)
    {
        case ",":
            updateVisibility(false);
            break;
        case ".":
            updateVisibility(true);
            break;
    }
};

var endOfLastFrame = 0.0;
var startOfCurrentFrame = 0.0;
var averageDelta = 0.0;
const kFpsSmoothing = 0.10;
var curMaxDelta = 0.0;
var expiryMaxDelta = performance.now();
var curMinHertz = 90.0;
var expiryMinHertz = performance.now();
const kMaxPersist = 2000.0;

renderer.setAnimationLoop(
    function () {
        endOfLastFrame = performance.now();
        let delta = endOfLastFrame - startOfCurrentFrame;
        if (delta > curMaxDelta || endOfLastFrame > expiryMaxDelta) {
            curMaxDelta = delta;
            expiryMaxDelta = endOfLastFrame + kMaxPersist;
        }
        averageDelta = (delta * kFpsSmoothing) + (averageDelta * (1.0 - kFpsSmoothing));
        let hertz = 1000.0 / averageDelta;
        if (hertz < curMinHertz || endOfLastFrame > expiryMinHertz) {
            curMinHertz = hertz;
            expiryMinHertz = endOfLastFrame + kMaxPersist;
        }

        startOfCurrentFrame = performance.now();
        if (fontGeometry) {
            fontGeometry.update(
                (firstInvisible * groupSize) + " objs " +
                delta.toFixed(1) + "(" + curMaxDelta.toFixed(1) + ") ms " +
                (1000.0 / averageDelta).toFixed(0) + "(" + curMinHertz.toFixed(0) + ") Hz");
        }


        renderer.render(scene, camera);
    });

function initVisibility(numVisible)
{
    firstInvisible = 0;
    for(firstInvisible = 0; firstInvisible < numVisible; firstInvisible++)
    {
        if (firstInvisible >= drawGroups.length)
            break;

        drawGroups[firstInvisible].visible = true;
    }
}
function updateVisibility(increment)
{
    if (increment)
    {
        if (firstInvisible < drawGroups.length)
        {
            drawGroups[firstInvisible].visible = true;
            firstInvisible++;
        }
    }
    else
    {
        if (firstInvisible > 0)
        {
            firstInvisible--;
            drawGroups[firstInvisible].visible = false;
        }
    }
}
