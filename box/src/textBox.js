import * as THREE from 'three';
import { MeshBasicMaterial, PlaneBufferGeometry } from 'three';

var createGeometry = require('./thirdparty/three-bmfont-text/')
var loadFont = require('load-bmfont')
var MSDFShader = require('./thirdparty/three-bmfont-text/shaders/msdf')

let gFontTexture = null;
let gFont = null;
let gInitPromise = null;
export function initializeTextBoxSystem()
{
    gInitPromise = new Promise( (resolve, reject) =>
    {
        loadFont('./content/ROCKB.TTF-msdf.json',
        (err, font) => {

            gFont = font;
            gFontTexture = new THREE.TextureLoader().load('./content/ROCKBTTF.png');
            resolve();
        });
    });
}

export class TextBox extends THREE.Group
{
    constructor(fontPixelsPerMeter, horizontalAlign, worldSpaceWidth, verticalAlign, worldSpaceHeight, color, lockPositionString="", lockPositionChar="", debug)
    {
        super();
        this.fontPixelsPerMeter = fontPixelsPerMeter;
        this.queuedMessage = null;
        this.queuedMessageColor = color;
        this.bReady = false;
        
        this.worldSpaceWidth = worldSpaceWidth;
        this.worldSpaceHeight = worldSpaceHeight;

        this.horizontalAlign = horizontalAlign;
        this.verticalAlignt = verticalAlign;

        if (debug)
        {
            this.add(
                new THREE.Mesh(new PlaneBufferGeometry(worldSpaceWidth, worldSpaceHeight), new MeshBasicMaterial({color:0x800080, wireframe:true}))
            );
        }
        gInitPromise.then(() => {

            
            this.fontGeometry = createGeometry({
                align: horizontalAlign,
                font: gFont,
                flipY: true,
                width: fontPixelsPerMeter * worldSpaceWidth
            });


            this.meshScale = 1.0/fontPixelsPerMeter; //worldSpaceWidth / widthInFontPixels;

            this.fontMaterial = new THREE.RawShaderMaterial(MSDFShader({
                map: gFontTexture,
                side: THREE.DoubleSide,
                transparent: true,
                color: color,
                opacity: 1.0,
                alphaTest: 0.1,
                negate: false
            }));

            this.fontMesh = new THREE.Mesh(this.fontGeometry, this.fontMaterial);
            this.name = "TextBox";
            this.fontMesh.rotation.set(Math.PI, 0.0, 0.0);
            this.fontMesh.scale.set(this.meshScale, this.meshScale, this.meshScale);

            
            if (lockPositionString.length > 0)
            {
                this.lockPositionChar = lockPositionChar;
                let lockPosition = lockPositionString.indexOf(lockPositionChar);
                console.assert(lockPositionString.length > lockPosition);

                this.lockPosition = lockPosition;
                this.fontGeometry.update(lockPositionString);
                this.lockPositionOffset = this.fontGeometry.getTopLeftCornerXOfCharAt(lockPosition);
                this.fontGeometry.update("");
            }

            this.add(this.fontMesh);
            this.bReady = true;
            if (this.queuedMessage)
            {
                this.setMessageColor(this.queuedMessageColor);
                this.displayMessage(this.queuedMessage);
            }
        });
    }

    setMessageColor(color)
    {
        if (!this.bReady)
        {
            this.queuedMessageColor = color;
        }
        else
        {
            this.fontMaterial.uniforms.color.value.set(color);
        }
    }
    displayMessage(string, color = null)
    {

        if (!this.bReady)
        {
            this.queuedMessage = string;
        }
        else
        {
            this.fontGeometry.update(string);
            if (string.length != 0)
            {
                this.fontGeometry.computeBoundingBox();
                let box = this.fontGeometry.boundingBox;

                // Compute X position -- the font layout system respects the width of the overall "box"
                // so this is simple -- center the font mesh in the world-space box's width (plus a tweak
                // if we're trying to lock the position of a specific character)
                
                let lockDeltaX = 0.0;
                if (this.lockPositionChar != null)
                {
                    // compute the current X position of the "lockPosition" character in the string
                    // and compute a delta from the original position to keep it fixed in space.
                    let lockPosition = string.indexOf(this.lockPositionChar);
                    if (lockPosition >= 0)
                    {
                        let curLockPosition = this.fontGeometry.getTopLeftCornerXOfCharAt(lockPosition);
                        lockDeltaX = this.lockPositionOffset - curLockPosition;
                        lockDeltaX *= this.meshScale;
                    }
                }
                let posX = -0.5 * this.worldSpaceWidth + lockDeltaX;
                
                // Compute Y position -- this is trickier, since the the font layout system doesn't know anything
                // about height.
                                
                let halfHeightOffset = (box.max.y - box.min.y) * -0.5 * this.meshScale;
                //let posY = 0.0;
                

                this.fontMesh.position.set(posX, halfHeightOffset, 0);
            }
        }
    }
}