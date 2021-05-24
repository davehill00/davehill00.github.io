import * as THREE from 'three';
import { CENTER, AVERAGE, SAH } from 'three-mesh-bvh';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { KDTree } from './kdTree';
import { levelLayoutTest } from './levelLayout';

const kGridSize = 32.0;
const kOneOverGridSize = 1.0 / kGridSize;
const kHalfGridSize = kGridSize * 0.5;
const kVisibleRings = 2;

let gGridAssetManager = null;
let gLevelGrid = null;

const kColliderStr = "Collider";
const kColliderMaterial = new THREE.MeshBasicMaterial({color: 0x802080});
const kShowColliders = false;

const kInstanceStr = "Instance";
const kMaxInstanceCount = 50;

const RAND = require('random-seed').create("testing");

const kRotOptions = [0, 90, 180, 270];
const gComputeBoundsOptions = {
    lazyGeneration: false,
    strategy: SAH,
    // packData: false
}

let tVec0 = new THREE.Vector3();

export function UpdateLevelGrid(cameraPosition, cameraHeading)
{
    if (gLevelGrid)
    {
        gLevelGrid.updateVisibility(cameraPosition, cameraHeading);
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
        // const kSize = 10;
        gLevelGrid = new LevelGrid(levelLayoutTest, scene);
        // gLevelGrid = new LevelGrid(-kSize, kSize, -kSize, kSize, scene);
        resolve();
    });
}


export function InitializeGridAssetManager()
{
    gGridAssetManager = new GridAssetManager();
}
// Returns a promise
export function LoadGridProps()
{
    return gGridAssetManager.loadProps();
}

// Returns a promise
export function LoadGridAssets() 
{
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
    constructor(xIndex, zIndex, assetId, rotation)
    {
        this.origin = new THREE.Vector3(xIndex * kGridSize, 0.0, zIndex * kGridSize);
        this.asset = null;
        this.levelGrid = null;
        this.assetId = assetId;
        this.xIndex = xIndex;
        this.zIndex = zIndex;
        this.rotation = rotation;
    }

    isInLevelGrid()
    {
        return this.levelGrid != null;
    }

    addToLevelGrid(levelGrid)
    {
        // console.log("ADD Grid[" + this.xIndex + ", " + this.zIndex + "] to scene.");
        this.levelGrid = levelGrid;

        // get asset from asset pool -- this is a THREE.Group
        this.asset = gGridAssetManager.allocateGridAsset(this.assetId);

        // set its position to my origin
        this.asset.position.copy(this.origin);
        this.asset.rotation.y = this.rotation;
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
            else if (child.isInstancedMesh)
            {
                child.instanceMatrix.needsUpdate = true;
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

    setVisibility(newVis)
    {
        this.asset.visible = newVis;
    }
    isVisible()
    {
        return this.asset.visible;
    }
}



class LevelGrid extends THREE.Group
{
    constructor(layout, scene) //xGridMin, xGridMax, zGridMin, zGridMax, scene)
    {
        super();

        console.assert(layout.length > 0);
        let zRange = layout.length;
        let xRange = layout[0].length;
        // layout.forEach((row) => { xRange = Math.max(xRange, row.length)}) / 2;

        // this.xGridMin = Math.floor(xRange * -0.5);
        // this.xGridMax = this.xGridMin + xRange;

        // this.yGridMin = Math.floor(zRange * -0.5);
        // this.yGridMax = this.yGridMin + zRange;

        
        // this.xGridMin = xGridMin;
        // this.xGridMax = xGridMax;
        // this.zGridMin = zGridMin;
        // this.zGridMax = zGridMax;

        this.xGridSquares = xRange / 2; //xGridMax - xGridMin + 1;
        this.zGridSquares = zRange; //zGridMax - zGridMin + 1;
        this.xGridMin = 0;
        this.xGridMax = this.xGridSquares - 1;
        this.zGridMin = 0;
        this.zGridMax = this.zGridSquares - 1;

        this.squares = new Array(this.xGridSquares * this.zGridSquares);
        
        this.lastPlayerGridX = Number.MAX_VALUE;
        this.lastPlayerGridZ = Number.MAX_VALUE;

        let i = 0;
        for(let z = 0; z < zRange; z++) // zGridMin; z <= zGridMax; z++)
        {
            let row = layout[z];
            console.assert(row.length == xRange);
            for (let x = 0; x < xRange; x +=2)
            {
                if (row[x] == ".")
                    continue; // NULL SQUARE
                let rotSignal = row[x+1];
                let rot = (rotSignal == '-') ? 0.0 :
                    (rotSignal == '<') ? 90.0 : 
                    (rotSignal == '|') ? 180.0 : 
                    (rotSignal == '>') ? 270.0 : 
                    (rotSignal == '*') ? (kRotOptions[RAND.intBetween(0,3)]) : 
                    -1.0;
                console.assert(rot >= 0.0);
                this.squares[x/2 + z * this.xGridSquares] = new GridSquare(x/2, z, parseInt(row[x]),  (rot * Math.PI / 180.0));
                // break;
            }

            /*
            let pad = Math.floor(zRange - row.length)
            for (let x = xGridMin; x <= xGridMax; x++)
            {
                this.squares[x + z * this.xGridSquares] = new GridSquare(x,z, Math.floor(Math.random() * 3.0)); //2); //Math.random() > 0.5 ? 1 : 0);
            }
            */
        }

        this.scene = scene;
        scene.add(this);


        let box = new THREE.Box3(new THREE.Vector3((this.xGridMin - 1) * kGridSize, -50, (this.zGridMin-1) * kGridSize), new THREE.Vector3((this.xGridMax+1) * kGridSize, 50, (this.zGridMax+1) * kGridSize) );
        this.kdTree = new KDTree(box,[]);

        this.visibleSet = [];

        // this.updateVisibility(new THREE.Vector3(0,0,0));
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
        else if (event.code == "Slash")
        {
            this.logNextVisUpdate = true;
        }
    }

    updateVisibility(position, heading)
    {
        // player is at position
        // determine which grid square this falls into
        let playerGridX = Math.floor((position.x + kHalfGridSize) * kOneOverGridSize);
        let playerGridZ = Math.floor((position.z + kHalfGridSize) * kOneOverGridSize);
        
        if (this.logNextVisUpdate)
        {
            console.log("PLAYER X: " + playerGridX + ", Z: " + playerGridZ);
            this.logNextVisUpdate = false;
        }

        // determine grid ranges around this

        let minX = Math.max(playerGridX - kVisibleRings, this.xGridMin);
        let maxX = Math.min(playerGridX + kVisibleRings, this.xGridMax);
        let minZ = Math.max(playerGridZ - kVisibleRings, this.zGridMin);
        let maxZ = Math.min(playerGridZ + kVisibleRings, this.zGridMax);
        
        // prune any currently visible squares that are outside that set
        let bVisibilityChanged = playerGridX != this.lastPlayerGridX || playerGridZ != this.lastPlayerGridZ;

        for (let i = 0; i < this.visibleSet.length; i++)
        {
            let square = this.visibleSet[i];
            if (square == null) // near the edges, we may not have a full visible set
                continue;

            if (square.xIndex < minX || square.xIndex > maxX ||
                square.zIndex < minZ || square.zIndex > maxZ)
            {
                square.removeFromLevelGrid();
            }
        }

        if (bVisibilityChanged)
        {

            this.lastPlayerGridX = playerGridX;
            this.lastPlayerGridZ = playerGridZ;
            
            // console.log("UPDATE VISIBILITY: " + position.x + ", " + position.z + " ==> " + playerGridX + ", " + playerGridZ);

            this.visibleSet.fill(null);
            
            // add new squares that should be visible but aren't
            let index = 0;
            for (let z = minZ; z <= maxZ; z++)
            {
                for (let x = minX; x <= maxX; x++)
                {
                    let square = this.squares[x + z * this.xGridSquares];
                    if (square == null)
                        continue;

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

        // Rough frustum culling -- @TODO - do something like what's mentioned in this thread:
        // https://discourse.threejs.org/t/how-to-do-frustum-culling-with-instancedmesh/22633
        // Note that even with the borked implementation (which over-culled) this didn't help with performance
        // Rendering the trees is too expensive at the fragment-shader level
        if (false)
        {
            let index = 0;
            let maxIndex = this.visibleSet.length;

            while(index < maxIndex)
            {
                let square = this.visibleSet[index++];
                if (square === null)
                    break;
                
                let dx = (square.xIndex - playerGridX);
                let dz = square.zIndex - playerGridZ;
                if (dx == 0 && dz == 0)
                {
                    if (!square.isVisible())
                    {
                        console.log("Set Vis: " + square.xIndex + ", " + square.zIndex);
                    }
                    square.setVisibility(true); // = true;
                }
                else
                {
                    tVec0.set(dx, 0.0, dz);
                    if (tVec0.dot(heading) < 0.0)
                    {
                        if (!square.isVisible())
                        {
                            console.log("Set Vis: " + square.xIndex + ", " + square.zIndex);
                        }
                        square.setVisibility(true);
                    }
                    else
                    {
                        if (square.isVisible())
                        {
                            console.log("Set Invis: " + square.xIndex + ", " + square.zIndex);
                        }
                        square.setVisibility(false);// = false;
                    }
                }

            }
        }

    }
}

class GridAssetManager
{
    constructor()
    {
        this.propAssets = [];
        this.gridAssets = [];
        this.instancedPropAssets = [];
        this.gltfLoader = new GLTFLoader();
    }

    loadProps()
    {
        let propPromises = [];
        this.loadPropAsset(0, "./content/dead_tree_2.gltf", 10, 15, propPromises);
        this.loadPropAsset(1, "./content/big_rock.gltf", 3, 5, propPromises);
        // this.loadPropAsset(0, "./content/inverted_cone.gltf", propPromises);

        return Promise.all(propPromises);
    }
    loadAssets()
    {
        // let instancedPropPromises = [];
        // loadInstancedPropAsset(kTreeInstance, "./content/dead_tree_1.gltf", instancedPropPromises);

        console.assert(this.propAssets.length > 0);
        
        let gridPromises = [];
        this.loadGridAsset(0, "./content/Terrain_Area_Flat.gltf", gridPromises);
        this.loadGridAsset(1, "./content/Terrain_Area_StraightEdge.gltf", gridPromises);
        this.loadGridAsset(2, "./content/Terrain_Area_90deg.gltf", gridPromises);
        this.loadGridAsset(3, "./content/Terrain_Area_Entrance.gltf", gridPromises);
        this.loadGridAsset(4, "./content/Terrain_Path_Straight.gltf", gridPromises);
        this.loadGridAsset(5, "./content/Terrain_Path_90deg.gltf", gridPromises);

        return Promise.all(gridPromises);

        // this.loadGridAsset(0, "./content/TerrainSquare2.gltf", gridPromises);
        // this.loadGridAsset(1, "./content/TerrainSquare3.gltf", gridPromises);
        // this.loadGridAsset(2, "./content/TerrainSquare4.gltf", gridPromises);
        // loadGridAsset(3, "./content/TerrainSquare5.gltf", gridPromises);

        // return new Promise( (resolve) =>
        // {
        //     Promise.all(propPromises).then( (values) => {
        //         return Promise.all(gridPromises);
        //     }).then( () => {resolve()});

        // });
        // Promise.all(propPromises)
        
        // .then(Promise.all(gridPromises));
        // return new Promise( (resolve) => 
        // {
        //     Promise.all(propPromises).then( Promise.all(gridPromises)() => {return Promise.all(gridPromises)}).then( ()=>{ resolve()});
        // })
        // return Promise.all(propPromises).then(
            // () => { return Promise.all(gridPromises)});
    }

    loadGridAsset(id, path, promises)
    {
        promises.push(
            new Promise((resolve, reject) =>
            {
                console.assert(this.propAssets.length > 0);
                this.gltfLoader.load(path, (gltf) => 
                {
                    let gridGroup = new THREE.Group();
                    gridGroup.name = "Grid Asset" + id + ": " + path;

                    let instancedMeshes = {};
                    let matrix = new THREE.Matrix4();                
                    let position = new THREE.Vector3();

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
                            let newMat = new THREE.MeshPhongMaterial({color: 0x303030}); //0x202020}); // obj.material.color});
                            obj.material = newMat;

                            gridGroup.add(obj);
                            // obj.material.wireframe = true;
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

                    if (true)
                    {
                        // HACK! Need to figure out how to get this properly at some point
                        let terrain = gridGroup.children[0];

                        let raycaster = new THREE.Raycaster();
                        let direction = new THREE.Vector3(0.0, -1.0, 0.0);
                        let rotation = new THREE.Quaternion();
                        let scale = new THREE.Vector3(1.0,1.0,1.0);
                        let intersections = [];

                        let numProps = this.propAssets.length;
                        for (let i = 0; i < numProps; i++)
                        {
                            // create an instanced mesh for the randomly placed assets
                            let propAsset = this.propAssets[i];
                            let prop = propAsset.prop;
                            let kInstances = RAND.intBetween(propAsset.min, propAsset.max); // 15;
                            let instAutoMesh = new THREE.InstancedMesh(prop.geometry, prop.material, kInstances);

                            let count = 0;
                            while (count < kInstances)
                            {
                                // create random position
                                position.set(
                                    Math.min(
                                        Math.max(
                                            RAND.random() * kGridSize - kHalfGridSize, 
                                            -kHalfGridSize + 0.1), 
                                        kHalfGridSize - 0.1),
                                    150.0,
                                    Math.min(
                                        Math.max(
                                            RAND.random() * kGridSize - kHalfGridSize, 
                                            -kHalfGridSize + 0.1), 
                                        kHalfGridSize - 0.1)
                                );

                                // raycast against the existing grid group to find the height
                                raycaster.set(position, direction);
                                raycaster.near = 0.0;
                                raycaster.far = 500.0;
                                intersections.length = 0;
                                terrain.raycast(raycaster, intersections);
                                
                                if (intersections.length < 1)
                                {
                                    console.log("NO COLLISION");
                                    continue;
                                }

                                intersections.sort((a, b) => {
                                    return a.distance - b.distance;
                                });

                                let int = intersections[0];

                                if (int.face.normal.y < 0.8)
                                    continue;

                                if (intersections.length > 1)
                                {
                                    console.log("int 0 = " + intersections[0].distance + ", int 1 = " + intersections[1].distance);
                                }

                                // construct the position matrix and set it in the instance mesh
                                // position.y -= intersections[0].distance + 0.05; //50.0 - intersections[0].distance - 0.1;
                                scale.x = scale.y = scale.z = RAND.floatBetween(0.5, 1.2);
                                scale.y += RAND.floatBetween(-0.1, 0.1);
                                // scale.x = RAND.floatBetween(0.7, 1.1);
                                // scale.y = RAND.floatBetween(0.8, 1.1);
                                // scale.z = scale.z;
                                // scale.x = (Math.random() * 0.5) + 0.6;
                                // scale.z = scale.x;
                                // scale.y = (Math.random() * 0.5) + 0.2;

                                rotation.setFromAxisAngle(THREE.Object3D.DefaultUp, RAND.random() * 2.0 * Math.PI);
                                matrix.compose(intersections[0].point, rotation, scale);
                            
                                instAutoMesh.setMatrixAt(count++, matrix);

                                // create the collision mesh and add it to the group
                                let colliderMesh = prop.clone();
                                colliderMesh.applyMatrix4(matrix);
                                colliderMesh.material = kColliderMaterial;
                                colliderMesh.visible = kShowColliders;
                                colliderMesh.isCollider = true; //remember it so it can be added to the kdtree
                                gridGroup.add(colliderMesh); //add it to the group so it's positioned properly

                            }
                        
                            // update the instance mesh
                            instAutoMesh.instanceMatrix.needsUpdate = true;

                            // add it to the group
                            gridGroup.add(instAutoMesh);
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

    loadPropAsset(id, path, min, max, promises)
    {
        promises.push(
            new Promise((resolve, reject) =>
            {
                this.gltfLoader.load(path, (gltf) => 
                {
                    let material = null;
                    gltf.scene.traverse( (node) => {
                        if (node.material && material === null)
                        {
                            material = new THREE.MeshPhongMaterial(
                                {
                                    color: node.material.color,
                                    shininess: 1.0 - node.material.roughness
                                }
                            );
                        }
                        node.material = material;
                    });
                    this.propAssets[id] = {
                        prop: gltf.scene.children[0],
                        min: min,
                        max: max
                    };
                    console.log("Finished loading prop: " + path)
                    resolve();
                });
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