var createGeometry = require('./thirdparty/three-bmfont-text/')
var loadFont = require('load-bmfont')
import * as THREE from 'three';

const kIntroDuration = 3.0;
const SESSION_NULL = 0;
const SESSION_INTRO = 1;
const SESSION_ROUND = 2;
const SESSION_REST = 3;
const SESSION_OUTRO = 4;
const SESSION_PAUSED = 5;

var MSDFShader = require('./thirdparty/three-bmfont-text/shaders/msdf')

export class BoxingSession
{
    constructor(scene, audioListener, numRounds, roundDuration, restDuration)
    {
        this.scene = scene;
        this.audioListener = audioListener;

        this.TV = null;

        //load assets here
        
        // sounds
        this.sound321 = new THREE.PositionalAudio(audioListener);
        this.sound321.setRefDistance(40.0);
        this.sound321.setVolume(1.0);
        new THREE.AudioLoader().load(
            "./content/simple_bell.mp3", 
            (buffer) => 
            {
                this.sound321.buffer = buffer;
            });
        
        this.soundEndOfRound = new THREE.PositionalAudio(audioListener);
        this.soundEndOfRound.setVolume(1.0);
        this.soundEndOfRound.setRefDistance(40.0);
        new THREE.AudioLoader().load(
            "./content/endOfRound.mp3",
            (buffer) => 
            {
                this.soundEndOfRound.buffer = buffer;
            });
        
        // font
        loadFont('./content/ROCKB.TTF-msdf.json',
        (err, font) => {
            // create a geometry of packed bitmap glyphs,
            // word wrapped to 300px and right-aligned
            this.timerFontGeometry = createGeometry({
                align: 'left',
                font: font,
                flipY: true,
                //width: 800
            })

            this.roundsFontGeometry = createGeometry({
                align: 'center',
                font: font,
                flipY: true,
            });

            var texture = new THREE.TextureLoader().load('./content/ROCKBTTF.png');
          
            this.timerFontMaterial = new THREE.RawShaderMaterial(MSDFShader({
                map: texture,
                side: THREE.DoubleSide,
                transparent: true,
                color: 0x000000,
                opacity: 1.0,
                alphaTest: 0.1,
                negate: false,
            }))


            // scale and position the mesh to get it doing something reasonable
            this.timerFontMesh = new THREE.Mesh(this.timerFontGeometry, this.timerFontMaterial);
            this.timerFontMesh.frustumCulled = false;
            this.timerFontMesh.renderOrder = 0;
            //this.timerFontMesh.position.set(0.0, 0.5, -3.0);
            let kFontScale = 0.01;
            this.timerFontMesh.scale.set(kFontScale, kFontScale, kFontScale);
            this.timerFontMesh.rotation.set(3.14, 0.0, 0.0);
            this.timerFontMesh.position.set(0.0, 0.085, 0.0);


            this.roundsFontMesh = new THREE.Mesh(this.roundsFontGeometry, this.timerFontMaterial);
            let kRoundsFontScale = 0.0025;
            this.roundsFontMesh.scale.set(kRoundsFontScale, kRoundsFontScale, kRoundsFontScale);
            this.roundsFontMesh.rotation.set(3.14, 0.0, 0.0);
            this.roundsFontMesh.position.set(0.0, -0.05, 0.0);

            this.currentTimeInWholeSeconds = -1.0;




            this.scene.traverse((node) => {
                if (node.name == "Screen")
                {
                    this.TV = node;
                    this.TV.add(this.timerFontMesh);
                    this.TV.add(this.roundsFontMesh);
                    // console.log("FOUND TV");
                    this.TV.add(this.sound321);
                    this.TV.add(this.soundEndOfRound);

                    this.updateTimer();
                    this.updateRoundsMessage();
                }
            });
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
        this.currentRound = 1;
        this.updateRoundsMessage();


        //play "get ready" sound
    }

    pause()
    {
        this.prevState = this.state;
        this.state = SESSION_PAUSED;
        this.updateRoundsMessage();
    }

    resume()
    {
        this.state = this.prevState;
        this.updateRoundsMessage();
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
                    this.sound321.play();
                    this.updateRoundsMessage();
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
                    this.soundEndOfRound.play();
                    this.updateRoundsMessage();
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
                    this.sound321.play();
                    this.currentRound++;
                    this.updateRoundsMessage();
                }
                else
                {
                    this.updateTimer(this.restDuration - this.elapsedTime);
                }
                break;
            case SESSION_OUTRO:
                //this.blankTimer();
                this.updateTimer(0);
                this.updateRoundsMessage();
                break;
        }
    }

    updateTimer(value)
    {
        let message;
        let colonIndex = 1;
        if (this.state == SESSION_NULL || this.state == SESSION_OUTRO)
        {
            message = "0:00";
            colonIndex = 1;
        }
        else
        {
            let newTimeInWholeSeconds = Math.ceil(value);
            if (newTimeInWholeSeconds == this.currentTimeInWholeSeconds)
            {
                return;
            }
            this.currentTimeInWholeSeconds = newTimeInWholeSeconds;


            let hours = Math.floor(newTimeInWholeSeconds / 3600);
            let minutes = Math.floor((newTimeInWholeSeconds - (hours * 3600)) / 60);
            let seconds = newTimeInWholeSeconds - (hours * 3600) - (minutes * 60);

            if (minutes > 9) colonIndex = 2;

            message = minutes.toString().padStart(1, '0') + ':' + seconds.toString().padStart(2, '0');
        }

        this.timerFontGeometry.update(message);
        this.timerFontGeometry.computeBoundingBox();
        let box = this.timerFontGeometry.boundingBox;

        let pos = this.timerFontGeometry.getTopLeftCornerXOfCharAt(colonIndex);
        this.timerFontMesh.position.x = pos;
        this.timerFontMesh.position.x *= this.timerFontMesh.scale.x;
        this.timerFontMesh.position.x -= 0.65;

    }
    updateRoundsMessage()
    {
        let message;
        if (this.state == SESSION_NULL || this.state == SESSION_PAUSED)
        {
            message = "ROUND"+ ("-/-").padStart(6, ' ') 
            + "\n\n\n\n"
            + (this.state == SESSION_PAUSED ? "PAUSED" : "IDLE");
        }
        else
        {
            message = "ROUND"+ (this.currentRound.toString() + "/" + this.numRounds.toString()).padStart(6, ' ') 
            + "\n\n\n\n" 
            + (this.state == SESSION_INTRO ? "GET READY" : 
            (this.state == SESSION_ROUND) ? "FIGHT" :
            (this.state == SESSION_REST) ? "REST" : 
            (this.state == SESSION_OUTRO) ? "GREAT JOB!" : "");
        }
        this.roundsFontGeometry.update(message);
        this.roundsFontGeometry.computeBoundingBox();
        let box = this.roundsFontGeometry.boundingBox;

        this.roundsFontMesh.position.x = box.min.x;
        this.roundsFontMesh.position.x *= this.roundsFontMesh.scale.x;
        let quantizedMaxX = Math.floor(box.max.x * this.roundsFontMesh.scale.x * 10.0) * 0.1;
        this.roundsFontMesh.position.x += quantizedMaxX * -0.5;

    }
    blankTimer()
    {
        this.timerFontMesh.visible = false;
    }
}

export class PunchingStats
{
    constructor(scene, bag)
    {

        this.scene = scene;
        this.TV = null;
      
        loadFont('./content/ROCKB.TTF-msdf.json',
        (err, font) => {
            // create a geometry of packed bitmap glyphs,
            // word wrapped to 300px and right-aligned
            this.fontGeometry = createGeometry({
                align: 'left',
                font: font,
                flipY: true,
            });

            var texture = new THREE.TextureLoader().load('./content/ROCKBTTF.png');

            this.fontMaterial = new THREE.RawShaderMaterial(MSDFShader({
                map: texture,
                side: THREE.DoubleSide,
                transparent: true,
                color: 0x000000,
                opacity: 1.0,
                alphaTest: 0.1,
                negate: false,
            }))

            // scale and position the mesh to get it doing something reasonable
            this.fontMesh = new THREE.Mesh(this.fontGeometry, this.fontMaterial);
            this.fontMesh.renderOrder = 0;
            this.fontMesh.position.set(0.0, -0.45, 0.02);
            let kStatsFontScale = 0.0025; //25;
            this.fontMesh.scale.set(kStatsFontScale, kStatsFontScale, kStatsFontScale);
            this.fontMesh.rotation.set(3.14, 0.0, 0.0);

            this.scene.traverse((node) => {
                if (node.name == "Screen")
                {
                    this.TV = node;
                    this.TV.add(this.fontMesh);
                }
            });

            this.updateStatsDisplay();

            this.currentTimeInWholeSeconds = -1.0;

        });

        this.punches = 0;
        this.lastPunchTime = -1.0;
        this.averagePunchRate = 1.0;
  
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
        
        let ppm = this.punchRateNew.getAverage(this.accumulatedTime);


        this.fontGeometry.update(
            "PUNCHES:  " + this.punches.toString().padStart(3, '0') + "\n" + 
            "PPM:  " + ppm.toFixed(0).toString().padStart(3, '0') + "\n" + 
            "SPEED:  " + (isPunch ? this.lastPunchSpeed.toFixed(1) : "---"));
        this.fontGeometry.computeBoundingBox();
        let box = this.fontGeometry.boundingBox;
        this.fontMesh.position.x = box.min.x * this.fontMesh.scale.x;

        let quantizedMaxX = Math.floor(box.max.x * this.fontMesh.scale.x * 10.0) * 0.1;
        this.fontMesh.position.x += quantizedMaxX * -0.5;
        
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

    getAverage(timestamp)
    {
        if (this.numSamples == 0) 
            return 0;


        let totalTime = timestamp - this.data[this.indexOfOldestSample].timestamp;

        if (totalTime == 0)
            return 0;

        let rate = this.numSamples / totalTime * 60.0;
        return rate; 
    }
}