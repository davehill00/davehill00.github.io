import {doesCircleCollideWithOtherCircle} from "./circleCircleIntersection.js";
import {doesSphereCollideWithOtherSphere, HitResult} from "./sphereSphereIntersection.js";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let dest = new THREE.Vector3();
let hitResult = new HitResult();

let plane = new THREE.Plane(new THREE.Vector3(0.0, 0.0, 1.0), 1.0);
let line = new THREE.Line3();

let kBagPos = new THREE.Vector3(0.0, 0.0, -1.0);

const kGloveRadius = 0.08;
const kNewContactDelay = 0.15;

function consoleWithNoSource(...params) {
    setTimeout(console.log.bind(console, ...params));
  }

export class Glove extends THREE.Group
{
    constructor(scene, whichHand)
    {
        super();

        this.controller = null;

        this.velocity = new THREE.Vector3();
        this.radius = kGloveRadius;

        this.name = "Glove " + whichHand;
        this.whichHand = whichHand;

        this.inContactWithBag = false;
        this.nextNewContactTime = -1.0;

        this.scene = scene;
        scene.add(this);

        if (false)
        {
            let debugMesh = new THREE.Mesh(
                new THREE.SphereGeometry(kGloveRadius, 8, 5), 
                new THREE.MeshBasicMaterial( {
                    color: 0x802020, 
                    wireframe: true
                }));

            this.add(debugMesh);
        }

        let whichMesh = whichHand == 1 ? "./content/glove_v1_left.gltf" : "./content/glove_v1_right.gltf";
        let loaderPromise = new Promise( resolve => {
            let loader = new GLTFLoader();
            loader.load(whichMesh, resolve);
        });
        loaderPromise.then(
            gltf => {
                // gltf.scene.scale.set(0.3, 0.3, 0.3);
                // gltf.scene.rotation.set(-1.57, whichHand == 1 ? -1.57 : 1.57, 0.0);
                // gltf.scene.position.set(0.0, 0.0, 0.0);
                for (let i = 0; i < gltf.scene.children.length; i++)
                {
                    let obj = gltf.scene.children[i];
                    // obj.castShadow = true;
                    // obj.receiveShadow = true;
                    this.mesh = obj;
                    obj.name = "GLOVE " + (whichHand == 1? "LEFT " : "RIGHT " + i )
                    obj.material.roughness = 0.4;
                    obj.material.envMapIntensity = 0.7;
                }
                gltf.scene.renderOrder = 0; // render before everything else
                this.add(gltf.scene);
                this.mesh = gltf.scene.children[0];
                // this.mesh.visible = false;
            });
    }

    setController(controller)
    {
        this.controller = controller;
        this.rotation.copy(this.controller.rotation);
        this.isSetUp = true;
        this.show();
    }

    show()
    {
        console.assert(this.mesh);
        this.mesh.visible = true;
    }
    hide()
    {
        console.assert(this.mesh);
        this.mesh.visible = false;
    }

    isInContactWithBag()
    {
        return this.inContactWithBag;
    }

    registerBagContact(accumulatedTime)
    {
        if (!this.inContactWithBag)
        {
            this.nextNewContactTime = accumulatedTime + kNewContactDelay;
        }
        this.inContactWithBag = true;
    }

    playImpactHaptic()
    {
        let gamepad = this.controller.gamepad;
        if (gamepad != null && gamepad.hapticActuators != null)
        {
            let kIntensity = 1.0;
            let kMilliseconds = 20; //16;
            let hapticActuator = gamepad.hapticActuators[0];
            if( hapticActuator != null)
            {
                hapticActuator.pulse( kIntensity, kMilliseconds );
                // console.log("FIRE PULSE ON HIT: " + kIntensity + ", " + kMilliseconds);
            }
        }
    }

    update(dt, accumulatedTime)
    {
        
        if (this.mesh != null && this.scene.envMap != null && this.mesh.material.envMap == null)
        {
            this.mesh.material.envMap = this.scene.envMap;
        }

        this.rotation.copy(this.controller.rotation);

        // Try to move from current position to controller position
        this.controller.getWorldPosition(dest);

        // Update velocity (i.e., how fast is controller we're slaved to moving)
        const oneOverDt = 1.0 / dt;
        this.velocity.x = (dest.x - this.position.x) * oneOverDt;
        this.velocity.y = (dest.y - this.position.y) * oneOverDt;
        this.velocity.z = (dest.z - this.position.z) * oneOverDt;

        


        // Check for collisions from current position to goal position    
        let hit = false;
        let bag = null;
        if (this.heavyBag.visible)
        {
            bag = this.heavyBag;
            hit = doesCircleCollideWithOtherCircle(this.position, dest, kGloveRadius, bag.position, bag.radius, hitResult);

        }
        else if (this.doubleEndedBag.visible)
        {
            bag = this.doubleEndedBag;
            hit = doesSphereCollideWithOtherSphere(this.position, dest, kGloveRadius, bag.position, bag.radius, hitResult);
        }

        if (false && this.whichHand == 2)
        {
            consoleWithNoSource(
                accumulatedTime + ", " + this.controller.linearVelocity.x + ", " + this.controller.linearVelocity.y + ", " + this.controller.linearVelocity.z + ", " +
                this.controller.angularVelocity.x + ", " + this.controller.angularVelocity.y + ", " + this.controller.angularVelocity.z + ", " + 
                this.controller.gamepad.buttons[0].pressed + ", " + (hit ? 1 : 0)
            );
        }

        if ( hit )
        {
            let velocity;
            if (this.controller.hasLinearVelocity)
            {
                velocity = this.controller.linearVelocity;
            }
            else
            {
                velocity = this.velocity;
            }

            bag.processHit(this, velocity, hitResult.hitPoint, hitResult.hitNormal, accumulatedTime);

            this.position.copy(hitResult.hitPoint);
        }
        else
        {
            if (accumulatedTime > this.nextNewContactTime)
            {
                this.inContactWithBag = false;
            }

            this.position.copy(dest);
        }
    }
}