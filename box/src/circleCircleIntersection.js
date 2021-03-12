
let start = new THREE.Vector3();
let end = new THREE.Vector3();
let directionVector = new THREE.Vector3();
const kEpsilon = 0.00001;

export function doesCircleCollideWithOtherCircle(
    startPos,
    endPos,
    movingRadius,
    stationaryPos,
    stationaryRadius,
    hitPoint,
    hitNormal,
    hitT
)
{
    //We want to translate stationary circle to origin, so we need to translate start and end pos by the same amount.
    start.subVectors(startPos, stationaryPos);
    start.y = 0.0;

    

    end.subVectors(endPos, stationaryPos);
    end.y = 0.0;

    // Add the two radii together to make a bigger stationary circle that we can raycast against with a line
    let combinedRadius = stationaryRadius + movingRadius;

    // if startPos is inside radius, return true because we're stuck inside and trying to get out
    // if (startPos.x*startPos.x + startPos.z*startPos.z < (combinedRadius*combinedRadius))
    // {
    //     hitPoint.copy(endPos);
    //     return false;
    // }

    directionVector.subVectors(end, start);

    // if directionVector is moving out of the circle, the return true



    // line = startPos + t * dirVec
    //      = (startPos.x + t * dirVec.x) + (startPos.y + t * dirVec.y)

    // Solve X^2 + Y^2 = R^2
    // X = (startPos.x + t * dirVec.x)
    // X^2 = (startPos.x + t * dirVec.x)(startPos.x + t * dirVec.x)
    //     = startPos.x^2 + 2 * t * startPos.x * dirVec.x + t^2 * dirVec.x^2
    // Y = (startPos.y + t * dirVec.y)

    // Quadratic equation is Ax^2 + Bx + C = 0
    // A = dirVec.x^2 + dirVec.y^2
    // B = 2 * startPos.x * dirVec.x + 2 * startPos.y * dirVec.y
    // C = startPos.x^2 + startPos.y^2 + radius^2

    let A = directionVector.x * directionVector.x + directionVector.z * directionVector.z;
    let B = 2.0 * start.x * directionVector.x + 2.0 * start.z * directionVector.z;
    let C = start.x * start.x + start.z * start.z - combinedRadius*combinedRadius;

    

    let discriminant = B*B - 4.0 * A * C;
    if (discriminant < 0.0) 
    {
        //no real intersection points ==> no collision
        hitPoint.copy(endPos);
        hitT = 1.0;
        return false;
    }
    let plusMinusPart = Math.sqrt(discriminant);
    let oneOver2A = 1.0 / (2.0 * A);
    let t0 = (-B - plusMinusPart) * oneOver2A;
    let t1 = (-B + plusMinusPart) * oneOver2A;


    // TEMPTEMPTEMPTEMP!!!!!!!!!!!!!!!!!!!!!
    hitNormal.copy(directionVector);
    hitNormal.negate();
    hitNormal.normalize();

    // if nearer hit point is close to zero, then don't move at all... it means that we're already in contact
    // if it was significantly negative, it means we're already inside and don't want to register a hit.
    if (-kEpsilon <= t0 && t0 <= kEpsilon)
    {
        hitPoint.copy(startPos);
        hitT = 0.0;
        return true;
    }
    else if (0.0 <= t0 && t0 <= 1.0)
    {
        
        hitPoint.lerpVectors(startPos, endPos, t0);
        // console.log("Move from (" + start.x + ", " + start.z + ") to (" + end.x + ", " + end.z + ")");
        // console.log("HIT @ (" + hitPoint.x + ", " + hitPoint.z + "). t0 = " + t0);
        hitT = t0;
        return true;
    }
    else if (kEpsilon <= t1 && t1 <= 1.0)
    {
        hitPoint.lerpVectors(startPos, endPos, t1);
        // console.log("Move from (" + start.x + ", " + start.z + ") to (" + end.x + ", " + end.z + ")");
        // console.log("HIT @ " + hitPoint.x + ", " + hitPoint.z + ". t1 = " + t1);
        hitT = t1;
        return true;
    }

    // console.log("Move from (" + start.x + ", " + start.z + ") to (" + end.x + ", " + end.z + ")");
    // console.log("NO HIT");
    hitPoint.copy(endPos);
    hitT = 1.0;
    return false;
}