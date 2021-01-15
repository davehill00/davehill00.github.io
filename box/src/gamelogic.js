var createGeometry = require('three-bmfont-text')
var loadFont = require('load-bmfont')
import * as THREE from 'three';

const kIntroDuration = 3.0;
const SESSION_NULL = 0;
const SESSION_INTRO = 1;
const SESSION_ROUND = 2;
const SESSION_REST = 3;
const SESSION_OUTRO = 4;

export class BoxingSession
{
    constructor(scene, numRounds, roundDuration, restDuration)
    {
        this.scene = scene;


        //load assets here
        
        // sounds
        // font
        loadFont('./content/numbers.fnt',
        (err, font) => {
            // create a geometry of packed bitmap glyphs,
            // word wrapped to 300px and right-aligned
            this.timerFontGeometry = createGeometry({
                align: 'left',
                font: font,
                flipY: true,
                //width: 800
            })

            // const manager = new THREE.LoadingManager();
            // manager.addHandler( /\.dds$/i, new DDSLoader() );

            // // the texture atlas containing our glyphs
            // var texture = new DDSLoader(manager).load('./content/output.dds');

            var texture = new THREE.TextureLoader().load('./content/numbers_0.png');

            // we can use a simple ThreeJS material
            this.timerFontMaterial = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                side: THREE.FrontSide,
                color: 0xa0a0a0, //0xfac3b9,
                opacity: 1.0,
                depthTest: true //:THREE.NeverDepth

            });
            this.timerFontMaterial.color.convertSRGBToLinear();

            // scale and position the mesh to get it doing something reasonable
            this.timerFontMesh = new THREE.Mesh(this.timerFontGeometry, this.timerFontMaterial);
            this.timerFontMesh.renderOrder = 0;
            this.timerFontMesh.position.set(0.0, 0.5, -3.0);
            let kFontScale = 0.0035;
            this.timerFontMesh.scale.set(kFontScale, kFontScale, kFontScale);
            this.timerFontMesh.rotation.set(3.14, 0.48, 0.0);


            //updateTimerString(timerValue); //"2:00");


            this.scene.add(this.timerFontMesh);

            this.currentTimeInWholeSeconds = -1.0;

        });

        // models?

        this.initialize(numRounds, roundDuration, restDuration);
    }

    initialize(numRounds, roundDuration, restDuration)
    {
        this.numRounds = numRounds;
        this.roundDuration = roundDuration;
        this.restDuration = restDuration;
        this.introDuration = kIntroDuration;
        this.currentRound = 0;
        this.state = SESSION_NULL;
    }

    start()
    {
        this.state = SESSION_INTRO;
        this.elapsedTime = 0.0;

        //play "get ready" sound
    }

    update(dt, accumulatedTime)
    {
        switch(this.state)
        {
            case SESSION_NULL:
                break;
            case SESSION_INTRO:
                this.elapsedTime += dt;
                if (this.elapsedTime > this.introDuration)
                {
                    this.state = SESSION_ROUND;
                    this.elapsedTime = 0.0;
                    // play "starting bell" sound
                }
                else
                {
                    this.updateTimer(this.introDuration - this.elapsedTime);
                }
                break;
            case SESSION_ROUND:
                this.elapsedTime += dt;
                if (this.elapsedTime > this.roundDuration)
                {
                    if (this.currentRound < this.numRounds)
                    {
                        this.state = SESSION_REST;
                    }
                    else
                    {
                        this.state = SESSION_OUTRO;
                    }
                    this.elapsedTime = 0.0;
                    //play "end of round" sound
                }
                else
                {
                    this.updateTimer(this.roundDuration - this.elapsedTime);
                }
                break;
            case SESSION_REST:
                this.elapsedTime += dt;
                if (this.elapsedTime > this.restDuration)
                {
                    this.state = SESSION_ROUND;
                    this.elapsedTime = 0.0;
                    // play "start of round" sound
                }
                else
                {
                    this.updateTimer(this.restDuration - this.elapsedTime);
                }
                break;
            case SESSION_OUTRO:
                break;
        }
    }

    updateTimer(value)
    {
        let newTimeInWholeSeconds = Math.ceil(value);
        if (newTimeInWholeSeconds != this.currentTimeInWholeSeconds)
        {
            this.currentTimeInWholeSeconds = newTimeInWholeSeconds;


            let hours = Math.floor(newTimeInWholeSeconds / 3600);
            let minutes = Math.floor((newTimeInWholeSeconds - (hours * 3600)) / 60);
            let seconds = newTimeInWholeSeconds - (hours * 3600) - (minutes * 60);

            let timeString = minutes.toString().padStart(1, '0') + ':' + seconds.toString().padStart(2, '0');

            this.timerFontGeometry.update(timeString);
            this.timerFontGeometry.computeBoundingBox();
            let box = this.timerFontGeometry.boundingBox;
            this.timerFontMesh.position.x = box.min.x; //(box.max.x - box.min.x) * -0.5;
            this.timerFontMesh.position.x *= this.timerFontMesh.scale.x;
            this.timerFontMesh.position.x += 1.75;
        }

    }
}

export class PunchingStats
{
    constructor(scene, bag)
    {

        this.scene = scene;

        loadFont('./content/small_font.fnt',
        (err, font) => {
            // create a geometry of packed bitmap glyphs,
            // word wrapped to 300px and right-aligned
            this.fontGeometry = createGeometry({
                align: 'right',
                font: font,
                flipY: true,
                //width: 800
            })

            // const manager = new THREE.LoadingManager();
            // manager.addHandler( /\.dds$/i, new DDSLoader() );

            // // the texture atlas containing our glyphs
            // var texture = new DDSLoader(manager).load('./content/output.dds');

            var texture = new THREE.TextureLoader().load('./content/small_font_0.png');

            // we can use a simple ThreeJS material
            this.fontMaterial = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                side: THREE.DoubleSide,
                color: 0x000000, //0xfac3b9,
                opacity: 1.0,
                depthTest: true //:THREE.NeverDepth

            });
            this.fontMaterial.color.convertSRGBToLinear();

            // scale and position the mesh to get it doing something reasonable
            this.fontMesh = new THREE.Mesh(this.fontGeometry, this.fontMaterial);
            this.fontMesh.renderOrder = 0;
            this.fontMesh.position.set(1.7, 1.25, -3.0);
            let kStatsFontScale = 0.005;
            this.fontMesh.scale.set(kStatsFontScale, kStatsFontScale, kStatsFontScale);
            this.fontMesh.rotation.set(3.14, 0.48, 0.0);


            //updateTimerString(timerValue); //"2:00");


            this.scene.add(this.fontMesh);
            this.updateStatsDisplay();

            this.currentTimeInWholeSeconds = -1.0;

        });

        this.punches = 0;

        bag.punchCallbacks.push((whichHand, velocity) => {this.onBagHit(whichHand, velocity)});
    }

    update(dt, accumulatedTime)
    {

    }

    onBagHit(whichHand, velocity)
    {
        this.punches++;
        this.updateStatsDisplay();
    }

    updateStatsDisplay()
    {
        this.fontGeometry.update(this.punches.toString().padStart(3, '0') + " PUNCHES");
        this.fontGeometry.computeBoundingBox();
        let box = this.fontGeometry.boundingBox;
        this.fontMesh.position.x = box.min.x * this.fontMesh.scale.x;
        this.fontMesh.position.x += 1.75;
        // let newTimeInWholeSeconds = Math.ceil(value);
        // if (newTimeInWholeSeconds != this.currentTimeInWholeSeconds)
        // {
        //     this.currentTimeInWholeSeconds = newTimeInWholeSeconds;


        //     let hours = Math.floor(newTimeInWholeSeconds / 3600);
        //     let minutes = Math.floor((newTimeInWholeSeconds - (hours * 3600)) / 60);
        //     let seconds = newTimeInWholeSeconds - (hours * 3600) - (minutes * 60);

        //     let timeString = minutes.toString().padStart(1, '0') + ':' + seconds.toString().padStart(2, '0');

        //     this.timerFontGeometry.update(timeString);
        //     this.timerFontGeometry.computeBoundingBox();
        //     let box = this.timerFontGeometry.boundingBox;
        //     this.timerFontMesh.position.x = box.min.x; //(box.max.x - box.min.x) * -0.5;
        //     this.timerFontMesh.position.x *= this.timerFontMesh.scale.x;
        //     this.timerFontMesh.position.x += 1.75;
        // }

    }
}