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

let tPunchDirection2D = new THREE.Vector3();
let tPunchDirection = new THREE.Vector3();

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
        // compute instantaneous forwardndirection (i.e., from head position to bag target position)
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

        this.lastPunchDirection.copy(tVec2);

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