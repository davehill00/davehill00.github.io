var createGeometry = require('three-bmfont-text')
var loadFont = require('load-bmfont')

const kFpsSmoothing = 0.10;
const kMaxPersist = 2000.0;

export class StatsHud {
    constructor(camera)
    {
        this.initialize(camera);
    }

    initialize(camera)
    {
        var self = this;
        loadFont('./content/arial.fnt',
            function (err, font) {
                // create a geometry of packed bitmap glyphs,
                // word wrapped to 300px and right-aligned
                self.fontGeometry = createGeometry({
                    width: 400,
                    align: 'left',
                    font: font
                })

                // the texture atlas containing our glyphs
                var texture = new THREE.TextureLoader().load('./content/arial.png');

                // we can use a simple ThreeJS material
                var fontMaterial = new THREE.MeshBasicMaterial({
                    map: texture,
                    transparent: true,
                    color: 0xffffff
                });

                // scale and position the mesh to get it doing something reasonable
                self.fontMesh = new THREE.Mesh(self.fontGeometry, fontMaterial);
                self.fontMesh.position.set(-2.5, -0.75, -5);
                self.fontMesh.scale.set(0.005, 0.005, 0.005);
                self.fontMesh.rotation.set(3.14, 0, 0);

                camera.add(self.fontMesh);
            });  


        this.endOfLastFrame = 0.0;
        this.startOfCurrentFrame = 0.0;
        this.averageDelta = 0.0;
        this.curMaxDelta = 0.0;
        this.expiryMaxDelta = performance.now();
        this.curMinHertz = 90.0;
        this.expiryMinHertz = performance.now();
    }

    update()
    {
        this.endOfLastFrame = performance.now();

        let delta = this.endOfLastFrame - this.startOfCurrentFrame;
        if (delta > this.curMaxDelta || this.endOfLastFrame > this.expiryMaxDelta) {
            this.curMaxDelta = delta;
            this.expiryMaxDelta = this.endOfLastFrame + kMaxPersist;
        }
        this.averageDelta = (delta * kFpsSmoothing) + (this.averageDelta * (1.0 - kFpsSmoothing));
        let hertz = 1000.0 / this.averageDelta;
        if (hertz < this.curMinHertz || this.endOfLastFrame > this.expiryMinHertz) {
            this.curMinHertz = hertz;
            this.expiryMinHertz = this.endOfLastFrame + kMaxPersist;
        }

        this.startOfCurrentFrame = performance.now();

        if (this.fontGeometry) {
            this.fontGeometry.update(
                delta.toFixed(1) + "(" + this.curMaxDelta.toFixed(1) + ") ms " +
                (1000.0 / this.averageDelta).toFixed(0) + "(" + this.curMinHertz.toFixed(0) + ") Hz");
        }
    }
}