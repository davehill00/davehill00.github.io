import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Vector3 } from 'three/src/math/Vector3';

const kGrassGridSide = 32;
const kHalfGrassGridSide = kGrassGridSide * 0.5;
const kGrassInstanceStride = 1.0;
const kGrassInstanceSnap = 5; //1.0 / kGrassGridSide;
const kMaxGrassInstances = kGrassGridSide * kGrassGridSide;

export class GrassSystem
{
    constructor(scene, renderer)
    {
        this.scene = scene;
        this.renderer = renderer;
        let gltfLoader = new GLTFLoader();
        gltfLoader.load("./content/grass.gltf", (gltf) => 
        {
            let mesh = gltf.scene.children[0];
            this.instances = new THREE.InstancedMesh(
                mesh.geometry,
                mesh.material,
                kMaxGrassInstances
            );

            this.tempQuat = mesh.quaternion;
            /*
            for (let i = 0; i < kMaxGrassInstances; i++)
            {
                this.tempPos.random();
                this.tempPos.y = -0.05;

                // this.tempMatrix.setPosition(this.tempPos);
                this.tempMatrix.compose(this.tempPos, this.tempQuat, this.tempScale);
                this.instances.setMatrixAt(i, this.tempMatrix);
            }
            this.instances.instanceMatrix.needsUpdate = true;
            */
            // this.scene.add(mesh);
            this.update(0, this.tempPos);
            this.scene.add(this.instances);
        });

        this.tempMatrix = new THREE.Matrix4();
        this.tempPos = new THREE.Vector3();
        this.tempQuat = new THREE.Quaternion();
        this.tempScale = new THREE.Vector3(0.2,0.2,0.2);
        this.snappedPos = new THREE.Vector3();


        this.instanceOffsets = [];
        for (let z = 0; z < kGrassGridSide; z++)
        {
            for (let x = 0; x < kGrassGridSide; x++)
            {
                //@TODO -- add some randomization
                this.instanceOffsets[x + z * kGrassGridSide] = new Vector3( 
                    -kHalfGrassGridSide * kGrassInstanceStride + x * kGrassInstanceStride, 0.0, -kHalfGrassGridSide * kGrassInstanceStride + z * kGrassInstanceStride);
                    //(-kHalfGrassGridSide + x * kGrassGridSide) * kGrassGridSide, 0.0, (-kHalfGrassGridSide + z * kGrassGridSide) * kGrassGridSide );
            }
        }
    }

    update(dt, position)
    {

        if (this.instances)
        {
            this.snappedPos.copy(position);
           this.snappedPos.x = Math.floor(this.snappedPos.x); // * kGrassInstanceSnap) * 0.2; //kGrassInstanceStride;
           this.snappedPos.z = Math.floor(this.snappedPos.z); // * kGrassInstanceSnap) * 0.2; //kGrassInstanceStride;
            for (let i = 0; i < kMaxGrassInstances; i++)
            {
                this.tempPos.copy(this.snappedPos); //addVectors(this.snappedPos, this.instanceOffsets[i]);
                this.tempPos.add(this.instanceOffsets[i]);
                //@TODO -- add rotation?
                this.tempMatrix.compose(this.tempPos, this.tempQuat, this.tempScale);

                this.instances.setMatrixAt(i, this.tempMatrix);
            }

            this.instances.instanceMatrix.needsUpdate = true;
        }
    }
}