export function ComputePDAcceleration(
    currentValue,
    currentVelocity,
    targetValue,
    targetVelocity,
    frequency,
    damping,
    dt
)
{
    const ks = frequency * frequency * 36.0;
    const kd = frequency * damping * 9.0;
    const scale = 1.0 / ( 1.0 + kd * dt + ks*dt*dt );

    const ksI = ks  *  scale;
	const kdI = ( kd + ks* dt ) * scale;

    return ksI * (targetValue - currentValue) + kdI * (targetVelocity - currentVelocity);
}

let _newVelocity = new THREE.Vector3();
let _newValue = new THREE.Vector3();

export function ApplyPDVec3(
    currentValue, 
    currentVelocity,
    targetValue,
    targetVelocity,
    frequency,
    damping,
    dt
)
{
    let accelX = ComputePDAcceleration(currentValue.x, currentVelocity.x, targetValue.x, targetVelocity.x, frequency, damping, dt);
    let accelY = ComputePDAcceleration(currentValue.y, currentVelocity.y, targetValue.y, targetVelocity.y, frequency, damping, dt);
    let accelZ = ComputePDAcceleration(currentValue.z, currentVelocity.z, targetValue.z, targetVelocity.z, frequency, damping, dt);
    
    currentVelocity.x += accelX * dt;
    currentVelocity.y += accelY * dt;
    currentVelocity.z += accelZ * dt;
    
    currentValue.x += currentVelocity.x * dt;
    currentValue.y += currentVelocity.y * dt;
    currentValue.z += currentVelocity.z * dt;
}