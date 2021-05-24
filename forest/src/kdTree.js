import * as THREE from 'three';
import {getNumTrisTested} from 'three-mesh-bvh';

let _vector0 = new THREE.Vector3();
let _vector1 = new THREE.Vector3();
let _vector2 = new THREE.Vector3();

let _box0 = new THREE.Box3();
let _box1 = new THREE.Box3();
let _rc = new THREE.Raycaster();
let _intersections = [];
let _kdHitResult = {};  
let _numObjTested = 0;
let _lastNumObjTested = 0;

const kMinDepth = 8;
const kMaxDepth = 10;
const kMinEdgeLength = 5.0;

const debugMaterial = new THREE.MeshBasicMaterial( {color: 0x802080, wireframe: true, fog: false} );

export class KDTree
{

    constructor(box, objectsToPartition, depth=0)
    {
        this.objects = [];
        this.childFront = null;
        this.childBack = null;
        this.parent = null;
        this.box = box.clone();

        this.objectCountInclusive = 0;

        let splitIdx;
        box.getSize(_vector0);
        if (_vector0.x > _vector0.y && _vector0.x > _vector0.z)
        {
            _vector0.set(1,0,0);
            splitIdx = 'x';
        }
        else if (_vector0.z > _vector0.y)
        {
            _vector0.set(0,0,1);
            splitIdx = 'z';
        }
        else
        {
            _vector0.set(0,1,0);
            splitIdx = 'y';
        }
        // console.log("KDTREE: " + depth + ", " + splitIdx);

        box.getCenter(_vector1);
        let midOnSplitDimension;
        midOnSplitDimension = _vector1[splitIdx];

        this.plane = new THREE.Plane();
        this.plane.setFromNormalAndCoplanarPoint(_vector0, _vector1);

        let objectsInFront = [];
        let objectsBehind = [];

        objectsToPartition.forEach(
            (object) => 
            {

                let dist = this.plane.distanceToPoint(object.position); //geometry.boundingSphere.center);
                let radius = object.geometry.boundingSphere.radius;
                radius *= Math.max(object.scale.x, Math.max(object.scale.y, object.scale.z));
                
                // console.log("Object: " + object + " at (" + object.position.x + ", " + object.position.y + ", " + object.position.z + 
                //     "), Dist = " + dist + ", Radius = " + radius);

                if (dist > radius)
                {
                    objectsInFront.push(object);
                }
                else if (dist < -radius)
                {
                    objectsBehind.push(object);
                }
                else
                {
                    this.objects.push(object);
                    object.kdParent = this;
                }
            }
        );

        let edgeLength = (this.box.max[splitIdx] - this.box.min[splitIdx]) * 0.5;
        if (depth < kMaxDepth && edgeLength > kMinEdgeLength)
        {
            if (depth < kMinDepth || objectsInFront.length > 0)
            {
                _vector0.copy(this.box.min);
                _vector0[splitIdx] = midOnSplitDimension; // copy the mid-point on the split dimension

                box.set(_vector0, this.box.max);
                this.childFront = new KDTree(box, objectsInFront, depth + 1);
                this.childFront.parent = this;
                this.objectCountInclusive += objectsInFront.length;
            }

            if (depth < kMinDepth || objectsBehind.length > 0)
            {
                _vector0.copy(this.box.max);
                _vector0[splitIdx] = midOnSplitDimension; // copy the mid-point on the split dimension
                box.set(this.box.min, _vector0);
                
                this.childBack = new KDTree(box, objectsBehind, depth + 1);
                this.childBack.parent = this;
                this.objectCountInclusive += objectsBehind.length;
            }
        }
        else
        {
            objectsInFront.forEach((object) => { this.objects.push(object) });
            objectsBehind.forEach((object) => { this.objects.push(object) });
        }
        this.objectCountInclusive += this.objects.length;
 
        this.debugMesh = new THREE.Mesh( 
            new THREE.BoxGeometry(
                this.box.max.x - this.box.min.x,
                this.box.max.y - this.box.min.y,
                this.box.max.z - this.box.min.z),
            debugMaterial);
        
        this.box.getCenter(this.debugMesh.position);
    }

    appendDebugMesh(group)
    {
        group.add(this.debugMesh);
        if (this.childFront)
        {
            this.childFront.appendDebugMesh(group);
        }
        if (this.childBack)
        {
            this.childBack.appendDebugMesh(group);
        }
    }

    insert(object)
    {
        this.objectCountInclusive++;

        _box0.setFromObject(object);
        if (this.plane.intersectsBox(_box0))
        {
            this.objects.push(object);
            object.kdParent = this;
        }
        else
        {
            _box0.getCenter(_vector0);
            if (this.plane.distanceToPoint(_vector0) > 0)
            {
                if (this.childFront)
                {
                    this.childFront.insert(object);
                }
                else
                {
                    this.objects.push(object);
                    object.kdParent = this;
                }
            }
            else
            {
                if (this.childBack)
                {
                    this.childBack.insert(object);
                }
                else
                {
                    this.objects.push(object);
                    object.kdParent = this;
                }
            }
        }
    }

    remove(object)
    {
        console.assert(object.kdParent == this);
        let index = this.objects.indexOf(object);
        console.assert(index != -1);
        this.objects[index] = this.objects[this.objects.length-1];
        this.objects.length--;
        this.objectCountInclusive--;
        let parent = this.parent;
        while(parent != null)
        {
            parent.objectCountInclusive--;
            parent = parent.parent;
        }
        //this.objects.remove(object);
    }

    topLevelRaycast(from, to, hr)
    {
        _lastNumObjTested = _numObjTested;
        _numObjTested = 0;
        let result = this.raycast(from,to,hr);
        if (_numObjTested != _lastNumObjTested) 
        {
            // console.log("KdTree: Tested " + _numObjTested + " objects.");
            // hr.t = 1.0;
            // this.raycast(from, to, hr, 0, true);
        }

        return result;
    }

    raycast(from, to, hr, level = 0, verbose = false)
    {
        _box0.makeEmpty();
        _box0.expandByPoint(from);
        _vector0.lerpVectors(from, to, hr.t);
        _box0.expandByPoint(_vector0);

        let boxIntersects = this.box.intersectsBox(_box0);
        if (!boxIntersects)
            return false;

        //let testThis = this.objects.length && this.box.intersectsBox(_box0);
        
        _kdHitResult.t = 0.0;

        let hit = false;
        if (this.objects.length)
        {
            if(verbose && this.objects.length)
            {
                console.log("Testing " + this.objects.length + " objects at level " + level)
            }
            this.objects.forEach( (object) =>
            {
                console.assert(object.isMesh && !object.isInstancedMesh);
                _box1.setFromObject(object);

                if (!_box1.intersectsBox(_box0))
                {
                    return false;
                }

                if (this.raycastAgainstObject(object, from, to, hr.t, _kdHitResult))
                {
                    // I hit the object at 't'
                    // Is it the closest hit?
                    if (_kdHitResult.t < hr.t)
                    {
                        hr.object = object;
                        hr.t = _kdHitResult.t;
                        hit = true;

                        _box0.makeEmpty();
                        _box0.expandByPoint(from);
                        _vector0.lerpVectors(from, to, hr.t);
                        _box0.expandByPoint(_vector0);

                        
                    }
                }
            });
        }

        if (this.childFront && this.childFront.objectCountInclusive > 0)
        {
            if (this.childFront.raycast(from, to, hr, level + 1, verbose))
            {
                hit = true;
            }
        }

        if (this.childBack && this.childBack.objectCountInclusive > 0)
        {
            if (this.childBack.raycast(from, to, hr, level + 1, verbose))
            {
                hit = true;
            }
        }

        return hit;
    }

    raycastAgainstObject(object, from, to, t, hr)
    {
        _vector1.subVectors(to, from);
        let length = _vector1.length();
        _vector1.divideScalar(length);

        _rc.set(from, _vector1);      
        _rc.near = 0.0;
        _rc.far = length * t; // current t gives how far we want to raycast

        _intersections.length = 0;



        _numObjTested++;

        object.raycast(_rc, _intersections);

        // let numTested = getNumTrisTested();
        // if (numTested > 0)
        // {
        //     console.log("Tested " + numTested + " tris on " + object.name );
        // }

        if (_intersections.length == 0)
        {
            return false;
        }
        else
        {
            _intersections.sort((a, b) => {
                return a.distance - b.distance;
            });

            hr.t = Math.min(_intersections[0].distance / length, 1.0);
            return true;
        }
    }

    setObjectsVisibleAtLevel(targetLevel)
    {
        let numVis = {count:0};
        this._setObjectsVisibleAtLevel(targetLevel, 0, numVis);
        console.log("Set " + numVis.count + " objects visible.");
    }

    _setObjectsVisibleAtLevel(targetLevel, cur=0, numVis)
    {
        let vis = (targetLevel == -1) ? true : (targetLevel == cur);
        this.objects.forEach( (object) => {
            object.visible = vis;
        });

        if (vis)
        {
            numVis.count += this.objects.length;
        }

        if (this.childFront && this.childFront.objectCountInclusive > 0)
        {
            this.childFront._setObjectsVisibleAtLevel(targetLevel, cur + 1, numVis);
        }
        if (this.childBack && this.childBack.objectCountInclusive > 0)
        {
            this.childBack._setObjectsVisibleAtLevel(targetLevel, cur + 1, numVis);
        }
    }
}