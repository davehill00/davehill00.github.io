/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/bjs-objcount.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/bjs-objcount.js":
/*!*****************************!*\
  !*** ./src/bjs-objcount.js ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports) {



const canvas = document.getElementById("renderCanvas"); // Get the canvas element
const engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine

let i;
const kSpread = 10;

var drawGroups = new Array();
const groupSize = 10;
//var currentGroup = new THREE.Group();
var groupCounter = 0;
var currentGroup = null;


var createScene = async function () {

    var scene = new BABYLON.Scene(engine);
    var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.attachControl(canvas, true);
    var dirLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-2,-2,1), scene);
    dirLight.intensity = 0.75;
    // var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
    // light.intensity = 0.7;
    //var sphere = BABYLON.Mesh.CreateSphere("sphere1", 16, 2, scene);
    //sphere.position.y = 1;
    currentGroup = new BABYLON.Node("group" + drawGroups.length, scene);

    // var box = BABYLON.Mesh.CreateBox("")

    // const boxGeometry = new THREE.BoxGeometry();
    // const boxMaterials = [new THREE.MeshPhysicalMaterial({ color: 0xff8020 }), new THREE.MeshPhysicalMaterial({ color: 0xaaaaaa })];


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
        // currentGroup.addChild(cube);
        // groupCounter++;

        // if (groupCounter == groupSize)
        // {
        //     currentGroup.setEnabled(false); // = false;
        //     drawGroups.push(currentGroup);
        //     currentGroup = new BABYLON.Node("group" + drawGroups.length, scene);
        //     groupCounter = 0;
        // }
    }
    // if (currentGroup.getChildren().length != 0)
    // {
    //     //scene.add(currentGroup);
    //     currentGroup.setEnabled(true);
    // }

// var firstInvisible = -1;
// initVisibility((kSpread*kSpread*0.25)/groupSize);




    //const env = scene.createDefaultEnvironment();

    const xr = await scene.createDefaultXRExperienceAsync({
        //floorMeshes: [env.ground]
    });

    return scene;
};

// Add your code here matching the playground format
let scene = null;
createScene().then((result) => {scene = result;})


/*new BABYLON.Scene(engine);
const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 3, new BABYLON.Vector3(0, 0, 0), scene);
camera.attachControl(canvas, true);
const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
const box = BABYLON.MeshBuilder.CreateBox("box", {}, scene);
const env = scene.createDefaultEnvironment();

const xr = await scene.createDefaultXRExperienceAsync({
    floorMeshes: [env.ground]
});
*/


// Register a render loop to repeatedly render the scene
engine.runRenderLoop(function () {
        if (scene != null)
            scene.render();
});


/***/ })

/******/ });
//# sourceMappingURL=main-bjs-objcount.js.map