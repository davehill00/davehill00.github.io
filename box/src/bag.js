import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {ApplyPDVec3, ComputePDAcceleration} from "./pdacceleration.js";
import {doesCircleCollideWithOtherCircle} from "./circleCircleIntersection.js";
import { BlendingDstFactor, BlendingEquation, BlendingSrcFactor } from 'three';

let desiredPosition = new THREE.Vector3();
let desiredVelocity = new THREE.Vector3();

let leftHitPoint = new THREE.Vector3();
let rightHitPoint = new THREE.Vector3();

const kBagRadius = 0.25;
const kMinPunchSoundVelocitySq = 0.25 * 0.25; //1.5 * 1.5;
const kPunchEffectFadeRate = 6.0; //

let tVec0 = new THREE.Vector3();


export class Bag extends THREE.Group
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

        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        
        this.hitMeshDebug = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), new THREE.MeshBasicMaterial({color: 0xff00ff}));
        scene.add(this.hitMeshDebug);
        this.hitMeshDebug.visible = false;

        this.radius = kBagRadius;
        this.accumulatedTime = 0.0;

        this.bHasGloves = false;

        this.punchEffectGeometry = null;
        this.punchEffectMaterial = null;

        let loaderPromise = new Promise( resolve => {
            let loader = new GLTFLoader();
            loader.load('./content/bag.gltf', resolve);
        });
        loaderPromise.then(
            gltf => {
                for (let i = gltf.scene.children.length - 1; i >=0 ; i--)
                {
                    let obj = gltf.scene.children[i];
                    
                    
                    console.log("BAG " + i + ":" + obj.name);


                    if (obj.name == "Bag")
                    {
                        //obj.castShadow = true;
                        //obj.receiveShadow = true;
                        this.mesh = obj;
                        obj.name = "BAG " + i;
                        obj.material.roughness = 0.3;
                        obj.material.envMapIntensity = 1.0;
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

                        this.punchEffects = [];
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
                this.add(gltf.scene);
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

        if (this.mesh != null && this.scene.envMap != null && this.mesh.material.envMap == null)
        {
            this.mesh.material.envMap = this.scene.envMap;
            console.log("SET BAG ENVMAP");
        }
        this.accumulatedTime = accumulatedTime;

        if (this.renderer && this.renderer.xr && this.renderer.xr.isPresenting)
        {
            let xrCamera = this.renderer.xr.getCamera(this.camera);
            xrCamera.getWorldPosition(tVec0);

            let desiredHeight = tVec0.y - 0.25;

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
        ApplyPDVec3(desiredPosition, desiredVelocity, this.targetPosition, this.targetVelocity, 5.0, 0.9, dt);


        if (!this.bHasGloves)
        {
            this.position.copy(desiredPosition);
            this.velocity.copy(desiredVelocity);
            return;
        }

        let tLeft = 1.0;
        let tRight = 1.0;

        let hitLeft = doesCircleCollideWithOtherCircle(this.position, desiredPosition, this.radius, this.leftGlove.position, this.leftGlove.radius, leftHitPoint, tLeft);
        let hitRight = doesCircleCollideWithOtherCircle(this.position, desiredPosition, this.radius, this.rightGlove.position, this.rightGlove.radius, rightHitPoint, tRight)

        if (hitLeft || hitRight)
        {
            this.velocity.set(0.0, 0.0, 0.0);
            if (hitLeft && !hitRight)
            {
                this.position.copy(leftHitPoint);
            }
            else if (hitRight && !hitLeft)
            {
                this.position.copy(rightHitPoint);
            }
            else if (hitLeft && hitRight)
            {
                if (tLeft < tRight)
                {
                    this.position.copy(leftHitPoint);
                }
                else
                {
                    this.position.copy(rightHitPoint);
                }
            }
        }
        else
        {
            this.position.copy(desiredPosition);
            this.velocity.copy(desiredVelocity);
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

    processHit(velocity, position, whichHand, isNewHit)
    {
        this.velocity.add(velocity);



        if (isNewHit && velocity.lengthSq() > kMinPunchSoundVelocitySq)
        {
            let hitSound = this.hitSounds[this.nextSoundIndex];
            if (hitSound.isPlaying)
                hitSound.stop();

            hitSound.position.copy(position);
            let whichSound = Math.floor(Math.random() * this.hitSoundBuffers.length);
            hitSound.buffer = this.hitSoundBuffers[whichSound];

            let speed = velocity.length();

            let speedBaseVolume = 1.0; //0.1 + Math.min(speed, 5.0) * 0.3;
            hitSound.setVolume(speedBaseVolume);

            // console.log("play buffer (" + whichSound + ") in sound (" + this.nextSoundIndex + ")");
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
            pe.material.opacity = Math.min((speed-1.5)*0.4, 2.0);

            // get the position -- use getWorldPosition because the bag is parented into a scene
            // and "position" just gives the local position relative to parent
            this.mesh.getWorldPosition(tVec0);
            //set the position of the punch effect, plus a slight tweak to make it appear
            //more directly under the glove
            pe.position.setY( position.y - 0.05 - tVec0.y );
            
            // Figure out rotation of the hit -- using X/-Z, because we're rotating around the Y=Up Axis

            // flip order to negate z, because atan2 expects that axis to be positive 
            // moving "away" from the player
            let z = tVec0.z - position.z; 

            // atan2 gives the rotation in radius from the +X axis
            let rot = Math.atan2(z, position.x);
            pe.rotation.set(0.0, rot, 0.0);

            this.hitMeshDebug.position.set(position.x, position.y, position.z);

        }
    }

}
