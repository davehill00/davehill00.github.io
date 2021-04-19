import { MovingAverageDirectionVector } from "./movingAverage";

export const PUNCH_UNKNOWN = 0;
export const PUNCH_JAB = 1;
export const PUNCH_STRAIGHT = 2;
export const PUNCH_LEFT_HOOK = 3;
export const PUNCH_RIGHT_HOOK = 4;
// export const PUNCH_LEFT_UPPERCUT = 5;
// export const PUNCH_RIGHT_UPPERCUT = 6;

let tVec0 = new THREE.Vector3();
let tVec1 = new THREE.Vector3();
let tVec2 = new THREE.Vector3();

export class PunchDetector
{
    constructor()
    {
        this.averageDirectionTracker = new MovingAverageDirectionVector(90);
        this.bag = null;
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

    // Return punch type
    analyzePunch(whichHand, velocity)
    {
        // Read the average forward direction so we can use this for punch-direction checks
        this.averageDirectionTracker.getAverageDirection(tVec0);

        // compute "right" vector
        tVec1.crossVectors(tVec0, THREE.Object3D.DefaultUp);
        tVec1.setY(0.0);
        tVec1.normalize();

        // compute punch directtion
        tVec2.copy(velocity);
        tVec2.setY(0.0);
        tVec2.normalize();

        if (whichHand == 1) // Left hand
        {
            let dotFwd = tVec2.dot(tVec0);
            let dotRight = tVec2.dot(tVec1);
            if (dotFwd > 0.95)
            {
                return PUNCH_JAB;
            }
            else if (dotRight > 0.8)
            {
                return PUNCH_LEFT_HOOK;
            }
            else
            {
                console.log("Undetermined LEFT -- fwd = " + dotFwd + ", right = " + dotRight);
            }
        }
        else // Right hand
        {
            let dotFwd = tVec2.dot(tVec0);
            let dotRight = tVec2.dot(tVec1);
            if (dotFwd > 0.85)
            {
                return PUNCH_STRAIGHT;
            }
            else if (dotRight < -0.707)
            {
                return PUNCH_RIGHT_HOOK;
            }
            else
            {
                console.log("Undetermined RIGHT -- fwd = " + dotFwd + ", right = " + dotRight);
            }
        }

        return PUNCH_UNKNOWN;
    }

    getAverageDirection(vec)
    {
        return this.averageDirectionTracker.getAverageDirection(vec);
    }
}