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
const kMinPunchSoundVelocity = 0.5;
const kHeadRadius = 0.12;
const kHeadHitMinSpeedSq = 2.0 * 2.0;
const kHeadHitCooldown = 1.0;

let tVec0 = new THREE.Vector3();
let tVec1 = new THREE.Vector3();
let tVec2 = new THREE.Vector3();

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

            let desiredHeight = headPosition.y - 0.1; // + 2.0 * kBagRadius;

            let delta = desiredHeight - this.targetHeight;
            if (Math.abs(delta) > 0.05)
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


        if (false)
        {
            // goal is to compute new desiredPosition and desiredVelocity based on current values of those and relative to targetPosition

            // compute tVec0 = vector pointing from current position to target position
            tVec0.copy(this.targetPosition);
            tVec0.sub(desiredPosition);
            // @TODO - subtract a "rest length" from tVec0 -- this will give us some slop in the middle.

   
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

            // double-end bag thoughts --
            // 1. Adjust between chest and chin height
            // 2. Consider a rigid cord (i.e., a max length) that the cord can extend to -- how to model this? 
            //    I can limit the stretch easily enough, but not sure about the physics of hitting that full extension.
            //    Should probably jerk it back -- does that just kill the outward velocity, or does it "bounce" off that?
            //    Could I just model this as a max radius that the ball can get out to?
            // 3. The cords are not the same length (but maybe would be ideally?)
            // 4. Feels like the ball bounces around a fair bit, but never goes crazy far.


            // Start by getting the double-spring setup correct.
            // The "stretch" length * the spring constant is the force applied by the spring.
            // The "velocity along the spring" * the damping constant is the damping force
            // 
            // Compute the "stretched length"
            // Compute the velocity along the spring:
            // = bag velocity projected onto the spring vector
            // 



            const kRestLength = 0.4; //0.8;
            const kPositionOffset = 1.51; //10 feet ceiling, suspend in the middle

            tVec0.copy(this.targetPosition);
            tVec0.y += kPositionOffset;
            tVec0.sub(desiredPosition);
            
            let length = tVec0.length();
            if (length > 0.0)
            {
                tVec0.divideScalar(length);
                let stretchLength = Math.max(length - kRestLength, 0.0);
                tVec0.multiplyScalar(stretchLength);
            }


            const kSpringConstant = 150.0;
            const kSpringDamping = -2.0;
                      
            tVec0.multiplyScalar(kSpringConstant); // this is now the "Hooke-ian" force (-k*x)
            // now apply velocity damping
            
            tVec1.copy(desiredVelocity);
            tVec1.projectOnVector(tVec0);
            tVec0.addScaledVector(tVec1, kSpringDamping); // damping is using the velocity along the spring

            //assume mass == 1, so a = F
            // vel' = vel + a * dt;
            // desiredVelocity.addScaledVector(tVec0, dt);

            tVec2.copy(this.targetPosition);
            tVec2.y -= kPositionOffset;
            tVec2.sub(desiredPosition);

            length = tVec2.length();
            if (length > 0.0)
            {
                tVec2.divideScalar(length);
                let stretchLength = Math.max(length - kRestLength, 0.0);
                tVec2.multiplyScalar(stretchLength);
            }
            tVec2.multiplyScalar(kSpringConstant); //this is now the "Hooke-ian" force (-k*x)

            tVec1.copy(desiredVelocity);
            tVec1.projectOnVector(tVec2);
            tVec2.addScaledVector(tVec1, kSpringDamping); // damping is using the velocity along the spring


            //add the forces together
            tVec0.add(tVec2); 

            const kOverallDamping = -1.4; // 1.5
            tVec0.addScaledVector(desiredVelocity, kOverallDamping);

            // Apply the resulting force as an acceleration
            desiredVelocity.addScaledVector(tVec0, dt);

            // Calculate a hard stop at some radius in the horizontal plane, and don't go outside of that.
            // - figure out where the velocity vector intersects with circle of radius R
            // - take the positive root since we're inside and always moving outside

            // HACK -- Take the calculated position and snap it to the radius of the circle, then mirror around the 
            // normal at that point and reflect the remaining velocity
            tVec0.subVectors(desiredPosition, this.targetPosition); // tVec0 = desiredPosition - targetPosition;
            tVec0.addScaledVector(desiredVelocity, dt);
            tVec0.y = 0.0;
            const kOutsideRadius = 0.70;
            const kOutsideRadiusSq = kOutsideRadius * kOutsideRadius;
            if (tVec0.lengthSq() > kOutsideRadiusSq)
            {
                console.log("MOVING OUTSIDE RADIUS");
                let length = tVec0.length();
                let t = kOutsideRadius/length; // what percentage of the way have we moved.

                // Compute reflection vector -- it's the unit-length version of tVec0, then negated to point towards the origin of the cylinder
                tVec0.divideScalar(-length);

                // Assume amount of movement is low, so just set "desiredPosition" the point on the border
                tVec1.copy(desiredPosition);
                tVec1.addScaledVector(desiredVelocity, dt * t);

                desiredPosition.copy(tVec1);

                // Compute the new reflected velocity
                desiredVelocity.reflect(tVec0);
                const kOuterEdgeCollisionScale = 0.5;
                desiredVelocity.multiplyScalar(kOuterEdgeCollisionScale);

                let remainingMovement = length - kOutsideRadius;

            }
            else
            {
                desiredPosition.addScaledVector(desiredVelocity, dt);
            }

            // compute rotation velocity on a spring
            let rotationSpring = 0.0 - this.rotationValue;
            const kRotationSpringConstant = 200.0;
            rotationSpring *= kRotationSpringConstant;
            rotationSpring -= this.rotationVelocity * 3.0;
            this.rotationVelocity += rotationSpring * dt;
            this.rotationValue += this.rotationVelocity * dt;
            this.rotation.set(0.0, this.rotationValue * Math.PI, 0.0);

            // ramp envmap sharpness with speed
            let speed = desiredVelocity.length();
            let roughnessT = Math.max(Math.min((speed-1.0) * 0.1, 1.0), 0.0);
            this.mesh.material.roughness = 0.25 + roughnessT * 0.25;           
        }

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
                
                if (hr == rightHitResult) 
                {
                    hitLeft = false; //want hitLeft and hitRight to be mutually exclusive
                }

                let isHeadHit = false;
                if (hitHead)
                {
                    if (hr == null || hr.hitT > headHitResult.hitT)
                    {
                        isHeadHit = true;
                        
                        hitLeft = false; //want hitLeft, hitRight, and hitHead to be mutually exculsive
                        hitRight = false;

                        hr = headHitResult;

                    }
                }

                // move the the hit point and update bag velocity based on the collision
                this.position.copy(hr.hitPoint);

                // bounce the desired velocity off the thing we hit, and scale down to account for inelastic collision
                this.velocity.copy(desiredVelocity);
                this.velocity.reflect(hr.hitNormal);
                this.velocity.multiplyScalar(0.5);

                if (isHeadHit && desiredVelocity.lengthSq() > kHeadHitMinSpeedSq)
                {
                    this.playerHitSound.play(hr.hitPoint, 1.0);
                    this.playerHud.processHit();
                }
                else if (hitLeft || hitRight)
                {
                    let glove = hitLeft ? this.leftGlove : this.rightGlove;
                    //tVec0.subVectors(desiredVelocity, glove.velocity);

                    hr.hitNormal.negate(); // because we want this WRT the bag (and it's actually WRT the glove right now)
                    this.processCollisionEffects(
                        glove,
                        desiredVelocity.length(),
                        hr.hitPoint,
                        hr.hitNormal,
                        accumulatedTime,
                        false
                    );
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

    processCollisionEffects(
        glove, 
        collisionSpeed,
        hitPoint,
        hitNormalWRTBag,
        accumulatedTime,
        isPunch = true
    )
    {
        if (collisionSpeed > kMinPunchSoundVelocity && !glove.isInContactWithBag())
        {
            if (collisionSpeed > 1.0)
            {
                this.rotationValue -= hitNormalWRTBag.x * 0.785 * Math.max(collisionSpeed * 0.1, 1.0); //0.785 is approx PI/4
                glove.playImpactHaptic();
            }

            
            if (isPunch)
            {
                glove.registerBagContact(accumulatedTime);
            
                let speedBasedVolume = 0.0 + Math.min(collisionSpeed, 6.0) * 0.167; // ramp from 0-1 over a range of 6
                this.hitSound.play(hitPoint, speedBasedVolume);

                for(let cb of this.punchCallbacks)
                {
                    cb(glove.whichHand, collisionSpeed);
                }
            }
            // else
            // {
            //     this.hitSound.play(hitPoint, 0.02);
            // }
        }     
    }

    processHit(
        glove,
        gloveVelocity,
        hitPoint,
        hitNormalWRTBag, //hit normal on surface of bag
        accumulatedTime
    )
    {
        // Compute the delta speed between the bag and the glove
        tVec0.subVectors(this.velocity, gloveVelocity);
        let collisionSpeed = tVec0.length();

        // Apply the glove velocity to the bag
        tVec0.copy(gloveVelocity);
        tVec0.projectOnVector(hitNormalWRTBag);
        tVec0.multiplyScalar(2.0); // scale it up to give the punch more weight
        this.velocity.add(tVec0);

        this.processCollisionEffects(glove, gloveVelocity.length(), hitPoint, hitNormalWRTBag, accumulatedTime);

    }

    resetPositionAndVelocity()
    {
        super.resetPositionAndVelocity();
        this.rotationValue = 0.0;
        this.rotationVelocity = 0.0;
    }

}


