let _worldpos = new THREE.Vector3();

export class FistTarget
{
    constructor(parent, whichHand = 0, radius = 0.15) // hand: 0 = recognize either hand, 1 = recognize left hand, 2 = recognize right hand
    {
        this.bEntered = false;
        this.whichHand = whichHand;
        this.bActive = true;
        this.parent = parent;
        this.radiusSquared = radius*radius;
        this.hitCallbacks = [];

        this.bDebugDraw = false;
        this.debugDrawShape = null;

        this.position = new THREE.Vector3();
        parent.getWorldPosition(this.position);
        
    }

    update(dt)
    {
        this.parent.getWorldPosition(this.position);
        if (this.bDebugDraw)
        {
            if (this.debugDrawShape == null)
            {
                this.debugDrawShape = new THREE.Mesh( new THREE.SphereGeometry(this.radius, 6, 6), new THREE.MeshBasicMaterial({color: 0x808080, wireframe: true}));
                this.parent.add(this.debugDrawShape);
            }
            this.debugDrawShape.visible = true;
            if (this.bEntered)
            {
                this.debugDrawShape.material.color.set(0x2020f0);
            }
            else
            {
                this.debugDrawShape.material.color.set(0x808080);
            }
        }
        else
        {
            this.debugDrawShape.visible = false;
        }
    }

    checkFist(hand)
    {
        if (!this.bActive)
            return;
        if (this.whichHand == 0 || hand.which == this.whichHand)
        {
            hand.getWorldPosition(_worldpos);
            let dist = this.position.distanceToSquared(_worldpos);
            if (dist < this.radiusSquared)
            {
                //hand is inside the region
                if (!this.bEntered)
                {
                    this.bEntered = true;
                    let evt = {
                        fist: hand,
                        target: this
                    };
                    for (let cb of this.hitCallbacks)
                    {
                        cb(evt);
                    }
                }
            }
            else
            {
                // hand is no longer in the target
                this.bEntered = false;
            }
        }
    }




    registerHitCallback(func)
    {
        this.hitCallbacks.push(func);
    }
}