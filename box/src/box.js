import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import * as CANNON from 'cannon-es';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

var inputProfilesList = require( "@webxr-input-profiles/registry/dist/profilesList.json");

import { fetchProfile, MotionController } from '@webxr-input-profiles/motion-controllers';

const uri = './profiles/';
const motionControllers = {};
let controllers=[];

let scene = null;
let camera = null;
let renderer = null;
let clock = null;
let accumulatedTime = 0.0;
let physicsWorld = null;
let threeJsObjectsWithPhysics = [];
let bagPhys = null;

let leftHand = {};
let rightHand = {};

initialize();

function initialize()
{
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 10.0;
    camera.position.y = 2.0;
    // add camera to scene so that objects attached to the camera get rendered
    scene.add(camera);

    renderer = new THREE.WebGLRenderer( {antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    let color = new THREE.Color(0x808080);
    color.convertSRGBToLinear();
    renderer.setClearColor(color);
    renderer.physicallyCorrectLights = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    // renderer.shadowMap.enabled = true;
    // renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    document.body.appendChild(renderer.domElement);
    let button = VRButton.createButton(renderer);
    document.body.appendChild(button);

    clock = new THREE.Clock();


    renderer.xr.addEventListener( 'sessionstart', onSessionStart);
    renderer.xr.addEventListener( 'sessionend', onSessionEnd);



    const directionalLight = new THREE.DirectionalLight(0xffccaa, 2.5);
    directionalLight.color.convertSRGBToLinear();
    setDirectionalLightPositionFromBlenderQuaternion(directionalLight, 0.923, 0.320, 0.060, -0.205);
    scene.add(directionalLight);



    //--------------------------------------
    // Set up physics
    physicsWorld = new CANNON.World(
        {gravity: new CANNON.Vec3(0.0, -9.8, 0.0),
        }
    );


    physicsWorld.addEventListener("beginContact", (evt) => {
        console.log(evt.bodyA + " begin contact with " + evt.bodyB );
        handlePhysicsContact(evt);
    });


    physicsWorld.addEventListener("endContact", (evt) => {
        console.log(evt.bodyA + " end contact with " + evt.bodyB );
        handlePhysicsContact(evt);
    });


    let groundMesh = new THREE.Mesh(
        new THREE.BoxGeometry(4.0, 0.1, 4.0), 
        new THREE.MeshStandardMaterial( {color: 0x303030, roughness: 0.7}));
    scene.add(groundMesh);
    let physGround = new CANNON.Body( {
        type: CANNON.Body.STATIC,
    } );

    physGround.addShape(new CANNON.Box(new CANNON.Vec3(4.0, 0.1, 4.0)));
    physicsWorld.addBody(physGround);
    attachPhysicsObjectToThreeJsObject(physGround, groundMesh, false);
  
  

    // let box = new THREE.BoxGeometry(1, 1, 1);
    // let boxMat = new THREE.MeshStandardMaterial( {color: 0x808080} );
    // let boxMesh = new THREE.Mesh(box, boxMat);
    // boxMesh.position.y = 8.0;

    // scene.add(boxMesh);

    // boxMesh.physicsObj = new CANNON.Body( {
    //     type: CANNON.Body.DYNAMIC,
    //     mass: 1.0,
    // });
    // boxMesh.physicsObj.addShape(new CANNON.Box( new CANNON.Vec3(0.5, 0.5, 0.5)));
    // boxMesh.physicsObj.position.copy(boxMesh.position);
    // boxMesh.physicsObj.quaternion.copy(boxMesh.quaternion);
    // boxMesh.physicsObj.angularVelocity.set(0.0, 0.3, 0.2);
    // boxMesh.physicsObj.velocity.set(0.0, -15.0, 0.0);
    // boxMesh.physicsObj.addEventListener("collide", (evt) => {
    //     console.log(evt);
    // });
    // physicsWorld.addBody(boxMesh.physicsObj);
    // threeJsObjectsWithPhysics.push(boxMesh);

    if (true)
    {

    let bagMat = new THREE.MeshStandardMaterial(
        {
            color:0x202020,
            roughness: 0.5,
            metalness: 0.1
        }
    );
    let bagGeo = new THREE.CylinderGeometry(0.25, 0.25, 1.0, 32);
    let bagMesh = new THREE.Mesh(bagGeo, bagMat);
    bagMesh.position.y = 1.5;
    bagMesh.position.z = -1.0;
    scene.add(bagMesh);
    let bagPhysMat = new CANNON.Material({
        restitution: 0.1
    });
    bagPhys = new CANNON.Body( 
        {
            type: CANNON.Body.DYNAMIC, 
            mass: 1.0,
            angularDamping: 0.991,
            material: bagPhysMat,
            allowSleep: false

            //linearDamping: 0.995
        }
    );
    bagPhys.addShape(new CANNON.Cylinder(0.25, 0.25, 1.0, 12.0));
    bagPhys.addEventListener("collide", (evt) => {
        console.log("BAG HIT: " + evt);
    });
    attachPhysicsObjectToThreeJsObject(bagPhys, bagMesh);
    physicsWorld.addBody(bagPhys);
    
    let attachMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), bagMat);
    attachMesh.position.set(0.0, 2.8, -1.0);
    scene.add(attachMesh);
    let bagAttachPhys = new CANNON.Body(
        {
            type: CANNON.Body.STATIC,
            mass: 0
        }
    );
    attachPhysicsObjectToThreeJsObject(bagAttachPhys, attachMesh, false);
    physicsWorld.addBody(bagAttachPhys);

    let bagConstraint = new CANNON.PointToPointConstraint(
        bagPhys, new CANNON.Vec3(0.0, 1.0, 0.0),
        bagAttachPhys, new CANNON.Vec3(0.0, 0.0, 0.0));
    physicsWorld.addConstraint(bagConstraint);
    }

   
    document.onkeydown = function (e) {
        switch (e.key) {
            case ",":
                bagPhys.applyImpulse(new CANNON.Vec3(50.5, 0.0, 1.5),
                    new CANNON.Vec3(0.0, 0.0, 0.25));
                break;
            case ".":
                bagPhys.applyImpulse(new CANNON.Vec3(-50.5, 0.0, 1.5),
                    new CANNON.Vec3(0.0, 0.0, 0.25));
                break;
        }
    };

    const controllerModelFactory = new XRControllerModelFactory();
    controllers.push(renderer.xr.getControllerGrip( 0 ));
    let con0 = renderer.xr.getControllerGrip(0);
    con0.add(controllerModelFactory.createControllerModel(con0));
    scene.add(con0);
    scene.add( controllers[0] );
    
    renderer.xr.getControllerGrip(0).addEventListener("connected", (evt) => {
        console.log("Got Gamepad for Controller 0: " + evt.data.handedness );
        controllers[0].gamepad = evt.data.gamepad;
        if (evt.data.handedness == "left")
        {
            leftHand.controller = controllers[0];
            setupHand(leftHand);
        }
        else
        {
            rightHand.controller = controllers[0];
            setupHand(rightHand);
        }
    });
    renderer.xr.getControllerGrip(0).addEventListener("disconnected", (evt) => {
        console.log("Lost Gamepad for Controller 0");
        controllers[0].gamepad = null;
        
    });

    controllers.push(renderer.xr.getControllerGrip( 1 ));
    scene.add( controllers[1] );
    let con1 = renderer.xr.getControllerGrip(1);
    con1.add(controllerModelFactory.createControllerModel(con1));
    scene.add(con1);
    //controllers[1].add(controllerModelFactory.createControllerModel(controllers[1]));
   
    renderer.xr.getControllerGrip(1).addEventListener("connected", (evt) => {
        console.log("Got Gamepad for Controller 1: " + evt.data.handedness);
        controllers[1].gamepad = evt.data.gamepad;
        if (evt.data.handedness == "left")
        {
            leftHand.controller = controllers[1];
            setupHand(leftHand);
        }
        else
        {
            rightHand.controller = controllers[1];
            setupHand(rightHand);
        }

    });
    renderer.xr.getControllerGrip(1).addEventListener("disconnected", (evt) => {
        console.log("Lost Gamepad for Controller 1");
        controllers[1].gamepad = null;
    });

 


    renderer.setAnimationLoop(render); 
}

const kPhysTimeStep = 1.0/240.0;
function render() {
    let dt = Math.min(clock.getDelta(), 0.0333);
    accumulatedTime += dt;
    // renderer.inputManager.update(dt, accumulatedTime);
    //TWEEN.update(accumulatedTime);

    updateHands(dt);

    physicsWorld.step(kPhysTimeStep,dt,100);
    for(let obj of threeJsObjectsWithPhysics)
    {
        obj.position.copy(obj.physicsObj.position);
        obj.quaternion.copy(obj.physicsObj.quaternion);

    }
    renderer.render(scene, camera);
}

export function setDirectionalLightPositionFromBlenderQuaternion(light, bQuatW, bQuatX, bQuatY, bQuatZ)
{

    const quaternion = new THREE.Quaternion(bQuatX, bQuatZ, -bQuatY, bQuatW);
    

    // const kDegToRad = 0.01745329252;
    // let euler = new THREE.Euler((xDeg) * kDegToRad, (yDeg) * kDegToRad, zDeg * kDegToRad);
    light.position.set(0.0, 20.0, 0.0);
    light.position.applyQuaternion(quaternion);
    //console.log("LIGHT POS: " + light.position.x * 20.0 + ", " + light.position.y * 20.0 + ", " + light.position.z * 20.0 );
}

function attachPhysicsObjectToThreeJsObject(physicsObject, threeObj, isDynamic = true)
{
    threeObj.physicsObj = physicsObject;
    physicsObject.position.copy(threeObj.position);
    physicsObject.quaternion.copy(threeObj.quaternion);
    if (isDynamic)
        threeJsObjectsWithPhysics.push(threeObj);
}

function onSessionStart()
{
    //renderer.xr.getSession().addEventListener('inputsourceschange', onInputSourcesChange);
}

function onSessionEnd()
{
    //renderer.xr.getSession().removeEventListener('inputsourceschange', onInputSourcesChange);
}



function setupHand(hand)
{
    hand.mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.25, 0.15), 
        new THREE.MeshStandardMaterial(
            {
                color: 0x802020,
                //wireframe: true
            }
        )
    );
    hand.mesh.rotation.set(0.78, 0.0, 0.0);
    hand.controller.add(hand.mesh);

    // hand.controller.add(new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.02), new THREE.MeshBasicMaterial({color: 0x800080})));
    // let glovePhysicsShape = new CANNON.Box(new CANNON.Vec3(0.1, 0.1, 0.15));
    // let glovePhysicsBody = new CANNON.Body( 
    //     {
    //         type: CANNON.Body.DYNAMIC, 
    //         mass: 1,
    //         //linearDamping: 0.999,
    //         //angularDamping: 0.999,
    //         //fixedRotation: true
    //     }
    // );
    // glovePhysicsBody.addShape(glovePhysicsShape);
    // physicsWorld.addBody(glovePhysicsBody);

    // let debugMesh = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.35), new THREE.MeshBasicMaterial(
    //     {color: 0x800080, wireframe: true}
    // ));
    // debugMesh.position.set(0.0, 0.0, 0.0);
    // scene.add(debugMesh);
    //
    // attachPhysicsObjectToThreeJsObject(glovePhysicsBody, debugMesh, true);

    let handAttachShape = new CANNON.Box(new CANNON.Vec3(0.075, 0.125, 0.075));
    let handAttachBody = new CANNON.Body(
        {
            type: CANNON.Body.STATIC,
            mass: 0,
            collisionResponse: false,
        }
    );
    handAttachBody.addShape(handAttachShape);
    handAttachBody.addEventListener("collide", (evt) => {
        // I want a force that is enough to reverse the velocity of the bag and make it match the hand
        // Project -ve bag velocity onto hand velocity vector, then add hand velocity vector.
        console.log(evt);

        let bag = null;
        let bag_ri = null;
        let glove = null;
        let glove_ri = null;
        let bagContactNormal = null;
        if (evt.contact.bi.id == 1)
        {
            bag = evt.contact.bi;
            bagContactNormal = evt.contact.ni;
            bag_ri = evt.contact.ri;
            glove = evt.contact.bj;
            glove_ri = evt.contact.rj;
        }
        else if (evt.contact.bj.id == 1)
        {
            bag = evt.contact.bj;
            bagContactNormal = evt.contact.ni.negate();
            bag_ri = evt.contact.rj;
            glove = evt.contact.bi;
            glove_ri = evt.contact.ri;
        }

        if (bag)
        {
            let bagVel = bagContactNormal.scale(bag.velocity.dot(bagContactNormal));
            let contactPoint = bag.position.vadd(bag_ri);
            let finalVel = new CANNON.Vec3();
            bagVel.vadd(glove.velocity.negate(), finalVel);
            bag.applyImpulse(finalVel, contactPoint); //glove.velocity.negate(), evt.contact.bi.position.vadd(evt.contact.ri));
        }

            //it's the bag
            //evt.target.applyImpulse(evt.body.velocity, );
        //}


    })
    physicsWorld.addBody(handAttachBody);

    
    // let constraint = new CANNON.LockConstraint(handAttachBody, glovePhysicsBody);
    // constraint.collideConnected = false;
    // physicsWorld.addConstraint(constraint);

    hand.physicsBody = handAttachBody;
    attachPhysicsObjectToThreeJsObject(handAttachBody, hand.mesh, false);
    
    hand.lastWorldPos = new THREE.Vector3();
    //@TODO - compute last world pos to initialize properly

    hand.isSetUp = true;

    //updateHands();
}

let _handPos = new THREE.Vector3();
let _handQuat = new THREE.Quaternion();
let _handVel = new THREE.Vector3();

function updateHands(dt)
{
    const kAddVelocity = true;

    const scale = 1.0;
    let oneOverDt = 1.0 / dt;
    oneOverDt *= scale;

    if (leftHand.isSetUp)
    {
        leftHand.mesh.getWorldPosition(_handPos);
        leftHand.physicsBody.position.copy(_handPos);
        leftHand.mesh.getWorldQuaternion(_handQuat);
        leftHand.physicsBody.quaternion.copy(_handQuat);

        if (kAddVelocity)
        {
            _handVel.x = (_handPos.x - leftHand.lastWorldPos.x) * oneOverDt;
            _handVel.y = (_handPos.y - leftHand.lastWorldPos.y) * oneOverDt;
            _handVel.z = (_handPos.z - leftHand.lastWorldPos.z) * oneOverDt;
            leftHand.physicsBody.velocity.copy(_handVel);
            leftHand.lastWorldPos.copy(_handPos);
        }
    }

    if (rightHand.isSetUp)
    {
        rightHand.mesh.getWorldPosition(_handPos);
        rightHand.physicsBody.position.copy(_handPos);
        rightHand.mesh.getWorldQuaternion(_handQuat);
        rightHand.physicsBody.quaternion.copy(_handQuat);

        if (kAddVelocity)
        {
            _handVel.x = (_handPos.x - rightHand.lastWorldPos.x) * oneOverDt;
            _handVel.y = (_handPos.y - rightHand.lastWorldPos.y) * oneOverDt;
            _handVel.z = (_handPos.z - rightHand.lastWorldPos.z) * oneOverDt;
            rightHand.physicsBody.velocity.copy(_handVel);
            rightHand.lastWorldPos.copy(_handPos);
        }
    }
}

function handlePhysicsContact(event)
{
    let bodyA = event.bodyA;
    let bodyB = event.bodyB;
    if (bodyA == leftHand.physicsBody || bodyA == rightHand.physicsBody)
    {
        console.log("BODY A is a hand");

    }
    else if (bodyB == leftHand.physicsBody || bodyB == rightHand.physicsBody)
    {
        console.log("BODY B is a hand");
    }
}



// function onInputSourcesChange(event) {
//     event.added.forEach((xrInputSource) => {
//         createMotionController(xrInputSource);
//     });
// };

// async function createMotionController(xrInputSource) {
//     const { profile, assetPath } = await fetchProfile(xrInputSource, uri);
//     const motionController = new MotionController(xrInputSource, profile, assetPath);
//     motionControllers[xrInputSource] = motionController;
//     addMotionControllerToScene(motionController);
//   }

//   function addMotionControllerToScene(motionController)
//   {
//       console.log(motionController);

//       if(motionController.xrInputSource.handedness == "left")
//       {
          
//       }

//   }