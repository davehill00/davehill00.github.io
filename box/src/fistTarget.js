
const kBaseColors = [
    0x502020,
    0x80f080,
    0xf08080
];

const kBrightColors = [
    0xf01010,
    0x20ff20,
    0xff2020
]

export class FistTarget extends THREE.Group
{
    constructor(scene, whichHand = 0, radius = 0.15) // hand: 0 = recognize either hand, 1 = recognize left hand, 2 = recognize right hand
    {
        super();

        this.nEntered = 0;
        this.whichHand = whichHand;
        this.bActive = true;
        this.scene = scene;
        //this.parent = parent;
        this.radius = radius;
        this.radiusSquared = radius*radius;
        this.hitCallbacks = [];
        this.bDebugDraw = true;

        this.baseColor = new THREE.Color(kBaseColors[whichHand]);
        this.brightColor = new THREE.Color(kBrightColors[whichHand]);
        this.colorLerpDecay = 0.0;
        this.colorLerpInterval = 0.33;

        this.setUpVisual();
    }

    isEntered()
    {
        return this.nEntered != 0;
    }

    setUpVisual()
    {
        this.mesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.24, 0.1),
            new THREE.MeshStandardMaterial()
        );
        this.mesh.material.color.copy(this.baseColor);

        this.add(this.mesh);

        this.debugDrawShape = new THREE.Mesh( new THREE.SphereGeometry(this.radius, 6, 6), new THREE.MeshBasicMaterial({color: 0x808080, wireframe: true}));
        this.add(this.debugDrawShape);
        this.debugDrawShape.visible = false;

    }
    update(dt)
    {

        if (this.colorLerpDecay > 0.0)
        {
            this.colorLerpDecay -= dt;
            if (this.colorLerpDecay < 0.0)
            {
                this.colorLerpDecay = 0.0;
            }
            else
            {
                let t = this.colorLerpDecay / this.colorLerpInterval;
                let color = this.mesh.material.color;
                color.copy(this.baseColor);
                color.lerpHSL(this.brightColor, t);
            }
        }

        if (this.bDebugDraw)
        {

            this.debugDrawShape.visible = true;
            if (this.isEntered())
            {
                this.debugDrawShape.material.color.set(0x20f020);
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

    checkFist(hand, worldPos)
    {
        if (!this.bActive)
            return;
        if (this.whichHand == 0 || hand.which == this.whichHand)
        {
            let dist = this.position.distanceToSquared(worldPos);
            if (dist < this.radiusSquared)
            {
                //hand is inside the region
                if ((this.nEntered & (1 << hand.which)) == 0)
                //if (!this.bEntered)
                {
                    this.nEntered |= (1 << hand.which);
                    let evt = {
                        fist: hand,
                        target: this
                    };

                    this.mesh.material.color.copy(this.brightColor);
                    this.colorLerpDecay = 0.0;
                    
                    for (let cb of this.hitCallbacks)
                    {
                        cb(evt);
                    }
                }
            }
            else
            {
                
                if ((this.nEntered & (1 << hand.which)) != 0)
                {
                    // hand was in the target but is not any more
                    this.colorLerpDecay = this.colorLerpInterval;
                }
                this.nEntered &= ~(1 << hand.which);

            }
        }
    }




    registerHitCallback(func)
    {
        this.hitCallbacks.push(func);
    }
}