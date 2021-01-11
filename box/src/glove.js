import {doesCircleCollideWithOtherCircle} from "./circleCircleIntersection.js";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let dest = new THREE.Vector3();
let hitPoint = new THREE.Vector3();
let hitNormal = new THREE.Vector3();

let plane = new THREE.Plane(new THREE.Vector3(0.0, 0.0, 1.0), 1.0);
let line = new THREE.Line3();

let kBagPos = new THREE.Vector3(0.0, 0.0, -1.0);

const kGloveRadius = 0.1;
const kNewContactDelay = 0.25;

export class Glove extends THREE.Group
{
    constructor(controller, scene, whichHand)
    {
        super();
        this.controller = controller;
        
        //this.controller.getWorldPosition(this.position);
        //this.position.set(0.0, 1.0, 0.0);
        this.rotation.copy(this.controller.rotation);
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
                // for (let i = 0; i < gltf.scene.children.length; i++)
                // {
                //     let obj = gltf.scene.children[i];
                //     obj.castShadow = true;
                //     obj.receiveShadow = true;
                // }
                this.add(gltf.scene);
            });
    }

    update(dt, accumulatedTime)
    {
        
        this.rotation.copy(this.controller.rotation);

        // Try to move from current position to controller position
        this.controller.getWorldPosition(dest);
        // dest.x = 0.0;
        // dest.y = 1.0;
        // dest.z = -2.0;

        // Update velocity (i.e., how fast is controller we're slaved to moving)
        const oneOverDt = 1.0 / dt;
        this.velocity.x = (dest.x - this.position.x) * oneOverDt;
        this.velocity.y = (dest.y - this.position.y) * oneOverDt;
        this.velocity.z = (dest.z - this.position.z) * oneOverDt;

        

        // Check for collisions from current position to goal position

        let t;
        if (doesCircleCollideWithOtherCircle(this.position, dest, kGloveRadius, this.bag.position, this.bag.radius, hitPoint, t))
        {
            this.bag.processHit(this.velocity, hitPoint, this.whichHand, !this.inContactWithBag);

            let gamepad = this.controller.gamepad;
            if (gamepad != null && gamepad.hapticActuators != null)
            {
                let kIntensity = 1.0;
                let kMilliseconds = 10;
                let hapticActuator = gamepad.hapticActuators[0];
                if( hapticActuator != null)
                    hapticActuator.pulse( kIntensity, kMilliseconds );
            }

            this.position.copy(hitPoint);
            if (!this.inContactWithBag)
            {
                this.nextNewContactTime = accumulatedTime + kNewContactDelay;
            }
            this.inContactWithBag = true;
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