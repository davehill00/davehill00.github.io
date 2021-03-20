import * as THREE from 'three';

var createGeometry = require('./thirdparty/three-bmfont-text/')
var loadFont = require('load-bmfont')
var MSDFShader = require('./thirdparty/three-bmfont-text/shaders/msdf')

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
                    color: 0xFF2020, 
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


        if (false)
        {
            // FONT
            loadFont('./content/ROCKB.TTF-msdf.json',
            (err, font) => {
                this.fontGeometry = createGeometry({
                    align: 'center',
                    font: font,
                    flipY: true,
                    width: 500
                })
                var texture = new THREE.TextureLoader().load('./content/ROCKBTTF.png');     
                this.fontMaterial = new THREE.RawShaderMaterial(MSDFShader({
                    map: texture,
                    side: THREE.DoubleSide,
                    transparent: true,
                    color: 0xFFFFFF,
                    opacity: 0.3,
                    alphaTest: 0.1,
                    negate: false,
                    depthTest: false
                }));


                // scale and position the mesh to get it doing something reasonable
                this.fontMesh = new THREE.Mesh(this.fontGeometry, this.fontMaterial);
                this.fontMesh.name = "HUD Message";
                this.fontMesh.renderOrder = 1;
                let kFontScale = 0.001 ;
                this.fontMesh.scale.set(kFontScale, kFontScale, kFontScale);
                this.fontMesh.rotation.set(Math.PI, 0.0, 0.0);
                this.fontMesh.position.set(0.0, 0.3, -1.3);

                this.displayMessage("TESTING 1 2 3", 1.0);

                camera.add(this.fontMesh);


            });
        }
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

    displayMessage(text, duration)
    {
        this.fontGeometry.update(text);
        this.fontGeometry.computeBoundingBox();
        let box = this.fontGeometry.boundingBox;
        this.fontMesh.position.x = -box.min.x * 2.0 * this.fontMesh.scale.x;
        // this.roundsFontMesh.position.x = box.min.x;
        // this.roundsFontMesh.position.x *= this.roundsFontMesh.scale.x;
        // let quantizedMaxX = Math.floor(box.max.x * this.roundsFontMesh.scale.x * 10.0) * 0.1;
        // this.roundsFontMesh.position.x += quantizedMaxX * -0.5;
    }
}