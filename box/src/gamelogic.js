var createGeometry = require('three-bmfont-text')
var loadFont = require('load-bmfont')
import * as THREE from 'three';
import { NotEqualDepth } from 'three';

const createWindow = require('live-moving-average')

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
        this.TV = null;




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
                color: 0x000000, //0xfac3b9,
                opacity: 1.0,
                depthTest: true, //:THREE.NeverDepth
                side: THREE.DoubleSide

            });
            this.timerFontMaterial.color.convertSRGBToLinear();

            // scale and position the mesh to get it doing something reasonable
            this.timerFontMesh = new THREE.Mesh(this.timerFontGeometry, this.timerFontMaterial);
            this.timerFontMesh.renderOrder = 0;
            //this.timerFontMesh.position.set(0.0, 0.5, -3.0);
            let kFontScale = 0.002;
            this.timerFontMesh.scale.set(kFontScale, kFontScale, kFontScale);
            this.timerFontMesh.rotation.set(3.14, 0.0, 0.0);
            this.timerFontMesh.position.set(0.0, 0.09, 0.0);

            //updateTimerString(timerValue); //"2:00");

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

        if (this.TV == null)
        {
            let TV;
            this.scene.traverse(function (node) {
                if (node.name == "Screen")
                {
                    TV = node;
                    console.log("FOUND TV");
                }
            });

            if (TV)
            {
                this.TV = TV;

                this.TV.add(this.timerFontMesh);
            }
        }

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
            this.timerFontMesh.position.x -= 0.75;
        }

    }
}

export class PunchingStats
{
    constructor(scene, bag)
    {

        this.scene = scene;
        this.TV = null;
      
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
            this.fontMesh.position.set(0.0, -0.45, 0.0);
            let kStatsFontScale = 0.0025;
            this.fontMesh.scale.set(kStatsFontScale, kStatsFontScale, kStatsFontScale);
            this.fontMesh.rotation.set(3.14, 0.0, 0.0);


            //updateTimerString(timerValue); //"2:00");


            this.scene.add(this.fontMesh);
            this.updateStatsDisplay();

            this.currentTimeInWholeSeconds = -1.0;

        });

        this.punches = 0;
        this.lastPunchTime = -1.0;
        this.averagePunchRate = 1.0;
        this.punchRateAverageWindow = createWindow(16); // = new CircularBuffer(32);
  
        this.punchRateNew = new MovingAverage(32, 4.0); //, 1.0);

        this.smoothAvgPPM = 0;
        this.nextStatsUpdate = 0;

        bag.punchCallbacks.push((whichHand, velocity) => {this.onBagHit(whichHand, velocity)});
    }

    update(dt, accumulatedTime)
    {
        this.punchRateNew.update(accumulatedTime);
        if(this.nextStatsUpdate < accumulatedTime)
        {
            this.updateStatsDisplay();
            this.nextStatsUpdate = this.accumulatedTime + 0.5;

        }
        
        // if (this.lastPunchTime < 0.0)
        // {
        //     this.lastPunchTime = accumulatedTime;
        // }
        // else if ((accumulatedTime - this.lastPunchTime) > 2.0)
        // {
        //     this.lastPunchTime = accumulatedTime - 1.0;
        //     this.updateStatsDisplay();
        // }
        this.accumulatedTime = accumulatedTime;
    }

    onBagHit(whichHand, velocity)
    {
        this.punches++;
        this.lastPunchTime = this.accumulatedTime;
        this.punchRateNew.recordPunch(this.accumulatedTime);

        this.lastPunchSpeed = velocity.length();
        this.updateStatsDisplay(true);
    }


    updateStatsDisplay(isPunch=false)
    {
        if (!this.fontGeometry)
            return;


        if (this.TV == null)
        {
            let TV;
            this.scene.traverse(function (node) {
                if (node.name == "Screen")
                {
                    TV = node;
                    console.log("FOUND TV");
                }
            });

            if (TV)
            {
                this.TV = TV;

                this.TV.add(this.fontMesh);
            }
            else
            {
                return;
            }
        }
        
        //let avgPPM = this.punchRateAverageWindow.get();
        let ppm = this.punchRateNew.getAverage(this.accumulatedTime);

    //     const kSmoothPPM = 0.005;
    //     this.smoothAvgPPM = ppm * kSmoothPPM + (this.smoothAvgPPM * (1.0 - kSmoothPPM));

        this.fontGeometry.update(
            this.punches.toString().padStart(3, '0') + " PUNCHES\n" + 
            ppm.toFixed(0).toString().padStart(3, '0') + " PPM\n" + 
            (isPunch ? + this.lastPunchSpeed.toFixed(1) : "---") + "M/S");
        this.fontGeometry.computeBoundingBox();
        let box = this.fontGeometry.boundingBox;
        this.fontMesh.position.x = box.min.x * this.fontMesh.scale.x;
        this.fontMesh.position.x -= 0.05;
        
        this.nextStatsUpdate = this.accumulatedTime + 1.5;
    }
}

class MovingAverage
{
    constructor(size, timeWindow)
    {
        this.data = new Array(size);
        for(let i = 0; i < size; i++)
        {
            this.data[i] = {value: -1, timestamp: -1};
        }
        this.size = size;
        this.timeWindow = timeWindow;
        this.numSamples = 0;
        this.indexOfNextSample = 0;
        this.indexOfOldestSample = 0;
    }
    recordPunch(timestamp)
    {
        //if full, remove the old one -- descrement sum
        if (this.numSamples == this.size)
        {
            this.remove(this.indexOfOldestSample);
        }

        //write the new one
        this.numSamples++;

        let newEntry = this.data[this.indexOfNextSample];
        newEntry.timestamp = timestamp;

        // update index -- I don't think I need to update the "oldest" index because it
        // should already be correct
        this.indexOfNextSample = (this.indexOfNextSample + 1) % this.size;
    }

    remove(index)
    {
        let entry = this.data[index];
        this.numSamples--;

        if (index == this.indexOfOldestSample)
        {
            this.indexOfOldestSample = (this.indexOfOldestSample + 1) % this.size;
        }
    }
    update(accumulatedTime)
    {
        let result = false;
        while(this.numSamples > 0)
        {
            let lifetime = accumulatedTime - this.data[this.indexOfOldestSample].timestamp;
            if (lifetime > this.timeWindow)
            {
                //console.log("Retiring punch from " + lifetime + " seconds ago: " + accumulatedTime + " - " + this.data[this.indexOfOldestSample].timestamp);
                this.indexOfOldestSample = (this.indexOfOldestSample + 1) % this.size;
                this.numSamples--;
                result = true;
            }
            else
            {
                break;
            }
        }
        return result;
    }
    // update(accumulatedTime)
    // {
    //     this.accumulatedTime = accumulatedTime;
    //     while(this.numSamples > 0 && this.nextExpirationTime < accumulatedTime)
    //     {
    //         // remove oldest sample
    //         this.remove(this.indexOfOldestSample);

    //     }
    // }
    getAverage(timestamp)
    {
        if (this.numSamples == 0) 
            return 0;


        let totalTime = timestamp - this.data[this.indexOfOldestSample].timestamp;

        if (totalTime == 0)
            return 0;

        let rate = this.numSamples / totalTime * 60.0;

        //console.log(this.numSamples + " PUNCHES, " + totalTime.toFixed(1) + " SECONDS => " + rate.toFixed(1));

        // 16 punches in 4 seconds ==> 60/4 * 16 ->

        return rate; //this.numSamples / totalTime;
    }
}