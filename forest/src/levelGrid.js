import * as THREE from 'three';
import { CENTER, AVERAGE, SAH } from 'three-mesh-bvh';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { KDTree } from './kdTree';

const kGridSize = 25.0;
const kOneOverGridSize = 1.0 / kGridSize;
const kHalfGridSize = kGridSize * 0.5;
let gGridAssetManager = null;
let gLevelGrid = null;

const kColliderStr = "Collider";
const kColliderMaterial = new THREE.MeshBasicMaterial({color: 0x802080});
const kShowColliders = false;

const kInstanceStr = "Instance";
const kMaxInstanceCount = 50;

const gComputeBoundsOptions = {
    lazyGeneration: false,
    strategy: SAH,
    // packData: false
}

export function UpdateLevelGrid(cameraPosition)
{
    if (gLevelGrid)
    {
        gLevelGrid.updateVisibility(cameraPosition);
    }
}

// export function LevelGridRaycast(from, to, hr)
// {
//     if (gLevelGrid)
//     {
//         return gLevelGrid.kdTree.topLevelRaycast(from, to, hr);
//     }
//     else
//     {
//         return false;
//     }
// }

export function InitializeLevelGrid( scene )
{
    return new Promise( (resolve) => {
        const kSize = 10;
        gLevelGrid = new LevelGrid(-kSize, kSize, -kSize, kSize, scene);
        resolve();
    });
}

// Returns a promise
export function InitializeGridAssetManager()
{
    gGridAssetManager = new GridAssetManager();
    return gGridAssetManager.loadAssets();
}

// Return true if there's a collision. Hit result will contain a t-value.
export function LevelGridRaycast(from, to, hr)
{
    hr.t = 1.0;
    if (gLevelGrid)
    {
        return gLevelGrid.kdTree.topLevelRaycast(from, to, hr);
    }
    return false;
}

class GridSquare
{
    constructor(xIndex, zIndex, assetId)
    {
        this.origin = new THREE.Vector3(xIndex * kGridSize, 0.0, zIndex * kGridSize);
        this.asset = null;
        this.levelGrid = null;
        this.assetId = assetId;
        this.xIndex = xIndex;
        this.zIndex = zIndex;
    }

    isInLevelGrid()
    {
        return this.levelGrid != null;
    }

    addToLevelGrid(levelGrid)
    {
        console.log("ADD Grid[" + this.xIndex + ", " + this.zIndex + "] to scene.");
        this.levelGrid = levelGrid;

        // get asset from asset pool -- this is a THREE.Group
        this.asset = gGridAssetManager.allocateGridAsset(this.assetId);

        // set its position to my origin
        this.asset.position.copy(this.origin);
        this.asset.updateWorldMatrix(false, false);

        // add it to the scene
        this.levelGrid.add(this.asset);

        // Add to the KD Tree
        // @TODO - do I need to do "traverse" instead?
        this.asset.children.forEach((child) => 
        {
            if (child.isCollider)
            {
                this.levelGrid.kdTree.insert(child);
            }
        });
        // this.levelGrid.kdTree.insert(this.asset);
    }

    removeFromLevelGrid()
    {
        // Remove from the KD Tree
        // @TODO - do I need to do "traverse" instead?
        this.asset.children.forEach( (child) => 
        {
            if (child.isCollider)
            {
                child.kdParent.remove(child);
            }
        })
        // this.asset.kdParent.remove(this.asset);

        // remove asset from parent (so no longer in the scene graph)
        this.levelGrid.remove(this.asset);
        this.levelGrid = null;

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



class LevelGrid extends THREE.Group
{
    constructor(xGridMin, xGridMax, zGridMin, zGridMax, scene)
    {
        super();

        this.xGridMin = xGridMin;
        this.xGridMax = xGridMax;
        this.zGridMin = zGridMin;
        this.zGridMax = zGridMax;

        this.xGridSquares = xGridMax - xGridMin + 1;
        this.zGridSquares = zGridMax - zGridMin + 1;
        this.squares = new Array(this.xGridSquares * this.zGridSquares);
        
        let i = 0;
        for(let z = zGridMin; z <= zGridMax; z++)
        {
            for (let x = xGridMin; x <= xGridMax; x++)
            {
                this.squares[x + z * this.xGridSquares] = new GridSquare(x,z, Math.floor(Math.random() * 3.0)); //2); //Math.random() > 0.5 ? 1 : 0);
            }
        }

        this.scene = scene;
        scene.add(this);

        let box = new THREE.Box3(new THREE.Vector3((xGridMin - 1) * kGridSize, -50, (zGridMin-1) * kGridSize), new THREE.Vector3((xGridMax+1) * kGridSize, 50, (zGridMax+1) * kGridSize) );
        this.kdTree = new KDTree(box,[]);

        this.visibleSet = [];

        this.updateVisibility(new THREE.Vector3(0,0,0));
        // this.kdTree.setObjectsVisibleAtLevel(0);
        this.kdTreeVisLevel = -1;

        document.addEventListener('keypress', (event)=>{this.onKeyPress(event)})
    }

    onKeyPress(event)
    {
        if (event.code == "BracketLeft")
        {
            this.kdTreeVisLevel = Math.max(this.kdTreeVisLevel - 1, -1);
            this.kdTree.setObjectsVisibleAtLevel(this.kdTreeVisLevel);
        }
        else if (event.code == "BracketRight")
        {
            this.kdTreeVisLevel = Math.min(this.kdTreeVisLevel + 1, 12);
            this.kdTree.setObjectsVisibleAtLevel(this.kdTreeVisLevel);
        }
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
                square.removeFromLevelGrid();

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
                    if (!square.isInLevelGrid())
                    {
                        square.addToLevelGrid(this); //(this.scene);
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
        this.loadGridAsset(1, "./content/TerrainSquare3.gltf", gridPromises);
        this.loadGridAsset(2, "./content/TerrainSquare4.gltf", gridPromises);
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
                    gridGroup.name = "Grid Asset" + id + ": " + path;

                    let instancedMeshes = {};
                    let matrix = new THREE.Matrix4();                

                    let colliders = [];

                    for (let i = gltf.scene.children.length - 1; i >= 0 ; i--)
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
                                mesh.name = "InstancedMesh: " + instName;
                                instMesh = {
                                    mesh: mesh, 
                                    count: 0, 
                                    colliderGeometry: obj.geometry
                                };
                                instMesh.colliderGeometry.computeBoundsTree(gComputeBoundsOptions);

                                instancedMeshes[instName] = instMesh;
                                
                            }
                            console.assert(instMesh.count < kMaxInstanceCount);
                            
                            matrix.compose(obj.position, obj.quaternion, obj.scale);
                            instMesh.mesh.setMatrixAt(instMesh.count++, matrix);

                            let colliderMesh = obj.clone();
                            colliderMesh.geometry = instMesh.colliderGeometry;
                            colliderMesh.material = kColliderMaterial;
                            colliderMesh.visible = kShowColliders;


                            colliderMesh.isCollider = true; //remember it so it can be added to the kdtree
                            gridGroup.add(colliderMesh); //add it to the group so it's positioned properly
                        }
                        else if (obj.name.includes(kColliderStr))
                        {
                            obj.geometry.computeBoundsTree(gComputeBoundsOptions);
                            obj.material = kColliderMaterial;
                            obj.visible = kShowColliders;
                            
                            obj.isCollider = true;
                            gridGroup.add(obj);

                        }
                        else if (obj.geometry)
                        {
                            // Any non-instanced props can be added to the gridGroup directly
                            obj.geometry.computeBoundsTree(gComputeBoundsOptions);
                            obj.isCollider = true;
                            gridGroup.add(obj);
                        }
                        else
                        {
                            console.log("IGNORING " + obj.name + " when loading " + path);
                        }
                    }
                    
                    if (true)
                    {
                        // go over all instance meshes, add them to the scene, and mark them for update
                        console.log("Instanced meshes for: " + path);
                        for (let key in instancedMeshes)
                        {
                            let item = instancedMeshes[key];
                            console.log("\t" + key + ": " + item.count);

                            item.mesh.isCollider = false;

                            gridGroup.add(item.mesh);
                            item.mesh.instanceMatrix.needsUpdate = true;
                            item.mesh.count = item.count;
                        }
                    }

                    this.gridAssets[id] = {
                        prototype: gridGroup,
                        pool: [],  //@TODO -- can we allocate the array to some reasonable size but keep length at zero?
                        instanceCount: 0
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
                ga.instanceCount++;
                result = ga.prototype.clone(false);
                for (let i = 0; i < ga.prototype.children.length; i++)
                {
                    let clone = ga.prototype.children[i].clone();
                    clone.isCollider = ga.prototype.children[i].isCollider;
                    result.add(clone);
                }
                result.name = "Grid Asset"+ id + "(" + ga.instanceCount + ")";
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