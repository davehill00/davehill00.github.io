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

export class HitResult
{
    constructor()
    {
        this.hitPoint = new THREE.Vector3();
        this.hitNormal = new THREE.Vector3();
        this.hitT = -1.0;
    }
}

export function doesSphereCollideWithOtherSphere(
    startPos,
    endPos,
    movingRadius,
    stationaryPos,
    stationaryRadius,
    result,
    log=false
)
{

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
        if (false && log)
            console.log("A = 0, not moving.");
        result.hitPoint.copy(endPos);

        // hitNormal.copy(hitPoint);
        // hitNormal.sub(stationaryPos);
        // hitNormal.normalize();

        result.hitT = 1.0;
        return false;


    }
    else 
    if (discriminant < 0.0)
    {
        //if(log) console.log("NO COLLISION CASE");

        result.hitPoint.copy(endPos);
        result.hitT = 1.0;
        return false;
    }
    else
    {
        let plusMinusPart = Math.sqrt(discriminant);
        let oneOver2A = 1.0/(2.0*A);
        let t0 = (-B - plusMinusPart) * oneOver2A;
    
        if (log)
        {
            console.log("A: " + A.toFixed(3) + ", B: " + B.toFixed(3) + ", C: " + C.toFixed(3));
            console.log("T0: " + t0.toFixed(3));
        }

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
                result.hitT = 1.0;
                result.hitPoint.copy(endPos);
                return false;
            }
            else
            {
                // we're trying to push in, since the other collision point is ahead in the direction of the ray
                result.hitPoint.copy(startPos);

                result.hitNormal.copy(rayDirection);
                result.hitNormal.negate();
                result.hitNormal.normalize();

                result.hitT = 0.0;

                return true;
            }
        }
        else
        {
            if(log)
                console.log("starting outside -- t0 = " + t0);
            // We're starting outside the sphere
            if (t0 < 1.0)
            {
                result.hitPoint.copy(startPos);
                result.hitPoint.addScaledVector(rayDirection, t0);

                result.hitNormal.copy(result.hitPoint);
                result.hitNormal.sub(stationaryPos);
                result.hitNormal.normalize();

                result.hitT = t0;

                return true;
            }
            else
            {
                result.hitPoint.copy(endPos);
                result.hitT = 1.0;
                return false;
            }
        }
    }
}