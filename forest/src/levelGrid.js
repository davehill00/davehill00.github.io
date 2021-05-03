import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const kGridSize = 25.0;
const kOneOverGridSize = 1.0 / kGridSize;
const kHalfGridSize = kGridSize * 0.5;
let gGridAssetManager = null;
let gLevelGrid = null;

class GridSquare
{
    constructor(xIndex, zIndex, assetId)
    {
        this.origin = new THREE.Vector3(xIndex * kGridSize, 0.0, zIndex * kGridSize);
        this.asset = null;
        this.parent = null;
        this.assetId = assetId;
        this.xIndex = xIndex;
        this.zIndex = zIndex;
    }

    isInScene()
    {
        return this.parent != null;
    }

    addToScene(parent)
    {
        console.log("ADD Grid[" + this.xIndex + ", " + this.zIndex + "] to scene.");
        this.parent = parent;

        // get asset from asset pool
        this.asset = gGridAssetManager.allocateGridAsset(this.assetId);

        // set its position to my origin
        this.asset.position.copy(this.origin);

        // add it to the scene
        this.parent.add(this.asset);
    }

    unload()
    {
        // remove asset from parent (so no longer in the scene graph)
        this.parent.remove(this.asset);
        this.parent = null;

        // return the asset to the pool
        gGridAssetManager.freeGridAsset(this.assetId, this.asset);

        // null out asset ref
        this.asset = null;
    }

    setRenderOrder(order)
    {
        this.asset.renderOrder = order;
    }
}

export function InitializeLevelGrid( scene )
{
    return new Promise( (resolve) => {
        const kSize = 10;
        gLevelGrid = new LevelGrid(-kSize, kSize, -kSize, kSize, scene);
        resolve();
    });
}

export function UpdateLevelGrid(cameraPosition)
{
    if (gLevelGrid)
    {
        gLevelGrid.updateVisibility(cameraPosition);
    }
}

class LevelGrid
{
    constructor(xGridMin, xGridMax, zGridMin, zGridMax, scene)
    {
        this.xGridMin = xGridMin;
        this.xGridMax = xGridMax;
        this.zGridMin = zGridMin;
        this.zGridMax = zGridMax;

        this.xGridSquares = xGridMax - xGridMin + 1;
        this.zGridSquares = zGridMax - zGridMin + 1;
        this.squares = new Array(this.xGridSquares * this.zGridSquares);
        
        for(let z = zGridMin; z <= zGridMax; z++)
        {
            for (let x = xGridMin; x <= xGridMax; x++)
            {
                this.squares[x + z * this.xGridSquares] = new GridSquare(x,z,0);
            }
        }

        this.scene = scene;
        this.visibleSet = [];
    }

    updateVisibility(position)
    {
        // player is at position
        // determine which grid square this falls into
        let playerGridX = Math.floor((position.x + kHalfGridSize) * kOneOverGridSize);
        let playerGridZ = Math.floor((position.z + kHalfGridSize) * kOneOverGridSize);
        

        // determine grid ranges around this

        let minX = Math.max(playerGridX - 2, this.xGridMin);
        let maxX = Math.min(playerGridX + 2, this.xGridMax);
        let minZ = Math.max(playerGridZ - 2, this.zGridMin);
        let maxZ = Math.min(playerGridZ + 2, this.zGridMax);
        
        // prune any currently visible squares that are outside that set
        let bVisibilityChanged = false;
        for (let i = 0; i < this.visibleSet.length; i++)
        {
            let square = this.visibleSet[i];
            if (square == null) // near the edges, we may not have a full visible set
                continue;

            if (square.xIndex < minX || square.xIndex > maxX ||
                square.zIndex < minZ || square.zIndex > maxZ)
            {
                square.unload();
                bVisibilityChanged = true;
            }
        }

        if (bVisibilityChanged || this.visibleSet.length == 0)
        {
            
            console.log("UPDATE VISIBILITY: " + position.x + ", " + position.z + " ==> " + playerGridX + ", " + playerGridZ);

            this.visibleSet.fill(null);
            
            // add new squares that should be visible but aren't
            let index = 0;
            for (let z = minZ; z <= maxZ; z++)
            {
                for (let x = minX; x <= maxX; x++)
                {
                    let square = this.squares[x + z * this.xGridSquares];
                    if (!square.isInScene())
                    {
                        //@TODO -- do something with render order here
                        square.addToScene(this.scene);
                    }
                    if (x == playerGridX && z == playerGridZ)
                    {
                        square.setRenderOrder(1);
                    }
                    else
                    {
                        square.setRenderOrder(10);
                    }
                    this.visibleSet[index++] = square;
                }
            }

            console.log("VISIBLE SET SIZE: " + index);
        }
    }
}


const kInstanceStr = "Instance";
const kMaxInstanceCount = 50;

// Returns a promise
export function InitializeGridAssetManager()
{
    gGridAssetManager = new GridAssetManager();
    return gGridAssetManager.loadAssets();
}

class GridAssetManager
{
    constructor()
    {
        this.gridAssets = [];
        this.instancedPropAssets = [];
        this.gltfLoader = new GLTFLoader();
    }

    loadAssets()
    {
        // let instancedPropPromises = [];
        // loadInstancedPropAsset(kTreeInstance, "./content/dead_tree_1.gltf", instancedPropPromises);

        let gridPromises = [];
        this.loadGridAsset(0, "./content/TerrainSquare2.gltf", gridPromises);
        // loadGridAsset(1, "./content/TerrainSquare3.gltf", gridPromises);
        // loadGridAsset(2, "./content/TerrainSquare4.gltf", gridPromises);
        // loadGridAsset(3, "./content/TerrainSquare5.gltf", gridPromises);

        return Promise.all(gridPromises);
    }

    loadGridAsset(id, path, promises)
    {
        promises.push(
            new Promise((resolve, reject) =>
            {
                this.gltfLoader.load(path, (gltf) => 
                {
                    let gridGroup = new THREE.Group();
                    gridGroup.name = id + ": " + path;

                    let instancedMeshes = {};
                    let matrix = new THREE.Matrix4();                

                    for (let i = 0; i < gltf.scene.children.length; i++)
                    {
                        let obj = gltf.scene.children[i];

                        // Walk the scene and extract all instanced objects and wire them
                        // up to the instanced props
                        if (obj.name.includes(kInstanceStr))
                        {
                            // let nameChunks = obj.name.split(".");
                            let instName = obj.name.slice(0, obj.name.indexOf(kInstanceStr) + kInstanceStr.length);
                            console.log("Mapped " + obj.name + " to " + instName);

                            let instMesh = instancedMeshes[instName];
                            if (instMesh == null)
                            {
                                let mesh = new THREE.InstancedMesh(
                                    obj.geometry,
                                    obj.material,
                                    kMaxInstanceCount
                                );
                                instMesh = {mesh: mesh, count: 0};
                                instancedMeshes[instName] = instMesh;
                            }
                            console.assert(instMesh.count < kMaxInstanceCount);
                            
                            matrix.compose(obj.position, obj.quaternion, obj.scale);
                            instMesh.mesh.setMatrixAt(instMesh.count++, matrix);
                        }
                        else
                        {
                            // Any non-instanced props can be added to the gridGroup directly
                            gridGroup.add(obj);
                        }
                    }
                    // go over all instance meshes, add them to the scene, and mark them for update
                    console.log("Instanced meshes for: " + path);
                    for (let key in instancedMeshes)
                    {
                        let item = instancedMeshes[key];
                        console.log("\t" + key + ": " + item.count);

                        gridGroup.add(item.mesh);
                        item.mesh.instanceMatrix.needsUpdate = true;
                        item.mesh.count = item.count;
                    }

                    this.gridAssets[id] = {
                        prototype: gridGroup,
                        pool: []  //@TODO -- can we allocate the array to some reasonable size but keep length at zero?
                    };
                    resolve();
                })

            }));
    }

    allocateGridAsset(id)
    {
        let ga = this.gridAssets[id];

        if (ga)
        {
            let result;
            if (ga.pool.length)
            {
                result = ga.pool.pop();
            }
            else
            {
                result = ga.prototype.clone();
            }

            return result;
        }
        return null;
    }

    freeGridAsset(id, asset)
    {
        let ga = this.gridAssets[id];
        console.assert(ga != null);
        ga.pool.push(asset);
    }
}