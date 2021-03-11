// let start = new THREE.Vector3();
// let end = new THREE.Vector3();
let rayDirection = new THREE.Vector3();
let rayStart = new THREE.Vector3();
let toCenterVec = new THREE.Vector3();
const kPlusEpsilon = 0.0000001;
const kMinusEpsilon = -kPlusEpsilon;

// let directionVector = new THREE.Vector3();
// const kEpsilon = 0.00001;
function isApproxZero(value)
{
    return kMinusEpsilon < value && value < kPlusEpsilon;
}

export function doesSphereCollideWithOtherSphere(
    startPos,
    endPos,
    movingRadius,
    stationaryPos,
    stationaryRadius,
    hitPoint,
    hitNormal,
    hitT,
    log=false
)
{

    // @TODO
    // Figure out the logic and different cases for intersections -- don't just randomly check T0 and T1
    // If I'm moving out of the bag, I should always get out -- maybe look at Ray Direction and something else to figure this out
    // I can tell if StartPos is inside the sphere with a simple radius check -- if it is, can tell if endPos is out in a good direction 
    // (i.e., trying to get out not go through)
    // T0 should always be closer to startPos (unless it's negative... if it's negative, that means I'm inside)
    // Sketch out all the cases and figure out it instead of just guessing






    //
    // Do a raycast fron startPos to endPos against a stationary sphere with the combined radius of both spheres
    //

    let combinedRadius = movingRadius + stationaryRadius;

    // Get ray direction
    rayDirection.copy(endPos);
    rayDirection.sub(startPos);

    if(false)
    {
        console.log(
            "MOVING FROM: " + startPos.x.toFixed(3) + ", " + startPos.y.toFixed(3) + ", " + startPos.z.toFixed(3) +
            " TO: " + endPos.x.toFixed(3) + ", " + endPos.y.toFixed(3) + ", " + endPos.z.toFixed(3)
        );
    }

    // We want the sphere centered at 0,0,0, so subtract the same amount from start pos to translate it as well
    rayStart.copy(startPos);
    rayStart.sub(stationaryPos);


    // Sphere equation (centered at 0,0,0) is X^2 + Y^2 + Z^2 = R^2
    // Line equation is P0 + V*t
    // Sub this into the sphere equation and solve for t to get the intersection point(s)

    let A = rayDirection.lengthSq(); // V dot V
    let B = 2.0 * rayStart.dot(rayDirection); // 2 * P0 dot V
    let C = rayStart.lengthSq() - (combinedRadius * combinedRadius); // P0 dot P0 - R^2
 
    // Solve the quadratic

    // if( A < kPlusEpsilon )
    // {
    //     //A is effectively zero, so this is a linear equation:
    //     let t = -C/B;
    //     if (log) 
    //         console.log("A is zero, t = " + t);
    // }
    let discriminant = B*B - 4.0*A*C;

    if (A <= kPlusEpsilon)
    {
        if (log)
            console.log("A = 0, not moving.");
        hitPoint = endPos;

        // hitNormal.copy(hitPoint);
        // hitNormal.sub(stationaryPos);
        // hitNormal.normalize();

        hitT = 1.0;
        return false;


    }
    else 
    if (discriminant < 0.0)
    {
        //if(log) console.log("NO COLLISION CASE");

        hitPoint = endPos;
        hitT = 1.0;
        return false;
    }
    else
    {
        let plusMinusPart = Math.sqrt(discriminant);
        let oneOver2A = 1.0/(2.0*A);
        let t0 = (-B - plusMinusPart) * oneOver2A;
        let t1 = (-B + plusMinusPart) * oneOver2A;
        console.assert(t0 < t1);

    
        if (log)
        {
            console.log("A: " + A.toFixed(3) + ", B: " + B.toFixed(3) + ", C: " + C.toFixed(3));
            console.log("T0: " + t0.toFixed(3) + ", T1: " + t1.toFixed(3));
        }

        // if(isApproxZero(t0))
        // {
        //     if (log)
        //         console.log("t0 is approx zero: " + t0);
        //     if (t1 > kPlusEpsilon)
        //     {
        //         if (log)
        //             console.log("pushing in -- t1 = " + t1);
        //         // starting point is right on the surface, and we're pushing in
        //         hitPoint.copy(startPos);

        //         hitNormal.copy(rayDirection);
        //         hitNormal.negate();
        //         hitNormal.normalize();

        //         hitT = 0.0;
        //         return true;
        //     }
        //     else if (t1 < kMinusEpsilon)
        //     {
        //         if (log)
        //             console.log("pulling out -- t1 = " + t1);

        //         // starting point is on the surface, and we're pulling away from it
        //         hitPoint.copy(endPos);
        //         hitT = 1.0;
        //         return false;
        //     }
        //     else
        //     {
        //         console.log("T0 and T1 are both zero-ish: " + t0 + ", " + t1);
        //         console.assert(false);
        //     }
        // }
        // else 
        if (t0 < kPlusEpsilon)
        {
            if (log)
                console.log("t0 is not positive: " + t0);

            //compute ray from startpos into center of sphere (i.e., pushing in vector)
            toCenterVec.copy(stationaryPos);
            toCenterVec.sub(startPos);

            let pushingInTest = rayDirection.dot(toCenterVec);
            if (pushingInTest < 0)
            {
                // pulling out
                hitT = 1.0;
                hitPoint.copy(endPos);
                return false;
            }
            else
            {
                // we're trying to push in, since the other collision point is ahead in the direction of the ray
                hitPoint.copy(startPos);

                hitNormal.copy(rayDirection);
                hitNormal.negate();
                hitNormal.normalize();

                hitT = 0.0;

                return true;
            }
            

            // // We're starting inside the sphere         
            // if (t1 > kPlusEpsilon)
            // {
            //     if (log)
            //         console.log("pushing in -- t1 = " + t1);

            //     // we're trying to push in, since the other collision point is ahead in the direction of the ray
            //     hitPoint.copy(startPos);

            //     hitNormal.copy(rayDirection);
            //     hitNormal.negate();
            //     hitNormal.normalize();

            //     hitT = 0.0;

            //     return true;
            // }
            // else if (t1 < kMinusEpsilon)
            // {
            //     if (log)
            //         console.log("pulling out -- t1 = " + t1);

            //     // we're trying to pull out, since the other collision point is behind in the direction of the ray
            //     hitPoint.copy(endPos);
            //     hitT = 1.0;

            //     return false;
            // }
        }
        else
        {
            if(log)
                console.log("starting outside -- t0 = " + t0);
            // We're starting outside the sphere
            if (t0 < 1.0)
            {
                hitPoint.copy(startPos);
                hitPoint.addScaledVector(rayDirection, t0);

                hitNormal.copy(hitPoint);
                hitNormal.sub(stationaryPos);
                hitNormal.normalize();

                hitT = t0;

                return true;
            }
            else
            {
                hitPoint.copy(endPos);
                hitT = 1.0;
                return false;
            }
        }
    }
}