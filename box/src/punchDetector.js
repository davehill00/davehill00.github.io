import { MovingAverageDirectionVector } from "./movingAverage";

export const PUNCH_UNKNOWN = 0;
export const PUNCH_JAB = 1;
export const PUNCH_STRAIGHT = 2;
export const PUNCH_LEFT_HOOK = 3;
export const PUNCH_RIGHT_HOOK = 4;
export const PUNCH_LEFT_UPPERCUT = 5;
export const PUNCH_RIGHT_UPPERCUT = 6;
// export const PUNCH_LEFT_UPPERCUT = 5;
// export const PUNCH_RIGHT_UPPERCUT = 6;

let tVec0 = new THREE.Vector3();
let tVec1 = new THREE.Vector3();
let tVec2 = new THREE.Vector3();
let playerSpaceTransform = new THREE.Matrix4();
let worldToPlayerSpaceTransform = new THREE.Matrix4();

let tPunchDirection2D = new THREE.Vector3();
let tPunchDirection = new THREE.Vector3();
let tGloveOrientationMatrix = new THREE.Matrix4();
let tGloveOrientationX = new THREE.Vector3();
let tGloveOrientationY = new THREE.Vector3();
let tGloveOrientationZ = new THREE.Vector3();

let tGloveVelocity = new THREE.Vector3();
let tGloveAngularVelocity = new THREE.Vector3();

export class PunchDetector
{
    constructor()
    {
        this.averageDirectionTracker = new MovingAverageDirectionVector(90);
        this.bag = null;
        this.lastPunchDirection = new THREE.Vector3();
    }

    initialize(bag)
    {
        this.bag = bag;
    }

    update(dt, headPosition)
    {
        // compute instantaneous forward direction (i.e., from head position to bag target position)
        if (this.bag != null)
        {
            tVec0.copy(this.bag.targetPosition);
            tVec0.sub(headPosition);
            tVec0.setY(0.0);
            tVec0.normalize();

            // update average "forward" direction
            this.averageDirectionTracker.recordEntry(tVec0);
        }
    }
    analyzePunch_V3(glove, velocity)
    {
        //
        // Compute the player-relative space transform
        //

        // Read the average forward direction so we can use this for punch-direction checks
        this.averageDirectionTracker.getAverageDirection(tVec0);
        // negate to get the Z-axis
        tVec0.negate();

        // compute "right" vector
        tVec1.crossVectors(THREE.Object3D.DefaultUp, tVec0);
        tVec1.setY(0.0);
        tVec1.normalize();

        // compute the world-to-local transform for player-relative space
        playerSpaceTransform.makeBasis(tVec1, THREE.Object3D.DefaultUp, tVec0);
        worldToPlayerSpaceTransform.copy(playerSpaceTransform);
        worldToPlayerSpaceTransform.invert();

        // compute the following in player-relative space
        // - glove orientation
        tGloveOrientationMatrix.extractRotation(glove.matrixWorld);
        tGloveOrientationMatrix.premultiply(worldToPlayerSpaceTransform);
        tGloveOrientationMatrix.extractBasis(tGloveOrientationX, tGloveOrientationY, tGloveOrientationZ);


        // - glove velocity
        
        // compute punch directtion
        tPunchDirection.copy(velocity);
        tPunchDirection.normalize();
        tPunchDirection.applyMatrix4(worldToPlayerSpaceTransform);


        tPunchDirection2D.copy(tPunchDirection);
        tPunchDirection2D.setY(0.0);
        tPunchDirection2D.normalize();

        this.lastPunchDirection.copy(velocity);
        this.lastPunchDirection.setY(0.0);
        this.lastPunchDirection.normalize();

        
        // - glove angular velocity
        let bUseAngularVelocity = glove.controller.hasAngularVelocity;
        if (bUseAngularVelocity)
        {
            tGloveAngularVelocity.copy(glove.controller.angularVelocity);
            tGloveAngularVelocity.applyMatrix4(worldToPlayerSpaceTransform);
        }
        if (false)
        {
            console.log("Glove Orientation: "); console.table(tGloveOrientationX); console.table(tGloveOrientationY); console.table(tGloveOrientationZ);
            console.log("Punch Direction: "); console.table(tPunchDirection);
            if (bUseAngularVelocity)
            {
                console.log("Angular Velocity: "); console.table(tGloveAngularVelocity);
            }
        }
        
        // based on handedness and those values, try to deduce the type of punch
        if (glove.whichHand == 1) // Left hand
        {

            // -Z is towards the bag
            if (tPunchDirection2D.z < -0.707 && tGloveOrientationX.y < -0.707) // glove is moving forward, and palm (X axis) is pointing down
            {
                return PUNCH_JAB;
            }
            else if (tPunchDirection2D.x > 0.707 && tGloveOrientationZ.x < -0.707) // glove is pointing across the body 
            {
                return PUNCH_LEFT_HOOK;
            }
            else if (tGloveOrientationX.y > 0.0) // top/thumb is pointing left
            {
                return PUNCH_LEFT_UPPERCUT;
            }

        //     console.log("**** Left Hand Unknown ****")
        //     console.log("tPunchDir x: %.2f, z: %.2f", tPunchDirection2D.x, tPunchDirection2D.z);
        //     console.log("tGloveOrientationX x: %.2f, y: %.2f, z: %.2f", tGloveOrientationX.x, tGloveOrientationX.y, tGloveOrientationX.z);
        //     console.log("tGloveOrientationY x: %.2f, y: %.2f, z: %.2f", tGloveOrientationY.x, tGloveOrientationY.y, tGloveOrientationY.z);
        //     console.log("tGloveOrientationZ x: %.2f, y: %.2f, z: %.2f", tGloveOrientationZ.x, tGloveOrientationZ.y, tGloveOrientationZ.z);
        }
        else
        {
            if (tPunchDirection2D.z < -0.707 && tGloveOrientationX.y > 0.707)
            {
                return PUNCH_STRAIGHT;
            }
            else if (tPunchDirection2D.x < -0.707 && tGloveOrientationZ.x > 0.707)
            {
                return PUNCH_RIGHT_HOOK;
            }
            else if (tGloveOrientationX.y < 0.0) // top/thumb is pointing right
            {
                return PUNCH_RIGHT_UPPERCUT;
            }
        }
        return PUNCH_UNKNOWN;
    }

    NEWanalyzePunch(glove, velocity)
    {
        console.assert(glove.controller.hasAngularVelocity);
        if (glove.whichHand == 1) // left hand
        {
            let ang = glove.controller.angularVelocity;
            // console.table(ang);
            if (ang.x < 0 && ang.y > 0)
            {
                // console.log("JAB");
                return PUNCH_JAB;
            }
            else if (ang.z < 0)
            {
                // console.log("HOOK");
                return PUNCH_LEFT_HOOK;
            }
            else
            {
                // console.log("UPPER");
                return PUNCH_LEFT_UPPERCUT;
            }
        }

        return PUNCH_UNKNOWN;
    }

    // Return punch type
    analyzePunch(glove, velocity)
    {
        const bLogging = false;
        // Read the average forward direction so we can use this for punch-direction checks
        this.averageDirectionTracker.getAverageDirection(tVec0);

        // compute "right" vector
        tVec1.crossVectors(tVec0, THREE.Object3D.DefaultUp);
        tVec1.setY(0.0);
        tVec1.normalize();

        // compute punch directtion
        tPunchDirection.copy(velocity);
        tPunchDirection.normalize();

        tPunchDirection2D.copy(velocity);
        tPunchDirection2D.setY(0.0);
        tPunchDirection2D.normalize();

        this.lastPunchDirection.copy(tPunchDirection2D);

        let bUseAngularY = glove.controller.hasAngularVelocity;
        let angularY = 0.0;
        if (bUseAngularY)
            angularY = glove.controller.angularVelocity.y;

        let dotFwd2D = tPunchDirection2D.dot(tVec0);
        let dotRight2D = tPunchDirection2D.dot(tVec1);
        let dotUp = tPunchDirection.y;
        
        if (glove.whichHand == 1) // Left hand
        {

            
            // console.log("*** LEFT: " + dotUp);

            if (dotFwd2D > 0.85)
            {
                if (bLogging)
                {
                    console.log("LEFT JAB/UPPER **************")
                    console.log("LINEAR"); console.table(glove.controller.linearVelocity);
                    console.log("ANGULAR"); console.table(glove.controller.angularVelocity);
                }
                return PUNCH_JAB;
            }
            else if ((dotRight2D > 0.707) || (bUseAngularY && dotRight2D > 0.5 && angularY < -5.0))
            {
                let bUpper = dotUp > 0.55;

                if (false) //bLogging)
                {
                    if (bUpper) {
                        console.log("LEFT UPPER ************");
                    }
                    else
                    {
                        console.log("LEFT HOOK **************");
                    }
                    console.log("LINEAR"); console.table(glove.controller.linearVelocity);
                    console.log("ANGULAR"); console.table(glove.controller.angularVelocity);
                }

                if (bUpper)
                {
                    return PUNCH_LEFT_UPPERCUT;
                }

                return PUNCH_LEFT_HOOK;
            }
            else
            {
                if (bLogging)
                {
                    console.log("Undetermined LEFT -- fwd = " + dotFwd + ", right = " + dotRight);
                    console.log("LINEAR"); console.table(glove.controller.linearVelocity);
                    console.log("ANGULAR"); console.table(glove.controller.angularVelocity);
                }

            }

        }
        else // Right hand
        {
            let dotFwd = tPunchDirection2D.dot(tVec0);
            let dotRight = tPunchDirection2D.dot(tVec1);
            if (dotFwd > 0.85)
            {
                let bUpper = dotUp > 0.55;

                if (false) //bLogging)
                {
                    if (bUpper) {
                        console.log("RIGHT UPPER ************");
                    }
                    else
                    {
                        console.log("RIGHT STRAIGHT **************");
                    }
                    console.log("LINEAR"); console.table(glove.controller.linearVelocity);
                    console.log("ANGULAR"); console.table(glove.controller.angularVelocity);
                }


                if (bLogging)
                {
                    console.log("STRAIGHT **************")
                    console.log("LINEAR"); console.table(glove.controller.linearVelocity);
                    console.log("ANGULAR"); console.table(glove.controller.angularVelocity);
                }
                if (bUpper)
                    return PUNCH_RIGHT_UPPERCUT;

                return PUNCH_STRAIGHT;
            }
            else if ((dotRight < -0.707) || (bUseAngularY && dotRight < -0.5 && angularY > 5.0))
            {
                let bUpper = dotUp > 0.55;

                if (true) //bLogging)
                {
                    if (bUpper) {
                        console.log("RIGHT UPPER ************");
                    }
                    else
                    {
                        console.log("RIGHT HOOK **************");
                    }
                    console.log("LINEAR"); console.table(glove.controller.linearVelocity);
                    console.log("ANGULAR"); console.table(glove.controller.angularVelocity);
                }

                if (bLogging)
                {
                    console.log("RIGHT HOOK **************")
                    console.log("LINEAR"); console.table(glove.controller.linearVelocity);
                    console.log("ANGULAR"); console.table(glove.controller.angularVelocity);
                }

                if (bUpper)
                    return PUNCH_RIGHT_UPPERCUT;

                return PUNCH_RIGHT_HOOK;
            }
            else
            {
                if (bLogging)
                {
                    console.log("Undetermined RIGHT -- fwd = " + dotFwd + ", right = " + dotRight);
                    console.log("LINEAR"); console.table(glove.controller.linearVelocity);
                    console.log("ANGULAR"); console.table(glove.controller.angularVelocity);
                }
            }
        }

        return PUNCH_UNKNOWN;
    }

    getAverageDirection(vec)
    {
        return this.averageDirectionTracker.getAverageDirection(vec);
    }
    getLastPunchDirection(vec)
    {
        vec.copy(this.lastPunchDirection);
    }
}


class PunchRecorder
{
    constructor()
    {
        this.velocityData = [];
        this.angularVelocityData = [];

    }
    update(dt, )
    {
        // get glove position and orientation (in world space)
        // get glove velocity and angular velocity (in world space)

        // transform to local space is just a rotation around global up
        // where is the player position relative to the bag -- use that as the new forward vector
        // figure out the angle that velocity and angular velocity need to be rotated around global up axis to align with that
 

        // transform glove velocity into player-relative space -- rotate around up axis by the amount computed above

        // transform glove angular velocity into player-relative space
        // compute current and next vectors, based on appling angular velocity to current 
        // compute axis of rotation that the angular velocity implies
        // rotate that axis to 

    }
    // start recording
    // stop recording
    // export recording

}

class PunchGesture
{
    constructor()
    {
        this.hand = hand;
        this.gloveVelocityCurve = [];
        this.gloveAngularVelocityCurve = [];
        this.gloveVelocityWeight = 1.0;
        this.gloveAngularVelocityWeight = 1.0;
        this.detectionThreshold = 0.5;
    }
}