import * as THREE from 'three';

function clamp(value, min, max)
{
    return Math.min(Math.max(value, min), max);
}

export class PlayerHud
{
    constructor(camera, audioListener)
    {
        this.camera = camera;
        this.audioListener = audioListener;

        this.screenQuad = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(10.0, 10.0, 1, 1), 
            new THREE.MeshBasicMaterial(
                {
                    color: 0x801010, 
                    opacity: 0.0, 
                    transparent: true,
                    depthTest: false,
                    depthWrite: false,
                    blending: THREE.AdditiveBlending
                }));

        this.screenQuad.renderOrder = 1;
        this.screenQuad.position.z = -1;
        camera.add(this.screenQuad);


        this.hitTimer = 0.0;
    }

    processHit()
    {
        this.hitTimer = Math.min(this.hitTimer + 0.5, 0.5);
    }

    update(dt)
    {
        if (this.hitTimer > 0.0)
        {
            this.hitTimer -= dt;
            let intensity = clamp(this.hitTimer*2.0, 0.0, 0.8);
            this.screenQuad.material.opacity = intensity;
        }
    }
}