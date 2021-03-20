var createGeometry = require('./thirdparty/three-bmfont-text/')
var loadFont = require('load-bmfont')
import * as THREE from 'three';
import { TextBox } from './textBox';
var MSDFShader = require('./thirdparty/three-bmfont-text/shaders/msdf')

const SESSION_NULL = 0;
const SESSION_INTRO = 1;
const SESSION_ROUND = 2;
const SESSION_REST = 3;
const SESSION_OUTRO = 4;
const SESSION_PAUSED = 5;

const ROUND_HEAVY_BAG = 0;
const ROUND_DOUBLE_ENDED_BAG = 1;
// const BAGTYPE_SPEED = 2; 

const kIntroDuration = 5.0;
const kBagRevealTime = 3.0;
const kRoundAlmostDoneTime = 10.0;



class BoxingRound
{
    constructor(roundType, duration)
    {
        this.roundType = roundType;
        this.duration = duration;
    }
    start()
    {
        this.elapsedTime = 0.0;
    }
    update(dt)
    {
        this.elapsedTime += dt;
    }
    isComplete()
    {
        return this.elapsedTime >= this.duration;
    }
}

export class BoxingSession
{
    constructor(scene, audioListener, heavyBag, doubleEndedBag, numRounds, roundDuration, restDuration, bagType, doBagSwapEachRound)
    {
        this.scene = scene;
        this.audioListener = audioListener;
        this.heavyBag = heavyBag;
        this.doubleEndedBag = doubleEndedBag;
        this.TV = null;

        this.initialize(numRounds, roundDuration, restDuration, bagType, doBagSwapEachRound);

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
        
        this.soundGetReady = new THREE.PositionalAudio(audioListener);
        this.soundGetReady.setVolume(0.5);
        this.soundGetReady.setRefDistance(40.0);
        new THREE.AudioLoader().load(
            "./content/3x-Punch-Kick-A3-med-www.fesliyanstudios.com.mp3",
            (buffer) =>
            {
                this.soundGetReady.buffer = buffer;
            });

        const kTopRowY = 0.4;
        this.roundsTextBox = new TextBox(420, "center", 0.5, "center", 0.3, 0x000000, "", "", true);
        this.roundsTextBox.position.x = -0.62;
        this.roundsTextBox.position.y = kTopRowY;
        

        this.stateTextBox = new TextBox(420, "center", 0.5, "center", 0.5, 0x000000);
        this.stateTextBox.position.x = 0.62;
        this.stateTextBox.position.y = kTopRowY;

        this.timerTextBox = new TextBox(160, "center", 1.0, "center", 0.5, 0x000000, "5:00", ":");
        this.timerTextBox.position.y = kTopRowY + 0.01;

        // this.objectiveTextBox = new TextBox(320, "center", 0x000000, 1.0, 1.75);
        // this.objectiveTextBox.position.y = -0.1;
        // this.objectiveTextBox.displayMessage("THE JAB x 100");


        this.currentTimeInWholeSeconds = -1.0;

  
        this.scene.traverse((node) => {
            if (node.name == "Screen")
            {
                this.TV = node;
                this.TV.add(this.timerTextBox);
                this.TV.add(this.roundsTextBox);
                this.TV.add(this.stateTextBox);
                // this.TV.add(this.objectiveTextBox);

                this.TV.add(this.sound321);
                this.TV.add(this.soundEndOfRound);
                this.TV.add(this.soundGetReady);

                this.updateTimer();
                this.updateRoundsMessage();
            }
        });




        // models?

        
    }

    initialize(numRounds, roundDuration, restDuration, bagType, doBagSwapEachRound)
    {
        this.numRounds = numRounds;
        this.roundDuration = roundDuration;
        this.restDuration = restDuration;
        this.introDuration = kIntroDuration;
        this.playedAlmostDoneAlert = false;
        this.currentRound = 0;
        this.state = SESSION_NULL;
        this.roundType = bagType;
        this.doBagSwap = doBagSwapEachRound;

        if (this.heavyBag.visible)
            this.heavyBag.hide();
        if (this.doubleEndedBag.visible)
            this.doubleEndedBag.hide();
    }

    start()
    {
        this.state = SESSION_INTRO;
        this.elapsedTime = 0.0;
        this.currentRound = 1;
        this.updateRoundsMessage();
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
        if (this.roundType == ROUND_DOUBLE_ENDED_BAG)
        {
            if (this.doubleEndedBag.visible)
                this.doubleEndedBag.update(dt, accumulatedTime);
        }
        else
        {
            if (this.heavyBag.visible)
                this.heavyBag.update(dt, accumulatedTime);
        }

        switch(this.state)
        {
            case SESSION_NULL:
                break;
            case SESSION_INTRO:
                this.elapsedTime += dt;
                if (!this.playedAlmostDoneAlert && (this.introDuration - this.elapsedTime) < kBagRevealTime)
                {
                    this.showBagForNextRound(false);
                    this.soundGetReady.play();
                    this.playedAlmostDoneAlert = true;
                }
                if (this.elapsedTime > this.introDuration)
                {
                    this.state = SESSION_ROUND;
                    this.elapsedTime = 0.0;
                    this.playedAlmostDoneAlert = false;

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
                if (!this.playedAlmostDoneAlert && (this.roundDuration - this.elapsedTime) < kRoundAlmostDoneTime)
                {
                    this.playedAlmostDoneAlert = true;
                    this.soundGetReady.play();
                }
                if (this.elapsedTime > this.roundDuration)
                {
                    if (this.currentRound < this.numRounds)
                    {
                        this.hideBag();
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
                if (this.bagHidden && (this.restDuration - this.elapsedTime) < kBagRevealTime)
                {
                    if (this.doBagSwap)
                        this.showBagForNextRound(true);
                    this.soundGetReady.play();
                }
                else if (this.elapsedTime > this.restDuration)
                {
                    this.state = SESSION_ROUND;
                    this.elapsedTime = 0.0;
                    this.playedAlmostDoneAlert = false;
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

    hideBag()
    {
        if (!this.doBagSwap) return;

        this.bagHidden = true;
        if (this.roundType == ROUND_DOUBLE_ENDED_BAG)
        {
            console.assert(this.doubleEndedBag.visible && !this.heavyBag.visible);
            this.doubleEndedBag.fadeOut();
        }
        else
        {
            console.assert(!this.doubleEndedBag.visible && this.heavyBag.visible);
            this.heavyBag.fadeOut();
        }
    }
    showBagForNextRound(toggle)
    {
        
        console.assert(!this.doubleEndedBag.visible && !this.heavyBag.visible);
        if (toggle)
        {
            if (this.roundType == ROUND_DOUBLE_ENDED_BAG)
            {
                this.roundType = ROUND_HEAVY_BAG;
            }
            else
            {
                this.roundType = ROUND_DOUBLE_ENDED_BAG;
            }
        }
        
        if (this.roundType == ROUND_HEAVY_BAG)
        {
            this.heavyBag.fadeIn();
        }
        else
        {
            this.doubleEndedBag.fadeIn();
        }

        this.bagHidden = false;
    }

    updateTimer(value)
    {
        let message;
        let messageColor = null;
        let odd = false;
        if (this.state == SESSION_NULL || this.state == SESSION_OUTRO)
        {
            this.timerTextBox.setMessageColor(0x000000);
            message = "0:00";
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

            if (this.state == SESSION_ROUND && newTimeInWholeSeconds <= 10.0)
            {
                this.timerTextBox.setMessageColor(0xaa0000);
            }
            else
            {
                this.timerTextBox.setMessageColor(0x000000);
            }
            if (seconds % 2)
            {
                odd = true;
            }

            message = minutes.toString().padStart(1, '0') + ':' + seconds.toString().padStart(2, '0');
        }
        this.timerTextBox.displayMessage(message);

    }
    updateRoundsMessage()
    {
        let roundMessage;
        let stateMessage;
        if (this.state == SESSION_NULL || this.state == SESSION_PAUSED)
        {
            roundMessage = "ROUND -/-";
            stateMessage = this.state == SESSION_PAUSED ? "PAUSED" : "IDLE";
        }
        else
        {
            roundMessage = "ROUND "+ (this.currentRound.toString() + "/" + this.numRounds.toString());
            
            switch(this.state)
            {
                case SESSION_INTRO:
                    stateMessage = "GET READY";
                    break;
                case SESSION_ROUND:
                    stateMessage = "FIGHT";
                    break;
                case SESSION_REST:
                    stateMessage = "REST";
                    break;
                case SESSION_OUTRO:
                    stateMessage = "GREAT JOB!";
                    break;
            }
            // (this.state == SESSION_INTRO ? "GET READY" : 
            // (this.state == SESSION_ROUND) ? "FIGHT" :
            // (this.state == SESSION_REST) ? "REST" : 
            // (this.state == SESSION_OUTRO) ? "GREAT JOB!" : "");
        }
        this.roundsTextBox.displayMessage(roundMessage);
        this.stateTextBox.displayMessage(stateMessage);

    }
    blankTimer()
    {
        this.timerFontMesh.visible = false;
    }
}

export class PunchingStats
{
    constructor(scene, heavyBag, doubleEndedBag)
    {

        this.scene = scene;
        this.TV = null;
      

        // @TODO -- swap out punch stats with a Text Box



        this.punches = 0;
        this.lastPunchTime = -1.0;
        this.averagePunchRate = 1.0;
  
        this.punchRateNew = new MovingAverage(32, 4.0); //, 1.0);

        this.smoothAvgPPM = 0;
        this.nextStatsUpdate = 0;

        heavyBag.punchCallbacks.push((whichHand, velocity) => {this.onBagHit(whichHand, velocity)});
        doubleEndedBag.punchCallbacks.push((whichHand, velocity) => {this.onBagHit(whichHand, velocity)});


        this.textBox = new TextBox(420, "left", 1.0, "center", 0.5, 0x000000);
        this.textBox.position.x = 0.12;
        this.textBox.position.y = -0.3;

        this.scene.traverse((node) => {
            if (node.name == "Screen")
            {
                this.TV = node;
                this.TV.add(this.textBox);
            }
        });

        this.updateStatsDisplay();
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
        let ppm = this.punchRateNew.getAverage(this.accumulatedTime);


        let message = 
            "PUNCHES:  " + this.punches.toString().padStart(3, '0') + "\n" + 
            "PPM:  " + ppm.toFixed(0).toString().padStart(3, '0') + "\n" + 
            "SPEED:  " + (isPunch ? this.lastPunchSpeed.toFixed(1) : "---");

        /*
        this.fontGeometry.computeBoundingBox();
        let box = this.fontGeometry.boundingBox;
        this.fontMesh.position.x = box.min.x * this.fontMesh.scale.x;

        let quantizedMaxX = Math.floor(box.max.x * this.fontMesh.scale.x * 10.0) * 0.1;
        this.fontMesh.position.x += quantizedMaxX * -0.5;
        */
        this.textBox.displayMessage(message);
        
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