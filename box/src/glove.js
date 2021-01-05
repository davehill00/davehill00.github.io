import {doesCircleCollideWithOtherCircle} from "./circleCircleIntersection.js";

let dest = new THREE.Vector3();
let hitPoint = new THREE.Vector3();
let hitNormal = new THREE.Vector3();

let plane = new THREE.Plane(new THREE.Vector3(0.0, 0.0, 1.0), 1.0);
let line = new THREE.Line3();

let kBagPos = new THREE.Vector3(0.0, 0.0, -1.0);

const kGloveRadius = 0.1;

export class Glove extends THREE.Group
{
    constructor(controller, scene, whichHand)
    {
        super();
        this.controller = controller;
        
        //this.controller.getWorldPosition(this.position);
        this.position.set(0.0, 1.0, 0.0);
        this.velocity = new THREE.Vector3();
        this.radius = kGloveRadius;

        this.name = "Glove " + whichHand;
        this.whichHand = whichHand;

        this.scene = scene;
        scene.add(this);

        if (false)
        {
            let debugMesh = new THREE.Mesh(
                new THREE.SphereGeometry(kGloveRadius, 16, 8), 
                new THREE.MeshStandardMaterial( {
                    color: 0x802020, 
                    wireframe: true
                }));

            this.add(debugMesh);
        }
    }

    update(dt)
    {
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
            this.bag.processHit(this.velocity, hitPoint, this.whichHand);
            this.position.copy(hitPoint);
        }
        else
        {
            this.position.copy(dest);
        }
    }
}