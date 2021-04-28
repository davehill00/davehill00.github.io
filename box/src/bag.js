import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {ApplyPDVec3, ComputePDAcceleration} from "./pdacceleration.js";
import {doesCircleCollideWithOtherCircle} from "./circleCircleIntersection.js";
import {doesSphereCollideWithOtherSphere, HitResult} from "./sphereSphereIntersection.js";
import { BlendingDstFactor, BlendingEquation, BlendingSrcFactor } from 'three';
import { MultiInstanceSound } from './multiBufferSound.js';

let desiredPosition = new THREE.Vector3();
let desiredVelocity = new THREE.Vector3();

let leftHitResult = new HitResult();
let rightHitResult = new HitResult();

const kBagRadius = 0.25;
const kMinPunchSoundVelocity = 0.25; //1.5 * 1.5;
const kPunchEffectFadeRate = 10.0;

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

    hide()
    {
        this.fadingOut = false;
        this.fadingIn = false;
        this.visible = false;
        this.setOpaque();
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
                    
                    
                    //console.log("BAG " + i + ":" + obj.name);


                    if (obj.name == "Bag")
                    {
                        this.mesh = obj;
                        obj.name = "BAG " + i;
                        obj.material.roughness = 0.2;
                        obj.material.envMapIntensity = 0.8;
                        obj.material.envMap = this.scene.envMap;
                        obj.renderOrder = 3;
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
                            pe.renderOrder = 4;
                            bag.add(pe);
                            this.punchEffects[i] = pe;
                        }
                        this.nextPunchEffect = 0;
                    }
                }
                // gltf.scene.scale.set(0.5, 0.5, 0.5);
                // gltf.scene.renderOrder = 3; //render after gloves
                this.add(gltf.scene);

                // this.add(new THREE.Mesh(new THREE.SphereBufferGeometry(kBagRadius, 32, 16), new THREE.MeshStandardMaterial({color: 0x000000, envMap: this.scene.envMap, envMapIntensity: 0.5, roughness: 0.25})));
            });

        this.hitSound = new MultiInstanceSound(audioListener, 6, ['./content/trim-Punch-Kick-A1-www.fesliyanstudios.com.mp3']);
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
            
            let kSpringConstant = 500.0;
            tVec0.multiplyScalar(kSpringConstant); //this is now the "Hooke-ian" force (-k*x)

            // now apply velocity damping
            let kSpringDamping = 20.0;
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
                let hr = null;
                let glove = null;
                if (hitLeft)
                {
                    hr = leftHitResult;
                    glove = this.leftGlove;
                }
                if (hitRight && (hr == null || rightHitResult.hitT < hr.hitT))
                {
                    hr = rightHitResult;
                    glove = this.rightGlove;
                }

                //this.processCollisionIteration(desiredPosition, desiredVelocity, hr.hitPoint, hr.)
                this.position.copy(hr.hitPoint);

                // bounce the desired velocity off the thing we hit, and scale down to account for inelastic collision
                this.velocity.copy(desiredVelocity);
                this.velocity.reflect(hr.hitNormal);
                this.velocity.multiplyScalar(0.5);

                /*
                // Play the hit effects
                tVec0.subVectors(desiredVelocity, glove.velocity);
                hr.hitNormal.negate(); // because we want this WRT the bag (and it's actually WRT the glove right now)
                this.processCollisionEffects(
                    glove,
                    tVec0.length(),
                    hr.hitPoint,
                    hr.hitNormal,
                    accumulatedTime,
                    false
                );
                */

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

    processCollisionEffects(
        glove,
        gloveVelocity,
        hitPoint,
        hitNormalWRTBag,
        accumulatedTime,
        isPunch = true
    )
    {
        let collisionSpeed = gloveVelocity.length();
        if (collisionSpeed > kMinPunchSoundVelocity && !glove.isInContactWithBag())
        {
            if (collisionSpeed > 1.0)
            {
                this.rotationValue -= hitNormalWRTBag.x * 0.785 * Math.max(collisionSpeed * 0.1, 1.0); //0.785 is approx PI/4
                glove.playImpactHaptic();
            }

            glove.registerBagContact(accumulatedTime);
            
            if (isPunch)
            {
                let speedBasedVolume = 0.0 + Math.min(collisionSpeed, 6.0) * 0.167; // ramp from 0-1 over a range of 6
                this.hitSound.play(hitPoint, speedBasedVolume);

                for(let cb of this.punchCallbacks)
                {
                    cb(glove, collisionSpeed, gloveVelocity);
                }

                //
                // Apply the Punch Effect
                //

                // Rotate through a pool of punch effects
                let pe = this.punchEffects[this.nextPunchEffect];
                this.nextPunchEffect = (this.nextPunchEffect + 1) % this.punchEffects.length;

                //enable this hit effect and set opacity based on punch speed
                pe.visible = true;
                pe.material.opacity = Math.min((collisionSpeed-1.0)*0.8, 2.0);

                // get the position -- use getWorldPosition because the bag is parented into a scene
                // and "position" just gives the local position relative to parent
                this.mesh.getWorldPosition(tVec0);


                //set the position of the punch effect, plus a slight tweak to make it appear
                //more directly under the glove
                let kAdjust = -0.05;
                // if (velocity.y > 1.0)
                // {
                //     kAdjust = 0.0;
                // }

                pe.position.setY( hitPoint.y - tVec0.y + kAdjust);
                
                // Figure out rotation of the hit -- using X/-Z, because we're rotating around the Y=Up Axis

                // flip order to negate z, because atan2 expects that axis to be positive 
                // moving "away" from the player
                let z = tVec0.z - hitPoint.z; 

                // atan2 gives the rotation in radius from the +X axis
                let rot = Math.atan2(z, hitPoint.x);
                pe.rotation.set(0.0, rot, 0.0);
            }
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
        //tVec0.subVectors(this.velocity, gloveVelocity);
        // let collisionSpeed = gloveVelocity.length(); //tVec0.length();

        // Apply the glove velocity to the bag
        tVec0.copy(gloveVelocity);
        tVec0.projectOnVector(hitNormalWRTBag);
        tVec0.multiplyScalar(0.95); // scale it up to give the punch more weight
        this.velocity.add(tVec0);

        this.processCollisionEffects(glove, gloveVelocity, hitPoint, hitNormalWRTBag, accumulatedTime);

    }
}


