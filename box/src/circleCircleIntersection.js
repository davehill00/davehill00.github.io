import { doesSphereCollideWithOtherSphere } from "./sphereSphereIntersection";

let start = new THREE.Vector3();
let end = new THREE.Vector3();
let stationary = new THREE.Vector3();

let directionVector = new THREE.Vector3();
const kEpsilon = 0.00001;

export function doesCircleCollideWithOtherCircle(
    startPos,
    endPos,
    movingRadius,
    stationaryPos,
    stationaryRadius,
    result,
    log = false
)
{
    start.copy(startPos);
    start.y = 0.0;
    end.copy(endPos);
    end.y = 0.0;
    stationary.copy(stationaryPos);
    stationary.y = 0.0;

    let hit = doesSphereCollideWithOtherSphere(start, end, movingRadius, stationary, stationaryRadius, result, log);

    if (hit)
    {
        result.hitPoint.lerpVectors(startPos, endPos, result.hitT);

        result.hitNormal.subVectors(endPos, startPos);
        result.hitNormal.normalize();
    }
    return hit;
}
