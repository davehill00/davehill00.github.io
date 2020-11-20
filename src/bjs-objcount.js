

const canvas = document.getElementById("renderCanvas"); // Get the canvas element
const engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine

let i;
const kSpread = 10;

var drawGroups = new Array();
const groupSize = 10;
//var currentGroup = new THREE.Group();
var groupCounter = 0;
var currentGroup = null;
var xr = null;
var leftController = null;
var rightController = null;
var rightTrigger = null;
var leftTrigger = null;


var createScene = async function () {

    var scene = new BABYLON.Scene(engine);
    var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.attachControl(canvas, true);
    var dirLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(2,-2,1), scene);
    dirLight.intensity = 0.75;
    currentGroup = new BABYLON.Node("group" + drawGroups.length, scene);

    var cubeMaterials = [new BABYLON.StandardMaterial("mat0", scene), new BABYLON.StandardMaterial("mat1", scene) ];
    cubeMaterials[0].diffuseColor = new BABYLON.Color3(1, 0.5, 0.1);
    cubeMaterials[1].diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);

    for (i = 0; i < kSpread * kSpread; i++) {
        let cube = new BABYLON.Mesh.CreateBox("cube"+i, 1.0);
        cube.material = cubeMaterials[i%2];
        let row = i % kSpread;
        let col = Math.floor(i / kSpread);
        cube.position.set(-kSpread + row * 2.0, -kSpread + col * 2.0, 3 * kSpread);
        cube.rotation.x = 0.707;
        cube.rotation.y = 0.707;
        cube.setParent(currentGroup);
        //currentGroup.addChild(cube);
        groupCounter++;

        if (groupCounter == groupSize)
        {
            currentGroup.setEnabled(false);
            drawGroups.push(currentGroup);
            currentGroup = new BABYLON.Node("group" + drawGroups.length, scene);
            groupCounter = 0;
        }
    }
    if (currentGroup.getChildren().length != 0)
    {
        currentGroup.setEnabled(false);
    }

    var firstInvisible = -1;
    initVisibility((kSpread*kSpread*0.25)/groupSize);




    //const env = scene.createDefaultEnvironment();

    xr = await scene.createDefaultXRExperienceAsync({
        //floorMeshes: [env.ground]
    });

    xr.input.onControllerAddedObservable.add((inputSource) => {
        inputSource.onMotionControllerInitObservable.add((controller) => {
            if (controller.handedness == "right")
            {
                rightController = controller;
                rightTrigger = rightController.getComponent("xr-standard-trigger");
            }
            else
            {
                leftController = controller;
                leftTrigger = leftController.getComponent("xr-standard-trigger");
            }
        });
    });

    return scene;
};

// Add your code here matching the playground format
let scene = null;
createScene().then((result) => {scene = result;})


//GUI
var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

var fpsText = new BABYLON.GUI.TextBlock();
fpsText.text = "FPS";
fpsText.color = "green";
fpsText.fontSize = 30;
fpsText.paddingTop = 10;
fpsText.paddingLeft = 10;

advancedTexture.addControl(fpsText);

fpsText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
fpsText.textVerticalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;




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


// Register a render loop to repeatedly render the scene

var endOfLastFrame = 0.0;
var startOfCurrentFrame = 0.0;
var averageDelta = 0.0;
const kFpsSmoothing = 0.10;
var curMaxDelta = 0.0;
var expiryMaxDelta = performance.now();
var curMinHertz = 90.0;
var expiryMinHertz = performance.now();
const kMaxPersist = 2000.0;

engine.runRenderLoop(function () {
        if (scene != null)
        {
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
            if (fpsText) {
                fpsText.text =
                    (firstInvisible * groupSize) + " objs\n" +
                    delta.toFixed(1) + "(" + curMaxDelta.toFixed(1) + ") ms\n" +
                    (1000.0 / averageDelta).toFixed(0) + "(" + curMinHertz.toFixed(0) + ") Hz";
            }


            updateInput();

            scene.render();
        }
});


function initVisibility(numVisible)
{
    firstInvisible = 0;
    for(firstInvisible = 0; firstInvisible < numVisible; firstInvisible++)
    {
        if (firstInvisible >= drawGroups.length)
            break;

        drawGroups[firstInvisible].setEnabled(true);
    }
}

function updateVisibility(increment)
{
    if (increment)
    {
        if (firstInvisible < drawGroups.length)
        {
            drawGroups[firstInvisible].setEnabled(true);
            firstInvisible++;
        }
    }
    else
    {
        if (firstInvisible > 0)
        {
            firstInvisible--;
            drawGroups[firstInvisible].setEnabled(false);
        }
    }
}

function updateInput()
{
    if (rightTrigger != null && rightTrigger.hasChanges)
    {
        if (rightTrigger.changes.pressed.previous && !rightTrigger.changes.pressed.current)
        {
            updateVisibility(true);
        }
    }
    if (leftTrigger != null && leftTrigger.hasChanges)
    {
        if (leftTrigger.changes.pressed.previous && !leftTrigger.changes.pressed.current)
        {
            updateVisibility(false);
        }
    }
}
