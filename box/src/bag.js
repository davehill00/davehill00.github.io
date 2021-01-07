import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {ApplyPDVec3} from "./pdacceleration.js";
import {doesCircleCollideWithOtherCircle} from "./circleCircleIntersection.js";

let desiredPosition = new THREE.Vector3();
let desiredVelocity = new THREE.Vector3();

let leftHitPoint = new THREE.Vector3();
let rightHitPoint = new THREE.Vector3();

const kBagRadius = 0.25;
const kMinPunchSoundVelocitySq = 0.25 * 0.25; //1.5 * 1.5;

export class Bag extends THREE.Group
{
    constructor(audioListener)
    {
        super();
        this.velocity = new THREE.Vector3();
        this.targetVelocity = new THREE.Vector3(0.0, 0.0, 0.0);
        this.targetPosition = new THREE.Vector3(0.0, 1.35, -0.75);
        this.position.copy(this.targetPosition);

        this.radius = kBagRadius;
        this.accumulatedTime = 0.0;

        this.bHasGloves = false;

        let loaderPromise = new Promise( resolve => {
            let loader = new GLTFLoader();
            loader.load('./content/bag.gltf', resolve);
        });
        loaderPromise.then(
            gltf => {
                for (let i = 0; i < gltf.scene.children.length; i++)
                {
                    let obj = gltf.scene.children[i];
                    obj.castShadow = true;
                    obj.receiveShadow = true;
                }
                this.add(gltf.scene);
            });

        let mesh = new THREE.Mesh(
            new THREE.CylinderGeometry(kBagRadius, kBagRadius, 1.0, 32, 1),
            new THREE.MeshStandardMaterial({color: 0xff8020}));

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
        audioLoader.load('./content/Punch-Kick-A1-www.fesliyanstudios.com.mp3', (buffer) => {
            this.hitSoundBuffers.push(buffer);
        });
        // audioLoader.load('./content/Crunchy-Punch-A-www.fesliyanstudios.com.mp3', (buffer) => {
        //     this.hitSoundBuffers.push(buffer);
        // });
        // audioLoader.load('./content/Crunchy-Punch-B-www.fesliyanstudios.com.mp3', (buffer) => {
        //     this.hitSoundBuffers.push(buffer);
        // });




        //this.add(mesh);
    }

    setGloves(leftGlove, rightGlove)
    {
        this.leftGlove = leftGlove;
        this.rightGlove = rightGlove;
        this.bHasGloves = true;
    }

    update(dt, accumulatedTime)
    {
        this.accumulatedTime = accumulatedTime;

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

            let speedBaseVolume = 0.1 + Math.min(speed, 5.0) * 0.3;
            hitSound.setVolume(speedBaseVolume);

            // console.log("play buffer (" + whichSound + ") in sound (" + this.nextSoundIndex + ")");
            hitSound.play();

            this.nextSoundIndex = (this.nextSoundIndex + 1) % this.hitSounds.length;

        }
    }

}
