import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {ApplyPDVec3, ComputePDAcceleration} from "./pdacceleration.js";
import {doesCircleCollideWithOtherCircle} from "./circleCircleIntersection.js";
import {doesSphereCollideWithOtherSphere} from "./sphereSphereIntersection.js";
import { BlendingDstFactor, BlendingEquation, BlendingSrcFactor } from 'three';

let desiredPosition = new THREE.Vector3();
let desiredVelocity = new THREE.Vector3();

let leftHitPoint = new THREE.Vector3();
let leftHitNormal = new THREE.Vector3();
let rightHitPoint = new THREE.Vector3();
let rightHitNormal = new THREE.Vector3();

const kBagRadius = 0.15;
const kMinPunchSoundVelocitySq = 0.25 * 0.25; //1.5 * 1.5;
const kPunchEffectFadeRate = 4.0;
const kInconsequentialMovementSq = 0.01 * 0.01;

let tVec0 = new THREE.Vector3();
let hitNormal = new THREE.Vector3();


export class DoubleEndedBag extends THREE.Group
{
    constructor(audioListener, scene, camera, renderer)
    {
        super();
        this.velocity = new THREE.Vector3();
        this.targetVelocity = new THREE.Vector3(0.0, 0.0, 0.0);
        this.targetPosition = new THREE.Vector3(0.0, 1.55, -0.75);
        this.targetHeightVelocity = 0.0;
        this.targetHeight = this.targetPosition.y;
        this.position.copy(this.targetPosition);

        this.rotationValue = 0.0;
        this.rotationVelocity = 0.0;

        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        
        this.hitMeshDebug = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), new THREE.MeshBasicMaterial({color: 0xff00ff}));
        scene.add(this.hitMeshDebug);
        this.hitMeshDebug.visible = false;

        this.radius = kBagRadius;
        this.accumulatedTime = 0.0;

        this.cooldownAfterHit = 0.0;

        this.bHasGloves = false;

        this.punchEffectGeometry = null;
        this.punchEffectMaterial = null;
        this.punchEffects = [];

        let loaderPromise = new Promise( resolve => {
            let loader = new GLTFLoader();
            loader.load('./content/double_ended_bag.gltf', resolve);
        });
        loaderPromise.then(
            gltf => {
                for (let i = gltf.scene.children.length - 1; i >=0 ; i--)
                {
                    let obj = gltf.scene.children[i];
                    
                    
                    console.log("BAG " + i + ":" + obj.name);


                    if (obj.name == "Bag")
                    {
                        this.mesh = obj;
                        obj.name = "BAG " + i;
                        obj.material.roughness = 0.25;
                        obj.material.envMapIntensity = 0.5;
                        obj.material.envMap = this.scene.envMap;
                    }
                    // else if (obj.name == "PunchEffectMesh")
                    // {
                    //     this.punchEffectGeometry = obj.geometry;
                    //     this.punchEffectMaterial = obj.material;
                    //     this.punchEffectMaterial = new THREE.MeshBasicMaterial( 
                    //         {
                    //             color: 0x77210B,
                    //             //color: 0x404040,
                    //             map: obj.material.map,
                    //             depthWrite: false,
                    //             blending: THREE.AdditiveBlending,
                    //         });
                    //     this.punchEffectMaterial.color.convertSRGBToLinear();
                    //     this.punchEffectMaterial.name = "PunchEffectMaterial";

                    //     let bag = obj.parent;
                    //     obj.parent.remove(obj);
                    //     obj.parent = null;

                        
                    //     for (let i = 0; i < 6; i++)
                    //     {
                    //         let pe = new THREE.Mesh(this.punchEffectGeometry, this.punchEffectMaterial.clone());
                    //         pe.name = "Punch Effect Mesh " + i;
                    //         pe.rotation.set(0.0, i * 0.87, 0.0);
                    //         pe.scale.set(1.00, 1.00, 1.00);
                    //         //pe.position.setY(i*0.1);
                    //         pe.visible = false;
                    //         bag.add(pe);
                    //         this.punchEffects[i] = pe;
                    //     }
                    //     this.nextPunchEffect = 0;
                    // }
                }
                //gltf.scene.scale.set(0.5, 0.5, 0.5);
                this.add(gltf.scene);

                //this.add(new THREE.Mesh(new THREE.SphereBufferGeometry(kBagRadius, 32, 16), new THREE.MeshStandardMaterial({color: 0x000000, envMap: this.scene.envMap, envMapIntensity: 0.5, roughness: 0.25})));
            });




        this.hitSoundBuffers = [];
        this.hitSounds = [
            new THREE.PositionalAudio(audioListener),
            new THREE.PositionalAudio(audioListener),
            new THREE.PositionalAudio(audioListener),
            new THREE.PositionalAudio(audioListener),
            new THREE.PositionalAudio(audioListener),
            new THREE.PositionalAudio(audioListener),
        ];
        this.nextSoundIndex = 0;

        for (let hitSound of this.hitSounds)
        {
            hitSound.setRefDistance(40);
            hitSound.setVolume(1.0);
        }

        var audioLoader = new THREE.AudioLoader();
        audioLoader.load('./content/trim-Punch-Kick-A1-www.fesliyanstudios.com.mp3', (buffer) => {
            this.hitSoundBuffers.push(buffer);
        });



        //this.add(mesh);

        this.punchCallbacks = [];
    }

    setGloves(leftGlove, rightGlove)
    {
        this.leftGlove = leftGlove;
        this.rightGlove = rightGlove;
        this.bHasGloves = true;
    }

    update(dt, accumulatedTime)
    {

        // if (this.mesh != null && this.scene.envMap != null && this.mesh.material.envMap == null)
        // {
        //     this.mesh.material.envMap = this.scene.envMap;
        //     console.log("SET BAG ENVMAP");
        // }
        this.accumulatedTime = accumulatedTime;
        this.cooldownAfterHit += dt;

        if (this.renderer && this.renderer.xr && this.renderer.xr.isPresenting)
        {
            let xrCamera = this.renderer.xr.getCamera(this.camera);
            xrCamera.getWorldPosition(tVec0);

            let desiredHeight = tVec0.y; // + 2.0 * kBagRadius;

            let delta = desiredHeight - this.targetHeight;
            if (Math.abs(delta) > 0.15)
            {               
                this.targetHeight = desiredHeight;
            }

            //this.targetHeight = tVec0.y - 0.25;
            let heightAccel = ComputePDAcceleration(this.targetPosition.y, this.targetHeightVelocity,
                this.targetHeight, 0.0, 0.25, 2.0, dt);
            this.targetHeightVelocity += heightAccel * dt;
            this.targetPosition.y += this.targetHeightVelocity * dt;
        
        }

        desiredPosition.copy(this.position);
        desiredVelocity.copy(this.velocity);


        // frequency -- how quickly it tries to move back to the target position.
        // high numbers -> very fast, low numbers -> less fast
        // I want higher numbers as it's further away and lower numbers
        // problem is that it hits a hard outer edge and gets fired back with all the velocity, so the
        // upper limit basically controls how quickly it'll hit my hand again. i.e., 1/upper = time before it's
        // back in place

        // try a "cooldown" time after hit before I start applying the frequency?

        if (false)
        {
            let cooldownT = Math.min(this.cooldownAfterHit / 0.25, 1.0);
        
            const kMinFreq = 0.5;
            const kMaxFreq = kMinFreq + cooldownT * 3.0;
            
            let xDist = desiredPosition.x - this.targetPosition.x;
            let zDist = desiredPosition.z - this.targetPosition.z;
            let xzDist = Math.sqrt(xDist * xDist + zDist * zDist);
            let t = Math.min(xzDist/0.6, 1.0);
            //t *= t;
            
            //t = Math.min(t, cooldownT);

            let curFreq = kMinFreq + (kMaxFreq - kMinFreq) * t;
            ApplyPDVec3(desiredPosition, desiredVelocity, this.targetPosition, this.targetVelocity, curFreq, 0.01, dt);

        }
        else if (true)
        {
            // goal is to compute new desiredPosition and desiredVelocity based on current values of those and relative to targetPosition

            // compute tVec0 = vector pointing from current position to target position
            tVec0.copy(this.targetPosition);
            tVec0.sub(desiredPosition);
            
            let kSpringConstant = 250.0;
            tVec0.multiplyScalar(kSpringConstant); //this is now the "Hooke-ian" force (-k*x)

            // now apply velocity damping
            let kSpringDamping = 2.0;
            tVec0.addScaledVector(desiredVelocity, -kSpringDamping);

            //assume mass == 1, so a = F
            // vel' = vel + a * dt;
            desiredVelocity.addScaledVector(tVec0, dt);

            desiredPosition.addScaledVector(desiredVelocity, dt);



            // compute rotation velocity on a spring
            let rotationSpring = 0.0 - this.rotationValue;
            const kRotationSpringConstant = 200.0;
            rotationSpring *= kRotationSpringConstant;

            rotationSpring -= this.rotationVelocity * 3.0;
            //const kRotationSpringDamping = 0.1;
            //rotationSpring += this.rotationVelocity * -kRotationSpringConstant;

            this.rotationVelocity += rotationSpring * dt;
            this.rotationValue += this.rotationVelocity * dt;

            this.rotation.set(0.0, this.rotationValue * Math.PI, 0.0);

            //console.log("Rotation Value: " + this.rotationValue + ", Rotation Velocity: " + this.rotationVelocity);

        }
        else
        {
            tVec0.copy(this.targetPosition);
            tVec0.y += 1.0;
            tVec0.sub(desiredPosition);

            let kSpringConstant = 100.0;
            tVec0.multiplyScalar(kSpringConstant); //this is now the "Hooke-ian" force (-k*x)
            // now apply velocity damping
            let kSpringDamping = 1.0;
            tVec0.addScaledVector(desiredVelocity, -kSpringDamping);

            //assume mass == 1, so a = F
            // vel' = vel + a * dt;
            desiredVelocity.addScaledVector(tVec0, dt);

            tVec0.copy(this.targetPosition);
            tVec0.y -= 1.0;
            tVec0.sub(desiredPosition);
            tVec0.multiplyScalar(kSpringConstant); //this is now the "Hooke-ian" force (-k*x)
            tVec0.addScaledVector(desiredVelocity, -kSpringDamping);

            desiredVelocity.addScaledVector(tVec0, dt);

            desiredPosition.addScaledVector(desiredVelocity, dt);

            // console.log("BAG SPEED: " + desiredVelocity.length().toFixed(3));

        }

        //desiredPosition.y = this.targetPosition.y;

        if (!this.bHasGloves)
        {
            this.position.copy(desiredPosition);
            this.velocity.copy(desiredVelocity);
            return;
        }

        let tLeft = 1.0;
        let tRight = 1.0;

        // let hitLeft = doesCircleCollideWithOtherCircle(this.position, desiredPosition, this.radius, this.leftGlove.position, this.leftGlove.radius, leftHitPoint, tLeft);
        // let hitRight = doesCircleCollideWithOtherCircle(this.position, desiredPosition, this.radius, this.rightGlove.position, this.rightGlove.radius, rightHitPoint, tRight);

        // General behavior:
        // Move from position to desired position
        // if collision, figure out which one is closer
        // for closer collision, figure out hit normal, project movement onto that
        // if length of that new movement is big enough to be worth bothering about, try to move in the new direction


        let maxIter = 5;
        // while (maxIter--)
        if (true)
        {
            let hitLeft = doesSphereCollideWithOtherSphere(this.position, desiredPosition, this.radius, this.leftGlove.position, this.leftGlove.radius, leftHitPoint, leftHitNormal, tLeft, false);
            let hitRight = doesSphereCollideWithOtherSphere(this.position, desiredPosition, this.radius, this.rightGlove.position, this.rightGlove.radius, rightHitPoint, rightHitNormal, tRight, false);
    
            if (hitLeft || hitRight)
            {
                if (hitLeft && hitRight)
                {
                    if (tLeft < tRight)
                    {
                        hitRight = false;
                    }
                    else
                    {
                        hitLeft = false;
                    }
                }

                if (hitLeft)
                {
                    if (this.processCollisionIteration(desiredPosition, desiredVelocity, leftHitPoint, this.leftGlove.position))
                    {
                        //break;
                    }
                    //otherwise, keep going for another iteration

                }
                else
                {
                    if (this.processCollisionIteration(desiredPosition, desiredVelocity, rightHitPoint, this.rightGlove.position))
                    {
                        //break;
                    }
                    //otherwise, keep going for another iteration
                }
            }
            else
            {
                this.position.copy(desiredPosition);
                this.velocity.copy(desiredVelocity);
                //break;
            }
        }



        for(let pe of this.punchEffects)
        {
            if (pe.visible)
            {
                pe.material.opacity -= dt * kPunchEffectFadeRate;
                if (pe.material.opacity < 0.0)
                {
                    pe.visible = false;
                    pe.material.opacity = 0.0;
                }
            }
        }
    }

    processCollisionIteration( desiredPosition, desiredVelocity, hitPoint, hitNormal) //hitObjectCenter)
    {
        // console.log("OLD VELOCITY: " + desiredVelocity.x.toFixed(1) + ", " + desiredVelocity.y.toFixed(1) + ", " + desiredVelocity.z.toFixed(1));

        //move to current hit point, and back up a bit to avoid interpenetration
        this.position.copy(hitPoint);

        
        // this.velocity.copy(desiredVelocity);
        // this.velocity.reflect(hitNormal);
        // this.velocity.multiplyScalar(0.1);

        // tVec0.copy(desiredVelocity);
        // tVec0.normalize();
        // this.position.addScaledVector(hitNormal, -0.005); // could back us up through another object :\

        this.velocity.set(0,0,0);

        return false;

        // calc the remainder of the movement
        tVec0.copy(desiredPosition);
        tVec0.sub(this.position);

        // project it onto the plane of the hit normal to "slide" off the collision
        tVec0.projectOnPlane(hitNormal);
        desiredVelocity.projectOnPlane(hitNormal);

        // console.log("NEW VELOCITY: " + desiredVelocity.x.toFixed(1) + ", " + desiredVelocity.y.toFixed(1) + ", " + desiredVelocity.z.toFixed(1));

        // if there's enough movement to care about, move in the slide direction
        if (false) //tVec0.lengthSq() > kInconsequentialMovementSq)
        {
            desiredPosition.copy(hitPoint);
            desiredPosition.add(tVec0);
            return false;
        }
        else {
            // close enough -- we're all done
            this.velocity.copy(desiredVelocity);
            return true;
        }
    }

    processHit(velocity, position, normal, whichHand, isNewHit)
    {
        // normal.negate(); //because normal's pointing the wrong way

        tVec0.copy(velocity);
        tVec0.projectOnVector(normal);
        tVec0.multiplyScalar(1.0);
        this.velocity.add(tVec0);

        this.rotationValue -= normal.x * 0.785; // PI / 4

        this.cooldownAfterHit = 0.0;

        if (isNewHit && velocity.lengthSq() > kMinPunchSoundVelocitySq)
        {
            let hitSound = this.hitSounds[this.nextSoundIndex];
            if (hitSound.isPlaying)
                hitSound.stop();

            hitSound.position.copy(position);
            let whichSound = Math.floor(Math.random() * this.hitSoundBuffers.length);
            hitSound.buffer = this.hitSoundBuffers[whichSound];

            let speed = velocity.length();

            let speedBaseVolume = 0.00 + Math.min(speed, 6.0) * 0.167; // ramp from 0-1 over a range of 6
            hitSound.setVolume(speedBaseVolume);

            hitSound.play();

            this.nextSoundIndex = (this.nextSoundIndex + 1) % this.hitSounds.length;

            for(let cb of this.punchCallbacks)
            {
                cb(whichHand, velocity);
            }

            if (false)
            {
                // Rotate through a pool of punch effects
                let pe = this.punchEffects[this.nextPunchEffect];
                this.nextPunchEffect = (this.nextPunchEffect + 1) % this.punchEffects.length;

                //enable this hit effect and set opacity based on punch speed
                pe.visible = true;
                pe.material.opacity = Math.min((speed-1.0)*0.8, 2.0);

                // get the position -- use getWorldPosition because the bag is parented into a scene
                // and "position" just gives the local position relative to parent
                this.mesh.getWorldPosition(tVec0);
                //set the position of the punch effect, plus a slight tweak to make it appear
                //more directly under the glove

                let kAdjust = -0.05;
                if (velocity.y > 1.0)
                {
                    kAdjust = 0.0;
                }

                pe.position.setY( position.y - tVec0.y + kAdjust);
                
                // Figure out rotation of the hit -- using X/-Z, because we're rotating around the Y=Up Axis

                // flip order to negate z, because atan2 expects that axis to be positive 
                // moving "away" from the player
                let z = tVec0.z - position.z; 

                // atan2 gives the rotation in radius from the +X axis
                let rot = Math.atan2(z, position.x);
                pe.rotation.set(0.0, rot, 0.0);
            }
        }
    }

}


