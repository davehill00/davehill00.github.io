var createGeometry = require('./thirdparty/three-bmfont-text/')
var loadFont = require('load-bmfont')
import * as THREE from 'three';
import { TextBox } from './textBox';

var MSDFShader = require('./thirdparty/three-bmfont-text/shaders/msdf')

const SESSION_NULL = 0;
const SESSION_INTRO = 1;
const SESSION_GET_READY = 2;
const SESSION_ROUND = 3;
const SESSION_REST = 4;
const SESSION_OUTRO = 5;
const SESSION_PAUSED = 6;

import {workoutData, ROUND_HEAVY_BAG, ROUND_DOUBLE_END_BAG, ROUNDTYPE_SCRIPTED, ROUNDTYPE_NUM_PUNCHES, ROUNDTYPE_TIMED, ROUNDTYPE_SPEED} from "./workoutData.js";
import {TimedBoxingRound, ScriptedBoxingRound, NumberOfPunchesBoxingRound, SpeedRound} from "./BoxingRounds.js";

const kIntroDuration = 5.0;
const kIntroGetReadyDuration = 5.0;
const kRestGetReadyDuration = 5.0;

// const kGetReadyDuration = 3.0;

const kWorkoutTextBoxSmallFontSize = 470;
const kWorkoutTextBoxBigFontSize = 350;

const kBlackColor = new THREE.Color(0x000000);
const kRedColor = new THREE.Color(0x5D1719);
kRedColor.multiplyScalar(1.5);
const kGreyColor = new THREE.Color(0x404040);

// kRedColor.convertSRGBToLinear();

/*

// I want the workout to only contain the logic and trigger the events.
// I want the Boxing Session to be the interface to the world -- setting screen messages,
// playing sound effects, hiding/showing the appropriate bag, etc.

// What are the events a workout needs to have callbacks for?
1. Display message
2. Update timer
3. Play various sounds
4. Shw/Hide bag



Really just drive this at the round level -- keep the overall structure in "Boxing Session" and just let the round determine:
1. What bag do I need
2. Am I still running, or have I completed
3. Did the user pass (go on to next round) or fail (stop the session)
4. What info to display on the timer and on the info panel (and, eventually, on the stats panel)


Boxing Session:
1. Display workout instruction - this can have the sound effect baked in
2. Update Timer - this does the filtering of changes to minimize actual text mesh updates
3. Play "Almost Done" sound - thump, thump, thump

*/

export function formatTimeString(timeInSeconds)
{
    let hours = Math.floor(timeInSeconds / 3600);
    let minutes = Math.floor((timeInSeconds - (hours * 3600)) / 60);
    let seconds = timeInSeconds - (hours * 3600) - (minutes * 60);

    return minutes.toString().padStart(1, '0') + ':' + seconds.toString().padStart(2, '0');
}


export class BoxingSession
{
    constructor(scene, audioListener, heavyBag, doubleEndBag, numRounds, roundDuration, restDuration, bagType, doBagSwapEachRound)
    {
        this.scene = scene;
        this.audioListener = audioListener;
        this.heavyBag = heavyBag;
        this.doubleEndBag = doubleEndBag;
        this.TV = null;

        // this.initialize(numRounds, roundDuration, restDuration);

        heavyBag.punchCallbacks.push((whichHand, speed) => {this.onBagHit(whichHand, speed)});
        doubleEndBag.punchCallbacks.push((whichHand, speed) => {this.onBagHit(whichHand, speed)});
        
        this.punchingStats = new PunchingStats(scene);
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

        this.soundNewInstructions = new THREE.PositionalAudio(audioListener);
        this.soundNewInstructions.setVolume(1.0);
        this.soundNewInstructions.setRefDistance(40.0);
        new THREE.AudioLoader().load(
            "./content/new_instructions.mp3",
            (buffer) => 
            {
                this.soundNewInstructions.buffer = buffer;
            });

        const kTopRowY = 0.4;
        this.roundsTextBox = new TextBox(520, "center", 0.4, "center", 0.3, 0x000000, "", "");
        this.roundsTextBox.position.x = -0.61;
        this.roundsTextBox.position.y = kTopRowY;
        

        this.stateTextBox = new TextBox(520, "center", 0.4, "center", 0.3, 0x000000, "", "");
        this.stateTextBox.position.x = 0.61;
        this.stateTextBox.position.y = kTopRowY;

        this.timerTextBox = new TextBox(160, "center", 0.8, "center", 0.3, 0x000000, "5:00", ":");
        this.timerTextBox.position.y = kTopRowY + 0.01;

        this.workoutIntroTextBox = new TextBox(kWorkoutTextBoxSmallFontSize, "left", 1.55, "top", 0.48, 0x000000);
        this.workoutIntroTextBox.position.y = 0.01;

        this.workoutStageTextBox = new TextBox(kWorkoutTextBoxBigFontSize, "center", 1.55, "center", 0.48, 0x000000)
        this.workoutStageTextBox.position.y = 0.01;
        this.workoutStageTextBox.visible = false;

        //this.workoutTextBox.displayMessage("FREESTYLE ROUND:\nTry out different punches and combos. Start slow to get the feel of it, then focus on increasing your speed.");
        //this.workoutTextBox.displayMessage("SPEED ROUND:\nQuickly alternate between jabs and straights. Try to stay above 300PPM for the entire round. Your shoulders will really feel the burn on this one!");
        //this.workoutTextBox.displayMessage("DOUBLE-JAB STRAIGHT:\nAlternate punches.\nKeep your guard up, because the double-end bag can hit back!");
        // this.workoutTextBox.displayMessage("JAB THEN STRAIGHT:\nFor the first two minutes, throw the jab while circling around the bag.\nFor the last minute, throw the straight instead. Keep moving around the bag.");
        // this.workoutTextBox.displayMessage("RIGHT HOOK THEN LEFT HOOK:\nFor the first two minutes, throw the left hook while circling around the bag.\nFor the last minute, throw the right hook instead. Keep moving around the bag.");
        // this.workoutTextBox.displayMessage("DOUBLE-JAB STRAIGHT:\n \u2022 Throw two jabs, followed by the straight. Keep your hands moving the entire round.\n \u2022 Watch out! The double-end bag can hit back, so keep your guard up.");
        // this.workoutTextBox.displayMessage("STRAIGHT THEN HOOK:\nThrow the straight, followed by the left hook.\nThis will be tricky, because the bag is going to move in different directions.");
        // this.workoutTextBox.displayMessage("DOUBLE-JAB STRAIGHT:\nThrow two jabs, followed by the right hook.\nThe bag is going to move around a lot, so stay focused.");
        // this.workoutTextBox.displayMessage("JAB STRAIGHT HOOK:\nThrow the jab, followed by the straight, followed by the left hook.\nDouble-up your jab for the last minute.");
        // this.workoutTextBox.displayMessage("JAB STRAIGHT SLIP:\nThrow the jab, then the striaght, then move your head side-to-side.\nUse your core muscles to move your head, not your neck.\nDouble-up the jab for the last minute.");
        // this.workoutTextBox.displayMessage("DOUBLE-JAB\u2022STRAIGHT\u2022JAB\u2022STRAIGHT:\nYou know the drill.");
        //jab-straight-slip
        

        this.currentTimeInWholeSeconds = -1.0;


  
        this.scene.traverse((node) => {
            if (node.name == "Screen")
            {
                // node.material = new THREE.MeshStandardMaterial({color: 0xAAB0BF});
                // node.material.color.convertSRGBToLinear();
                // node.material.color.multiplyScalar(1.25);
                // node.material.name = "TVSCREEN";
                // node.material.map = tvBkgd;

                // node.material.emissiveIntensity = 0.35;
                // node.material.emissive.set(0x406080);
                // node.material.map = tvBkgd;
                this.TV = node;
                this.TV.add(this.timerTextBox);
                this.TV.add(this.roundsTextBox);
                this.TV.add(this.stateTextBox);
                this.TV.add(this.workoutIntroTextBox);
                this.TV.add(this.workoutStageTextBox);

                this.TV.add(this.sound321);
                this.TV.add(this.soundEndOfRound);
                this.TV.add(this.soundGetReady);
                this.TV.add(this.soundNewInstructions);

                // this.updateTimer();
                // this.updateRoundsMessage();
            }
        });




        // models?

        
    }

    initialize(numRounds, roundDuration, restDuration, bagType, bagSwap, workoutType, whichScriptedWorkout)
    {
        // this.numRounds = numRounds;
        this.roundDuration = roundDuration;
        // this.introDuration = kIntroDuration;
        // this.getReadyDuration = kGetReadyDuration;
        this.restDuration = restDuration - kRestGetReadyDuration;

        this.playedAlmostDoneAlert = false;
        
        this.state = SESSION_NULL;

        this.currentBagType = null;

        if (this.heavyBag.visible)
            this.heavyBag.hide();
        if (this.doubleEndBag.visible)
            this.doubleEndBag.hide();

        if (workoutType == 0)
        {
            this.initializeTimedWorkout(numRounds, roundDuration, bagType, bagSwap);
        }
        else
        {
            this.initializeScriptedWorkout(workoutData[whichScriptedWorkout], roundDuration);
        }

        //this.boxingRoundInfo = new BoxingRound(roundDuration);
        this.boxingRoundInfo = this.boxingRounds[0];

        
    }

    initializeTimedWorkout(numRounds, roundDuration, bagType, bagSwap)
    {
        this.numRounds = numRounds;
        this.currentRound = 0;
        this.boxingRounds = [null];

        //Set up this message before we start swapping bags
        this.workoutIntroMessage = "FREESTYLE " + (bagSwap ? "ALTERNATING BAGS" : (bagType == ROUND_HEAVY_BAG ? "HEAVY BAG" : "DOUBLE-END BAG")) + ":\n"+
        " \u2022 " + numRounds + " rounds, " + formatTimeString(roundDuration) + " per round.\n" + 
        " \u2022 Focus on form, go for speed, or try some new moves.";


        for (let i = 0; i < this.numRounds; i++)
        {
            this.boxingRounds.push(
                new TimedBoxingRound(roundDuration, i + 1, this.numRounds, bagType));
            if (bagSwap)
            {
                if (bagType == ROUND_HEAVY_BAG)
                {
                    bagType = ROUND_DOUBLE_END_BAG;
                }
                else
                {
                    bagType = ROUND_HEAVY_BAG;
                }
            }
        }
    }

    initializeScriptedWorkout(info, roundDuration)
    {
        this.numRounds = info.length - 1; // info contains a "round 0" that we ignore
        this.currentRound = 0;
        this.boxingRounds = [null];
        for (let i = 0; i < this.numRounds; i++)
        {
            let round;
            let roundNumber = i+1;
            let roundInfo = info[roundNumber];
            if (roundInfo.roundType == ROUNDTYPE_SCRIPTED)
            {
                round = new ScriptedBoxingRound(info, roundDuration, roundNumber);
            }
            else if (roundInfo.roundType == ROUNDTYPE_NUM_PUNCHES)
            {
                round = new NumberOfPunchesBoxingRound(roundInfo.numPunches, roundNumber, this.numRounds, roundInfo.bagType);
            }
            else if (roundInfo.roundType == ROUNDTYPE_TIMED)
            {
                round = new TimedBoxingRound(roundDuration, roundNumber, this.numRounds, roundInfo.bagType, roundInfo.introText);
            }
            else if (roundInfo.roundType == ROUNDTYPE_SPEED)
            {
                round = new SpeedRound(roundInfo, roundDuration, roundNumber, this.numRounds);
            }
            else
            {
                console.assert("UNKNOWN ROUNDTYPE - " + roundInfo.roundType);
                break;
            }
            this.boxingRounds.push(round);
        }
        this.workoutIntroMessage = info[0].introText;
        //this.workoutInfo = info;
    }

    start()
    {
        this.state = SESSION_INTRO;
        this.elapsedTime = 0.0;
        this.currentRound = 0;
        this.updateRoundsMessage();
        this.updateTimer(this.elapsedTime);

        this.workoutStageTextBox.visible = false;
        this.workoutIntroTextBox.visible = true;
        //this.updateWorkoutMessage();
        this.displayIntroMessage(this.workoutIntroMessage);
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
        if (this.doubleEndBag.visible)
        {
            this.doubleEndBag.update(dt, accumulatedTime);
        }
        else if (this.heavyBag.visible)
        {
            this.heavyBag.update(dt, accumulatedTime);
        }

        this.punchingStats.update(dt, accumulatedTime);

        switch(this.state)
        {
            case SESSION_NULL:
                break;
            case SESSION_INTRO:
                this.elapsedTime += dt;

                // START OF THE FIRST ROUND
                if (this.elapsedTime > kIntroDuration)
                {

                    this.startGetReadyState();
                }
                // COUNTING DOWN THE INTRO
                else
                {
                    this.updateTimer(kIntroDuration /*+ kIntroGetReadyDuration*/ - this.elapsedTime);
                }
                break;
            case SESSION_GET_READY:
                this.elapsedTime += dt;
                let readyDuration = (this.currentRound == 0) ? kIntroGetReadyDuration : kRestGetReadyDuration;
                if (this.elapsedTime > readyDuration)
                {

                    
                    //START THE ROUND
                    this.state = SESSION_ROUND;
                    this.elapsedTime = 0.0;
                    // this.playedAlmostDoneAlert = false;

                    


                    // play "starting bell" sound
                    this.sound321.play();

                    this.currentRound++;
                    this.workoutIntroTextBox.visible = false;
                    this.workoutStageTextBox.visible = true;

                    this.boxingRoundInfo.start(this, this.elapsedTime);

                    // update the TV screen
                    this.updateRoundsMessage();
                    //this.updateWorkoutMessage();
                }
                else
                {
                    this.updateTimer(readyDuration - this.elapsedTime);
                }
                break;
            case SESSION_ROUND:
                this.elapsedTime += dt;

                this.boxingRoundInfo.update(this, this.elapsedTime);

                // END OF THE ROUND
                if (this.boxingRoundInfo.isOver(this.elapsedTime))
                {
                    this.boxingRoundInfo.end(this);

                    this.elapsedTime = 0.0;
                    this.playedAlmostDoneAlert = false;

                    //play "end of round" sound
                    this.soundEndOfRound.play();
                    this.updateRoundsMessage();

                    if (this.boxingRoundInfo.didPlayerFail() || this.boxingRoundInfo.isFinalRound())
                    {
                        if (this.boxingRoundInfo.didPlayerFail())
                        {
                            this.displayWorkoutInfoMessage("Better luck next time!", false);
                        }
                        else
                        {
                            this.displayWorkoutInfoMessage("Great job!", false);
                        }
                        this.state = SESSION_OUTRO;
                    }
                    else
                    {
                        this.displayWorkoutInfoMessage("Take a breather!", false);
                        this.hideBag();
                        this.state = SESSION_REST;
                    }
                    
                }
                break;
            case SESSION_REST:
                this.elapsedTime += dt;

                // START OF THE NEXT ROUND
                if (this.elapsedTime > this.restDuration)
                {
                    this.startGetReadyState();
                }
                // COUNTING DOWN THE REST
                else
                {
                    this.updateTimer(this.restDuration + kRestGetReadyDuration - this.elapsedTime);
                }
                break;
            case SESSION_OUTRO:
                //this.blankTimer();
                this.updateTimer(0);
                this.updateRoundsMessage();
                break;
        }
    }

    startGetReadyState()
    {
        this.state = SESSION_GET_READY;
        this.showBagForNextRound();
        this.soundGetReady.play();

        this.elapsedTime = 0.0;
        this.workoutIntroTextBox.visible = true;
        this.workoutStageTextBox.visible = false;

        this.boxingRoundInfo = this.boxingRounds[this.currentRound+1];
        this.workoutIntroTextBox.displayMessage(this.boxingRoundInfo.getIntroText()); //roundInfo.introText);
        //this.updateWorkoutMessage();
    }

    hideBag()
    {
        let desiredBagType = this.boxingRounds[this.currentRound + 1].bagType;
        if (this.currentBagType != desiredBagType)
        {
            switch(this.currentBagType)
            {
                case ROUND_HEAVY_BAG:
                    this.heavyBag.fadeOut();
                    break;
                case ROUND_DOUBLE_END_BAG:
                    this.doubleEndBag.fadeOut();
                    break;
            }
            this.currentBagType = null;
        }
    }

    showBagForNextRound()
    {
        let desiredBagType = this.boxingRounds[this.currentRound + 1].bagType; // this.workoutInfo[this.currentRound + 1].bagType;
        if (this.currentBagType != desiredBagType)
        {
            switch(desiredBagType)
            {
                case ROUND_HEAVY_BAG:
                    this.heavyBag.fadeIn();
                    this.currentBagType = ROUND_HEAVY_BAG;
                    break;
                case ROUND_DOUBLE_END_BAG:
                    this.doubleEndBag.fadeIn();
                    this.currentBagType = ROUND_DOUBLE_END_BAG;
                    break;
            }
            
        }
    }

    updateTimer(value, bChangeColorOnFinalTenSeconds=true)
    {
        let message;
        if (this.state == SESSION_NULL || this.state == SESSION_OUTRO)
        {
            this.timerTextBox.setMessageColor(kGreyColor);
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


            if (bChangeColorOnFinalTenSeconds && this.state == SESSION_ROUND && newTimeInWholeSeconds <= 10.0)
            {
                this.timerTextBox.setMessageColor(kRedColor);
            }
            else if(this.state == SESSION_INTRO)
            {
                this.timerTextBox.setMessageColor(kGreyColor);
            }
            else
            {
                this.timerTextBox.setMessageColor(kBlackColor);
            }
            message = formatTimeString(newTimeInWholeSeconds);
            //message = minutes.toString().padStart(1, '0') + ':' + seconds.toString().padStart(2, '0');
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
            roundMessage = "ROUND "+ (Math.max(this.currentRound, 1).toString() + "/" + this.numRounds.toString());
            
            switch(this.state)
            {
                case SESSION_INTRO:
                    stateMessage = "";
                    break;
                case SESSION_GET_READY:
                    stateMessage = "GET READY"; //(this.currentRound == 0) : "GET READY" ? "REST";
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
        }
        this.roundsTextBox.displayMessage(roundMessage);
        this.stateTextBox.displayMessage(stateMessage);

    }
    
    displayIntroMessage(message)
    {
        console.assert(this.workoutIntroTextBox.visible);
        this.workoutIntroTextBox.displayMessage(message);
    }
    
    displayWorkoutInfoMessage(message, wantUpdateSound = true)
    {
        console.assert(this.workoutStageTextBox.visible);
        //console.log("display workout info message: " + message);
        if (wantUpdateSound)
        {
            this.soundNewInstructions.play();
        }
        this.workoutStageTextBox.displayMessage(message);
    }

    playGetReadySound()
    {
        this.soundGetReady.play();
    }

    onBagHit(whichHand, speed)
    {
        if (this.state == SESSION_ROUND)
        {
            this.boxingRoundInfo.onBagHit(whichHand, speed);
            this.punchingStats.onBagHit(whichHand, speed);
        }
    }
}

export class PunchingStats
{
    constructor(scene)
    {

        this.scene = scene;
        this.TV = null;
      
        this.punches = 0;
        this.lastPunchTime = -1.0;
        this.averagePunchRate = 1.0;
  
        this.punchRateNew = new MovingAverage(32, 4.0); //, 1.0);

        this.smoothAvgPPM = 0;
        this.nextStatsUpdate = 0;

        this.textBox = new TextBox(520, "left", 1.55, "bottom", 0.25, 0x000000);
        // this.textBox.position.x = 0.12;
        this.textBox.position.y = -0.35;

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

    onBagHit(whichHand, speed)
    {
        this.punches++;
        this.lastPunchTime = this.accumulatedTime;
        this.punchRateNew.recordPunch(this.accumulatedTime);

        this.lastPunchSpeed = speed; //velocity.length();
        this.updateStatsDisplay(true);
    }

    getCurrentPPM()
    {
        return this.cachedPPM;
    }

    updateStatsDisplay(isPunch=false)
    {       
        let ppm = this.punchRateNew.getAverage(this.accumulatedTime);
        this.cachedPPM = ppm;


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

        if (totalTime < 0.3)
            return 0;

        let rate = this.numSamples / totalTime * 60.0;
        return rate; 
    }
}