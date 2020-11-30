export function ComputePDAcceleration(
    value,
    velocity,
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

    return ksI * (targetValue - value) + kdI * (targetVelocity - velocity);
}

let _newVelocity = new THREE.Vector3();
let _newValue = new THREE.Vector3();

export function ApplyPDVec3(
    value, 
    velocity,
    targetValue,
    targetVelocity,
    frequency,
    damping,
    dt
)
{
    let accelX = ComputePDAcceleration(value.x, velocity.x, targetValue.x, targetVelocity.x, frequency, damping, dt);
    let accelY = ComputePDAcceleration(value.y, velocity.y, targetValue.y, targetVelocity.y, frequency, damping, dt);
    let accelZ = ComputePDAcceleration(value.z, velocity.z, targetValue.z, targetVelocity.z, frequency, damping, dt);
    
    velocity.x += accelX * dt;
    velocity.y += accelY * dt;
    velocity.z += accelZ * dt;
    
    value.x += velocity.x * dt;
    value.y += velocity.y * dt;
    value.z += velocity.z * dt;
}