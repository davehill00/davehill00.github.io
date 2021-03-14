import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {ApplyPDVec3, ComputePDAcceleration} from "./pdacceleration.js";
import {doesCircleCollideWithOtherCircle} from "./circleCircleIntersection.js";
import {doesSphereCollideWithOtherSphere, HitResult} from "./sphereSphereIntersection.js";
import { BlendingDstFactor, BlendingEquation, BlendingSrcFactor } from 'three';

let desiredPosition = new THREE.Vector3();
let desiredVelocity = new THREE.Vector3();

let leftHitResult = new HitResult();
let rightHitResult = new HitResult();

const kBagRadius = 0.25;
const kMinPunchSoundVelocitySq = 0.25 * 0.25; //1.5 * 1.5;
const kPunchEffectFadeRate = 4.0;

const kFadeInTime = 0.5;
const kOneOverFadeInTime = 1.0 / kFadeInTime;
const kFadeOutTime = 1.0;
const kOneOverFadeOutTime = 1.0 / kFadeOutTime;

let tVec0 = new THREE.Vector3();
let hitNormal = new THREE.Vector3();

export class Bag extends THREE.Group
{

    constructor(audioListener, scene, camera, renderer)
    {
        super();
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.punchCallbacks = [];

        this.fadeTimer = 0.0; 
        this.fadingOut = false;
        this.fadingIn = false;
    }

    setGloves(leftGlove, rightGlove)
    {
        this.leftGlove = leftGlove;
        this.rightGlove = rightGlove;
        this.bHasGloves = true;
    }

    update(dt, accumulatedTime)
    {
        this.updateFade(dt);
    }

    updateFade(dt)
    {
        this.fadeTimer += dt;
        if (this.fadingIn)
        {
            if (this.fadeTimer > kFadeInTime)
            {
                this.setOpaque();
                this.fadingIn = false;
                //console.log(this.name + " FADED IN");
            }
            else
            {
                this.mesh.material.opacity = Math.min(this.fadeTimer * kOneOverFadeInTime, 1.0);
            }
        }
        else if (this.fadingOut)
        {
            if (this.fadeTimer > kFadeOutTime)
            {
                this.setOpaque();
                this.fadingOut = false;
                this.visible = false;

                //console.log(this.name + " FADED OUT");
            }
            else
            {
                this.mesh.material.opacity = Math.min(Math.max(1.0 - (this.fadeTimer * kOneOverFadeOutTime), 0.0), 1.0);
            }
        }
    }

    fadeOut()
    {
        this.mesh.material.opacity = 1.0;
        this.fadingOut = true;
        this.fadeTimer = 0.0;
        this.setTransparent();
        //console.log(this.name + " STARTING TO FADE OUT");
    }

    fadeIn()
    {
        this.resetPositionAndVelocity();

        this.mesh.material.opacity = 0.0;
        this.fadingIn = true;
        this.visible = true;
        this.fadeTimer = 0.0;
        this.setTransparent();

        //console.log(this.name + " STARTING TO FADE IN");
    }

    setOpaque()
    {
        this.mesh.material.transparent = false;
        this.mesh.material.opacity = 1.0;
    }

    setTransparent()
    {
        this.mesh.material.transparent = true;
    }

    resetPositionAndVelocity()
    {
        this.position.copy(this.targetPosition);
        this.velocity.copy(this.targetVelocity);
    }
}

export class HeavyBag extends Bag
{
    constructor(audioListener, scene, camera, renderer)
    {
        super(audioListener, scene, camera, renderer);

        this.velocity = new THREE.Vector3();
        this.targetVelocity = new THREE.Vector3(0.0, 0.0, 0.0);
        this.targetPosition = new THREE.Vector3(0.0, 1.55, -0.75);
        this.targetHeightVelocity = 0.0;
        this.targetHeight = this.targetPosition.y;
        this.position.copy(this.targetPosition);
        
        this.radius = kBagRadius;
        this.accumulatedTime = 0.0;

        this.cooldownAfterHit = 0.0;

        this.bHasGloves = false;

        this.punchEffectGeometry = null;
        this.punchEffectMaterial = null;
        this.punchEffects = [];

        this.name = "Heavy Bag";

        let loaderPromise = new Promise( resolve => {
            let loader = new GLTFLoader();
            loader.load('./content/bag_v2.gltf', resolve);
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
                        obj.material.roughness = 0.2;
                        obj.material.envMapIntensity = 0.8;
                        obj.material.envMap = this.scene.envMap;
                    }
                    else if (obj.name == "PunchEffectMesh")
                    {
                        this.punchEffectGeometry = obj.geometry;
                        this.punchEffectMaterial = obj.material;
                        this.punchEffectMaterial = new THREE.MeshBasicMaterial( 
                            {
                                color: 0x77210B,
                                //color: 0x404040,
                                map: obj.material.map,
                                depthWrite: false,
                                blending: THREE.AdditiveBlending,
                            });
                        this.punchEffectMaterial.color.convertSRGBToLinear();
                        this.punchEffectMaterial.name = "PunchEffectMaterial";

                        let bag = obj.parent;
                        obj.parent.remove(obj);
                        obj.parent = null;

                        
                        for (let i = 0; i < 6; i++)
                        {
                            let pe = new THREE.Mesh(this.punchEffectGeometry, this.punchEffectMaterial.clone());
                            pe.name = "Punch Effect Mesh " + i;
                            pe.rotation.set(0.0, i * 0.87, 0.0);
                            pe.scale.set(1.00, 1.00, 1.00);
                            //pe.position.setY(i*0.1);
                            pe.visible = false;
                            bag.add(pe);
                            this.punchEffects[i] = pe;
                        }
                        this.nextPunchEffect = 0;
                    }
                }
                // gltf.scene.scale.set(0.5, 0.5, 0.5);
                this.add(gltf.scene);

                // this.add(new THREE.Mesh(new THREE.SphereBufferGeometry(kBagRadius, 32, 16), new THREE.MeshStandardMaterial({color: 0x000000, envMap: this.scene.envMap, envMapIntensity: 0.5, roughness: 0.25})));
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


    }



    update(dt, accumulatedTime)
    {
        super.update(dt, accumulatedTime);
    
        this.accumulatedTime = accumulatedTime;
        this.cooldownAfterHit += dt;

        if (this.renderer && this.renderer.xr && this.renderer.xr.isPresenting)
        {
            let xrCamera = this.renderer.xr.getCamera(this.camera);
            xrCamera.getWorldPosition(tVec0);

            let desiredHeight = tVec0.y - 0.25;

            let delta = desiredHeight - this.targetHeight;
            if (Math.abs(delta) > 0.10)
            {               
                this.targetHeight = desiredHeight;
            }

            let heightAccel = ComputePDAcceleration(this.targetPosition.y, this.targetHeightVelocity,
                this.targetHeight, 0.0, 0.25, 2.0, dt);
            this.targetHeightVelocity += heightAccel * dt;
            this.targetPosition.y += this.targetHeightVelocity * dt;
        
        }

        desiredPosition.copy(this.position);
        desiredVelocity.copy(this.velocity);

        if (false)
        {
            ApplyPDVec3(desiredPosition, desiredVelocity, this.targetPosition, this.targetVelocity, 3.3, 0.9, dt);

        }
        else if (true)
        {
            // goal is to compute new desiredPosition and desiredVelocity based on current values of those and relative to targetPosition

            // compute tVec0 = vector pointing from current position to target position
            tVec0.copy(this.targetPosition);
            tVec0.sub(desiredPosition);
            
            let kSpringConstant = 700.0;
            tVec0.multiplyScalar(kSpringConstant); //this is now the "Hooke-ian" force (-k*x)

            // now apply velocity damping
            let kSpringDamping = 40.0;
            tVec0.addScaledVector(desiredVelocity, -kSpringDamping);

            //assume mass == 1, so a = F
            // vel' = vel + a * dt;
            desiredVelocity.addScaledVector(tVec0, dt);

            desiredPosition.addScaledVector(desiredVelocity, dt);
        }

        if (!this.bHasGloves)
        {
            this.position.copy(desiredPosition);
            this.velocity.copy(desiredVelocity);
            return;
        }

        let tLeft = 1.0;
        let tRight = 1.0;



        // General behavior:
        // Move from position to desired position
        // if collision, figure out which one is closer
        // for closer collision, figure out hit normal, project movement onto that
        // if length of that new movement is big enough to be worth bothering about, try to move in the new direction


        let maxIter = 5;
        // while (maxIter--)
        if (true)
        {
            // let hitLeft = doesSphereCollideWithOtherSphere(this.position, desiredPosition, this.radius, this.leftGlove.position, this.leftGlove.radius, leftHitPoint, leftHitNormal, tLeft, false);
            // let hitRight = doesSphereCollideWithOtherSphere(this.position, desiredPosition, this.radius, this.rightGlove.position, this.rightGlove.radius, rightHitPoint, rightHitNormal, tRight, false);

            let hitLeft = doesCircleCollideWithOtherCircle(this.position, desiredPosition, this.radius, this.leftGlove.position, this.leftGlove.radius, leftHitResult);
            let hitRight = doesCircleCollideWithOtherCircle(this.position, desiredPosition, this.radius, this.rightGlove.position, this.rightGlove.radius, rightHitResult);

            if (hitLeft || hitRight)
            {
                if (hitLeft && hitRight)
                {
                    if (leftHitResult.hitT < rightHitResult.hitT)
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
                    if (this.processCollisionIteration(desiredPosition, desiredVelocity, leftHitResult.hitPoint, this.leftGlove.position))
                    {
                        //break;
                    }
                    //otherwise, keep going for another iteration

                }
                else
                {
                    if (this.processCollisionIteration(desiredPosition, desiredVelocity, rightHitResult.hitPoint, this.rightGlove.position))
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

    }

    processHit(velocity, position, normal, whichHand, isNewHit)
    {
        // normal.negate(); //because normal's pointing the wrong way

        tVec0.copy(velocity);
        tVec0.projectOnVector(normal);
        tVec0.multiplyScalar(0.5);
        this.velocity.add(tVec0);

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


