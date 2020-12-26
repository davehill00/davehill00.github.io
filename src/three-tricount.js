import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';



let cfg_antialias = true;
let cfg_materialindex = 0; // 0 = simple, 1 = phong, 2 = standard, 3 = standard+normal
let cfg_lighting = 1;

parseUrlConfig();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// add camera to scene so that objects attached to the camera get rendered
scene.add(camera);

const renderer = new THREE.WebGLRenderer({ antialias: cfg_antialias });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
renderer.setClearColor(0x303030);

document.body.appendChild(renderer.domElement);
document.body.appendChild(VRButton.createButton(renderer));

const controls = new OrbitControls(camera, renderer.domElement);
controls.update();

if (cfg_materialindex > 0)
{
    if (cfg_lighting >= 1)
    {
        const directionalLight = new THREE.DirectionalLight(0xFFCCAF, 2.5);
        directionalLight.position.set(2, 2, 1);
        setDirectionalLightPositionFromBlenderQuaternion(directionalLight, -0.897, -0.160, -0.407, -0.065);
        scene.add(directionalLight);
    }
    if (cfg_lighting >= 2)
    {
        const dl2 = new THREE.DirectionalLight(0xFF696B, 0.3);
        setDirectionalLightPositionFromBlenderQuaternion(dl2, -0.014, -0.891, -0.408, 0.196);
        scene.add(dl2);
    }

    const light = new THREE.AmbientLight(0x302020); // soft white light
    scene.add(light);
}

const kSpread = 5;
const kRows = 7;
const kCols = 7;
const kColSpread = 1.5;
const kRowMaxHeight = 1.0;
const kRowSpread = 8.0;

var drawGroups = new Array();
const groupSize = 1;
var currentGroup = new THREE.Group();
var groupCounter = 0;
var firstInvisible = -1;
var numFaces = 0;

const loader = new GLTFLoader();
loader.load(cfg_materialindex == 3 ? './content/monkey-head-50k-normalmap.gltf' : './content/monkey-head-50k.gltf',
    function (gltf) {

        let monkeyHead = gltf.scene.children[0];
        numFaces = monkeyHead.geometry.index.count / 3;

        monkeyHead.material.side = THREE.FrontSide;
        let mat = monkeyHead.material;
        if (cfg_materialindex == 0)
        {
            mat = new THREE.MeshBasicMaterial({color:0xc200dc});
        }
        else if(cfg_materialindex == 1)
        {
            mat = new THREE.MeshPhongMaterial({color: 0x85650f, shininess:30});
        }

        let x, y;
        for (y = 0; y < kRows; y++) {
            for (x = 0; x < kCols; x++) {
                let monkey = new THREE.Mesh(monkeyHead.geometry, mat);
                monkey.position.set(-kColSpread * (kCols - 1) * 0.5 + x * kColSpread, kRowMaxHeight - y * kRowSpread / kRows, -6.0 * kColSpread);
                monkey.scale.set(0.5, 0.5, 0.5);
                currentGroup.add(monkey);
                groupCounter++;

                if (groupCounter == groupSize) {
                    scene.add(currentGroup);
                    currentGroup.visible = false;
                    drawGroups.push(currentGroup);
                    currentGroup = new THREE.Group();
                    groupCounter = 0;
                }
            }
        }
        if (currentGroup.children.length != 0) {
            scene.add(currentGroup);
            currentGroup.visible = false;
        }

        initVisibility(14);

    }, function (xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    }, function (error) {
        console.error(error);
    });


var createGeometry = require('three-bmfont-text')
var loadFont = require('load-bmfont')

var fontGeometry;
var fontMesh;


loadFont('content/arial.fnt', function (err, font) {
    // create a geometry of packed bitmap glyphs,
    // word wrapped to 300px and right-aligned
    fontGeometry = createGeometry({
        width: 350,
        align: 'right',
        font: font
    })

    // the texture atlas containing our glyphs
    var texture = new THREE.TextureLoader().load('content/arial_0.png');

    // we can use a simple ThreeJS material
    var fontMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        color: 0xffffff
    });

    // scale and position the mesh to get it doing something reasonable
    fontMesh = new THREE.Mesh(fontGeometry, fontMaterial);
    fontMesh.position.set(0, -0.75, -3);
    fontMesh.scale.set(0.002, 0.002, 0.002);
    fontMesh.rotation.set(3.14, 0, 0);

    camera.add(fontMesh);


    let messageGeo = createGeometry({
        width: 1000,
        align: 'center',
        font: font
    });
    messageGeo.update("Use L and R triggers to increase or decrease the number of objects rendered.")
    let messageMesh = new THREE.Mesh(messageGeo, fontMaterial);
    messageMesh.position.set(-1.7, 2.0, -5);
    messageMesh.scale.set(0.0035, 0.0035, 0.0035);
    messageMesh.rotation.set(3.14, 0.0, 0.0);

    scene.add(messageMesh);
});

function onSelectEnd(event) {
    let increment = event.data.handedness == "right";
    updateVisibility(increment);
}

const controllerModelFactory = new XRControllerModelFactory();
const controllerGrip0 = renderer.xr.getControllerGrip(0);
const model0 = controllerModelFactory.createControllerModel(controllerGrip0);
controllerGrip0.add(model0);
//scene.add( controllerGrip0 );
const controllerGrip1 = renderer.xr.getControllerGrip(1);
const model1 = controllerModelFactory.createControllerModel(controllerGrip1);
controllerGrip1.add(model1);
//scene.add( controllerGrip1 );

const controller0 = renderer.xr.getController(0);
controller0.addEventListener('selectend', onSelectEnd);
const controller1 = renderer.xr.getController(1);
controller1.addEventListener('selectend', onSelectEnd);


document.onkeydown = function (e) {
    switch (e.key) {
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
                (firstInvisible * groupSize * numFaces) + " tris " +
                delta.toFixed(1) + "(" + curMaxDelta.toFixed(1) + ") ms " +
                (1000.0 / averageDelta).toFixed(0) + "(" + curMinHertz.toFixed(0) + ") Hz");
        }
        renderer.render(scene, camera);
    });

function initVisibility(numVisible) {
    firstInvisible = 0;
    for (firstInvisible = 0; firstInvisible < numVisible; firstInvisible++) {
        if (firstInvisible >= drawGroups.length)
            break;

        drawGroups[firstInvisible].visible = true;
    }
}

function updateVisibility(increment) {
    if (increment) {
        if (firstInvisible < drawGroups.length) {
            drawGroups[firstInvisible].visible = true;
            firstInvisible++;
        }
    }
    else {
        if (firstInvisible > 0) {
            firstInvisible--;
            drawGroups[firstInvisible].visible = false;
        }
    }
}

function parseUrlConfig()
{
    let queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    if (urlParams.has('AA'))
    {
        cfg_antialias = (urlParams.get('AA') == 'true') ? true : false;
        console.log("set cfg_antialias to: " + cfg_antialias);
    }
    if (urlParams.has('MAT'))
    {
        let matIndex = urlParams.get('MAT');
        if (0 <= matIndex && matIndex <= 3)
        {
            cfg_materialindex = matIndex;
            console.log("set cfg_materialindex to: " + cfg_materialindex);
        }
        else
        {
            console.log("invalid material index: " + matIndex);
        }
    }
    if (urlParams.has("LIGHT"))
    {
        let numLights = urlParams.get("LIGHT");
        if (0 <= numLights && numLights <= 2)
        {
            cfg_lighting = numLights;
            console.log("set cfg_lighting to: " + cfg_lighting);
        }
        else
        {
            console.log("invalid light value: " + numLights);
        }
    }
}

function setDirectionalLightPositionFromBlenderQuaternion(light, bQuatW, bQuatX, bQuatY, bQuatZ)
{
    const quaternion = new THREE.Quaternion(bQuatX, bQuatZ, -bQuatY, bQuatW);
    light.position.set(0.0, 20.0, 0.0);
    light.position.applyQuaternion(quaternion);
}