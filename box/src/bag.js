import {ApplyPDVec3} from "./pdacceleration.js";
import {doesCircleCollideWithOtherCircle} from "./circleCircleIntersection.js";

let desiredPosition = new THREE.Vector3();
let desiredVelocity = new THREE.Vector3();

let leftHitPoint = new THREE.Vector3();
let rightHitPoint = new THREE.Vector3();

const kBagRadius = 0.25;
const kHitSoundDelay = 0.25;

export class Bag extends THREE.Group
{
    constructor(leftGlove, rightGlove, audioListener)
    {
        super();
        this.velocity = new THREE.Vector3();
        this.targetVelocity = new THREE.Vector3(0.0, 0.0, 0.0);
        this.targetPosition = new THREE.Vector3(0.0, 1.25, -0.75);
        this.position.copy(this.targetPosition);
        this.leftGlove = leftGlove;
        this.rightGlove = rightGlove;
        this.radius = kBagRadius;
        this.accumulatedTime = 0.0;

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
        this.nextSoundTime = [-999, -1, -1];

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


        this.add(mesh);
    }

    update(dt, accumulatedTime)
    {
        this.accumulatedTime = accumulatedTime;

        desiredPosition.copy(this.position);
        desiredVelocity.copy(this.velocity);
        ApplyPDVec3(desiredPosition, desiredVelocity, this.targetPosition, this.targetVelocity, 3.0, 0.9, dt);

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

    processHit(velocity, position, whichHand)
    {
        this.velocity.add(velocity);


        if (this.nextSoundTime[whichHand] < this.accumulatedTime)
        {
            let hitSound = this.hitSounds[this.nextSoundIndex];
            if (hitSound.isPlaying)
                hitSound.stop();

            hitSound.position.copy(position);
            let whichSound = Math.floor(Math.random() * this.hitSoundBuffers.length);
            hitSound.buffer = this.hitSoundBuffers[whichSound];
            
            console.log("play buffer (" + whichSound + ") in sound (" + this.nextSoundIndex + ")");
            hitSound.play();

            this.nextSoundIndex = (this.nextSoundIndex + 1) % this.hitSounds.length;

            this.nextSoundTime[whichHand] = this.accumulatedTime + kHitSoundDelay;
        }
    }

}