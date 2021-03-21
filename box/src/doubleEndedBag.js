import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {ApplyPDVec3, ComputePDAcceleration} from "./pdacceleration.js";
import {doesCircleCollideWithOtherCircle} from "./circleCircleIntersection.js";
import {doesSphereCollideWithOtherSphere, HitResult} from "./sphereSphereIntersection.js";
import { Bag } from './bag.js';
import { MultiInstanceSound } from './multiBufferSound.js';

let desiredPosition = new THREE.Vector3();
let desiredVelocity = new THREE.Vector3();
let headPosition = new THREE.Vector3();

let leftHitResult = new HitResult();
let rightHitResult = new HitResult();
let headHitResult = new HitResult();

const kBagRadius = 0.15;
const kMinPunchSoundVelocitySq = 0.25 * 0.25;
const kHeadRadius = 0.12;
const kHeadHitMinSpeedSq = 2.0 * 2.0;
const kHeadHitCooldown = 1.0;

let tVec0 = new THREE.Vector3();
let tVec1 = new THREE.Vector3();
let hitNormal = new THREE.Vector3();


export class DoubleEndedBag extends Bag
{
    constructor(audioListener, scene, camera, renderer, playerHud)
    {
        super(audioListener, scene, camera, renderer);

        this.name = "Double-end Bag";

        this.playerHud = playerHud;

        this.velocity = new THREE.Vector3();
        this.targetVelocity = new THREE.Vector3(0.0, 0.0, 0.0);
        this.targetPosition = new THREE.Vector3(0.0, 1.55, -0.75);
        this.targetHeightVelocity = 0.0;
        this.targetHeight = this.targetPosition.y;
        this.position.copy(this.targetPosition);

        this.rotationValue = 0.0;
        this.rotationVelocity = 0.0;

        this.radius = kBagRadius;
        this.accumulatedTime = 0.0;

        this.bHasGloves = false;

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
                }
                this.add(this.mesh);
            });


        this.hitSound = new MultiInstanceSound(audioListener, 6, ['./content/trim-Punch-Kick-A1-www.fesliyanstudios.com.mp3']);
        this.playerHitSound = new MultiInstanceSound(audioListener, 3, 
            [
                './content/hit_and_grunt_1.mp3', 
                './content/hit_and_grunt_2.mp3',
                './content/hit_and_grunt_3.mp3'
            ]);
        this.nextHeadHitTime = -1.0;

        this.punchCallbacks = [];
    }


    update(dt, accumulatedTime)
    {

        super.update(dt, accumulatedTime);

        this.accumulatedTime = accumulatedTime;

        let hasHeadPosition = false;

        if (this.renderer && this.renderer.xr && this.renderer.xr.isPresenting)
        {
            let xrCamera = this.renderer.xr.getCamera(this.camera);
            xrCamera.getWorldPosition(headPosition);

            let desiredHeight = headPosition.y; // + 2.0 * kBagRadius;

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
        
            hasHeadPosition = true;
        }

        desiredPosition.copy(this.position);
        desiredVelocity.copy(this.velocity);


        if (true)
        {
            // goal is to compute new desiredPosition and desiredVelocity based on current values of those and relative to targetPosition

            // compute tVec0 = vector pointing from current position to target position
            tVec0.copy(this.targetPosition);
            tVec0.sub(desiredPosition);
            
            let kSpringConstant = 250.0;
            tVec0.multiplyScalar(kSpringConstant); //this is now the "Hooke-ian" force (-k*x)

            // now apply velocity damping
            let kSpringDamping = 1.0;
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


            // ramp envmap sharpness with speed
            let speed = desiredVelocity.length();
            let roughnessT = Math.max(Math.min((speed-1.0) * 0.1, 1.0), 0.0);
            this.mesh.material.roughness = 0.25 + roughnessT * 0.25;

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

        // General behavior:
        // Move from position to desired position
        // if collision, figure out which one is closer
        // for closer collision, figure out hit normal, project movement onto that
        // if length of that new movement is big enough to be worth bothering about, try to move in the new direction


        let maxIter = 5;
        // while (maxIter--)
        if (true)
        {
            let hitLeft = doesSphereCollideWithOtherSphere(this.position, desiredPosition, this.radius, this.leftGlove.position, this.leftGlove.radius, leftHitResult);
            let hitRight = doesSphereCollideWithOtherSphere(this.position, desiredPosition, this.radius, this.rightGlove.position, this.rightGlove.radius, rightHitResult);

            // Determine if we're moving towards the player to decide if we want to do a head-collision check.
            // Sometimes the ball can get past the player and hit them in the back of the head, which is
            // confusing and not that helpful, and we're trying to filter those cases out.
            let hitHead = false;
            if (accumulatedTime > this.nextHeadHitTime)
            {
                tVec0.copy(this.position);
                tVec0.sub(desiredPosition);

                tVec1.copy(this.position);
                tVec1.sub(headPosition);

                let movingTowardPlayer = tVec0.dot(tVec1) > 0.0;
                
                hitHead = hasHeadPosition && movingTowardPlayer && 
                    doesSphereCollideWithOtherSphere(this.position, desiredPosition, this.radius, headPosition, kHeadRadius, headHitResult);
                
                if (hitHead)
                {
                    this.nextHeadHitTime = accumulatedTime + kHeadHitCooldown;
                }
            }

            if (hitLeft || hitRight || hitHead)
            {
                let hr = null;
                
                if (hitLeft)
                    hr = leftHitResult;
                if (hitRight)
                    hr = (hr == null || hr.hitT > rightHitResult.hitT) ? rightHitResult : hr;

                let isHeadHit = false;
                if (hitHead)
                {
                    if (hr == null || hr.hitT > headHitResult.hitT)
                    {
                        isHeadHit = true;
                        hr = headHitResult;
                    }
                }

                this.processCollisionIteration(desiredPosition, desiredVelocity, hr.hitPoint, hr.hitNormal);

                if (isHeadHit && desiredVelocity.lengthSq() > kHeadHitMinSpeedSq)
                {
                    // console.log("HEAD HIT SPEED: " + desiredVelocity.length());
                    this.playerHitSound.play(hr.hitPoint, 1.0);
                    this.playerHud.processHit();
                }
            }
            else
            {
                this.position.copy(desiredPosition);
                this.velocity.copy(desiredVelocity);
                //break;
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


        if (isNewHit && velocity.lengthSq() > kMinPunchSoundVelocitySq)
        {
            // let hitSound = this.hitSounds[this.nextSoundIndex];
            // if (hitSound.isPlaying)
            //     hitSound.stop();

            // hitSound.position.copy(position);
            // let whichSound = Math.floor(Math.random() * this.hitSoundBuffers.length);
            // hitSound.buffer = this.hitSoundBuffers[whichSound];

            let speed = velocity.length();
            let speedBasedVolume = 0.00 + Math.min(speed, 6.0) * 0.167; // ramp from 0-1 over a range of 6
            this.hitSound.play(position, speedBasedVolume);
            // hitSound.setVolume(speedBaseVolume);
            // hitSound.play();

            // this.nextSoundIndex = (this.nextSoundIndex + 1) % this.hitSounds.length;

            this.rotationValue -= normal.x * 0.785 * Math.max(speed * 0.1, 1.0); //0.785 is approx PI/4

            for(let cb of this.punchCallbacks)
            {
                cb(whichHand, velocity);
            }
        }
    }

    resetPositionAndVelocity()
    {
        super.resetPositionAndVelocity();
        this.rotationValue = 0.0;
        this.rotationVelocity = 0.0;
    }

}


