import * as THREE from 'three';

export class Flare
{
    constructor(position, scene, playerController, renderer)
    {

        let playerTranslationGroup = playerController.getTranslationGroup();

        var texture = new THREE.TextureLoader().load('./content/sunflare.png');
        let geo = new THREE.PlaneGeometry(5.0, 5.0, 1, 1);
        let mat = new THREE.MeshBasicMaterial( 
            {
                color: 0xffffff,
                side: THREE.FrontSide,
                opacity: 0.0,
                transparent: true,
                map: texture,
                fog: false
            }
        );
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.position.set(position.x, position.y, position.z);
        // playerTranslationGroup.attach(this.mesh);
        //zone.addSceneObject(this.mesh);


        // this.zone = zone;
        // this.camera = camera;
        this.renderer = renderer;
        this.camHeading = new THREE.Vector3(0,0,0);
        this.toFlarePos = new THREE.Vector3(0,0,0);

        this.targetPos = new THREE.Vector3(0,0,0);

        let sunGeo = new THREE.CircleGeometry(8.0, 32);
        let sunMat = new THREE.MeshBasicMaterial(
            {
                color: 0xffffff,
                side: THREE.DoubleSide,
                opacity: 1.0,
                fog: false
            }
        );
        sunMat.color.convertSRGBToLinear();
        this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
        this.sunMesh.position.set(position.x*1.01, position.y*1.01, position.z*1.01);
        // playerTranslationGroup.attach(this.sunMesh);
    
        
        this.posAccum = 0.0;

        // this.stars = new Stars(playerTranslationGroup);

    }

    update(dt)
    {

        if (this.renderer.xr.isPresenting)
        {
            let xrCamera = this.renderer.xr.getCamera(this.camera);
            xrCamera.getWorldDirection(this.camHeading);

            this.mesh.lookAt(xrCamera.position);
            this.sunMesh.lookAt(xrCamera.position);

            this.posAccum += dt;
            this.targetPos.y = Math.sin(this.posAccum) * 10.0;

            //this.camera.getWorldDirection(this.camHeading);
            this.toFlarePos.subVectors(this.mesh.position, xrCamera.position);
            this.toFlarePos.normalize();

            let dot = this.camHeading.dot(this.toFlarePos);
            const kMin = 0.7;
            const kMax = 0.95;
            const kSmall = 4.0;
            const kBig = 12.0;

            if (dot > kMin)
            {
                let t = Math.min((dot - kMin) / (kMax - kMin), 1.0);
                this.mesh.material.opacity = t * 0.4;
                let size = kSmall + (kBig - kSmall) * t;
                this.mesh.scale.set(size, size, size);
            }
            else
            {
                this.mesh.material.opacity = 0.0;
                this.mesh.scale.set(1.0, 1.0, 1.0);
            }
        }
        else
        {
            this.mesh.material.opacity = 0.0;
            this.mesh.scale.set(1.0, 1.0, 1.0);
        }

    }
}

export class Stars
{
    constructor(scene)
    {
        let geometry = new THREE.BufferGeometry();
        let vertices = [];
        let vertex = new THREE.Vector3();

        for (let i = 0; i < 1000; i++)
        {
            let x = Math.random() * 2.0 - 1.0;
            let y = Math.random();
            let z = Math.random() * 2.0 - 1.0;
            vertex.set(x,y,z);
            vertex.normalize();
            vertex.multiplyScalar(110.0);
            vertices.push(vertex.x, vertex.y, vertex.z);
        }
        geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
        let material = new THREE.PointsMaterial({size: 0.5, color: 0xffffff, sizeAttenuation: false, transparent:false, fog: false});
        material.color.convertSRGBToLinear();
        this.stars = new THREE.Points(geometry, material);

        scene.add(this.stars);
    }   
}