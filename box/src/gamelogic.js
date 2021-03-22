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

// const BAGTYPE_SPEED = 2; 

import {workoutData, ROUND_HEAVY_BAG, ROUND_DOUBLE_ENDED_BAG} from "./workoutData.js";


const kIntroDuration = 2.0;
const kIntroGetReadyDuration = 3.0;
const kRestGetReadyDuration = 5.0;
const kRoundAlmostDoneTime = 10.0;
// const kGetReadyDuration = 3.0;

const kWorkoutTextBoxSmallFontSize = 520;
const kWorkoutTextBoxBigFontSize = 350;

// let workout1 = [
//     {
//         //Placeholder for ROUND 0 (which isn't actually a thing), but lets me use proper round numbering everywhere else.
//         //@TODO - consider using this for intro text
//         introText: "TEST WORKOUT #1:\n \u2022 Round 1: Do two things.\n \u2022 Round 2: Do three things.",
//         stages:[],
//         bagType: null
//     },
//     {
//         introText: "TITLE:\n \u2022 Thing 1\n \u2022 Thing 2",
//         stages: [
//             {
//                 startTimePercent: 0.0,
//                 descriptionText: "THINGS TO DO DURING THE FIRST HALF"
//             },
//             {
//                 startTimePercent: 0.5,
//                 descriptionText: "THINGS TO DO DURING THE SECOND HALF"
//             }
//         ],
//         bagType: ROUND_HEAVY_BAG
//     },
//     {
//         introText: "TITLE:\n \u2022 Thing 1\n \u2022 Thing 2\n \u2022 Thing 3",
//         stages: [
//             {
//                 startTimePercent: 0.0,
//                 descriptionText: "THINGS TO DO DURING THE FIRST 33%"
//             },
//             {
//                 startTimePercent: 0.33,
//                 descriptionText: "THINGS TO DO DURING THE SECOND 33%"
//             },
//             {
//                 startTimePercent: 0.67,
//                 descriptionText: "THINGS TO DO DURING THE FINAL 33%"
//             }
//         ],
//         bagType: ROUND_DOUBLE_ENDED_BAG
//     }
// ]

class Workout
{
    constructor()
    {

    }
    initialize()
    {

    }
    update(dt)
    {
    }

    // register "onComplete" callbacks
}

// Assumes the notion of timing and round structure, and has event handlers
// for the common stages of the workout
//
// Want to handle three scenarios:
//  1. A time-based workout. e.g., 5 x 2:00 rounds, 0:30 rests
//  2. A scripted workout. e.g., each workout has some scripted stages and some criteria for ending each round.
//  3. (Maybe?) A punches-based workout. Not time-driven, but rather some other criteria for ending each round.
//     Could just fold into the scripted workout.
//
// So:
//  - there are rounds and there are rests
//  - the round determines:
//     - clock behavior (count up vs. down)
//     - what goes on the screens -- each round can define its own layout
//     - when the round is over
//     - whether the round was passed (i.e., continue to next round, or end the workout) -- only if there are pass/fail workouts
//     - what type of exercise the round is (e.g., bags are shown/hidden, the goals of the round)
//  - the workout also determines:
//     - how long the intro is and what happens during the intro
//     - how many rounds are scheduled
//     - what happens at the end of the workout (e.g., what is displayed on screen)
//
// So, the boxing session is responsible for:
//  - loading up the assets and holding on to everything
//  - being the interface to game logic for the rest of the game
//
// It really is just handling:
//  - asset loading
//  - initialize the workout
//  - start the workout
//  - update the workout
//  - pause/resume the workout
//  - know when the workout is over
//
// Workout
//   set up the intro
//      display some descriptive text
//   run the intro
//      run a countdown timer
//      look for a gesture/input to exit the intro
//   determine when the intro is over
//      time has run out
//      gesture/input has been received
//   transition into 'get ready' state
//      play some 'get ready' sound
//      start a countdown timer
//   run the 'get ready' state
//      update timer
//      play additional effects
//   transition to the round
//   run the round
//   determine when the round is over
//   determine if we're doing another round or if we're done with the workout
//   transition to rest state
//   run the rest state
//   determine that the rest is over --> transition to 'get ready' state
//   transition to the outro state
//   update the outro state
class BoxingWorkout
{
    onIntro(){}
    onStartOfRound(){}
    updateRound(dt, accumulatedTime){}
    isRoundOver(){}
    onEndOfRound(){}
    onStartOfRest(){}
    onEndOfRest(){}
    hasMoreRounds(){}
    onEndOfWorkout(){}  
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

        this.initialize(numRounds, roundDuration, restDuration);

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
                node.material.emissiveIntensity = 0.35;
                node.material.emissive.set(0xAAAAAA);
                this.TV = node;
                this.TV.add(this.timerTextBox);
                this.TV.add(this.roundsTextBox);
                this.TV.add(this.stateTextBox);
                this.TV.add(this.workoutIntroTextBox);
                this.TV.add(this.workoutStageTextBox);

                this.TV.add(this.sound321);
                this.TV.add(this.soundEndOfRound);
                this.TV.add(this.soundGetReady);

                this.updateTimer();
                this.updateRoundsMessage();
            }
        });




        // models?

        
    }

    initialize(numRounds, roundDuration, restDuration)
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
        if (this.doubleEndedBag.visible)
            this.doubleEndedBag.hide();

        this.initializeWorkout(workoutData[1]);
    }

    initializeWorkout(info)
    {
        this.numRounds = info.length - 1; // info contains a "round 0" that we ignore
        this.currentRound = 0;
        this.workoutInfo = info;
    }

    start()
    {
        this.state = SESSION_INTRO;
        this.elapsedTime = 0.0;
        this.currentRound = 0;
        this.updateRoundsMessage();

        this.workoutStageTextBox.visible = false;
        this.workoutIntroTextBox.visible = true;
        this.updateWorkoutMessage();
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
        if (this.doubleEndedBag.visible)
        {
            this.doubleEndedBag.update(dt, accumulatedTime);
        }
        else if (this.heavyBag.visible)
        {
            this.heavyBag.update(dt, accumulatedTime);
        }

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
                    this.updateTimer(kIntroDuration + kIntroGetReadyDuration - this.elapsedTime);
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
                    this.playedAlmostDoneAlert = false;

                    // play "starting bell" sound
                    this.sound321.play();

                    this.currentRound++;

                    this.workoutIntroTextBox.visible = false;
                    this.workoutStageTextBox.visible = true;

                    let roundInfo = this.workoutInfo[this.currentRound];
                    this.nextWorkoutStageTime = roundInfo.stages[0].startTimePercent * this.roundDuration;
                    this.nextWorkoutStage = 0;

                    // update the TV screen
                    this.updateRoundsMessage();
                    this.updateWorkoutMessage();
                }
                else
                {
                    this.updateTimer(readyDuration - this.elapsedTime);
                }
                break;
            case SESSION_ROUND:
                this.elapsedTime += dt;

                //ALMOST DONE THE ROUND
                if (!this.playedAlmostDoneAlert && (this.roundDuration - this.elapsedTime) < kRoundAlmostDoneTime)
                {
                    this.playedAlmostDoneAlert = true;
                    this.soundGetReady.play();
                }
                // END OF THE ROUND
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
                    this.playedAlmostDoneAlert = false;

                    //play "end of round" sound
                    this.soundEndOfRound.play();
                    this.updateRoundsMessage();

                    //this.workoutTextBox.setFontPixelsPerMeter(kWorkoutTextBoxSmallFontSize)

                    this.updateWorkoutMessage(); //END OF ROUND
                }
                else
                {
                    this.updateTimer(this.roundDuration - this.elapsedTime);
                    this.updateWorkoutMessage(); //DURING ROUND
                }
                break;
            case SESSION_REST:
                this.elapsedTime += dt;

                // START OF THE NEXT ROUND
                if (this.elapsedTime > this.restDuration)
                {
                    this.startGetReadyState();

                    // this.state = SESSION_GET_READY;
                    // this.showBagForNextRound();
                    // this.soundGetReady.play();

                    // this.elapsedTime = 0.0;
                    // this.updateWorkoutMessage();
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
        this.updateWorkoutMessage();
    }
    hideBag()
    {
        let desiredBagType = this.workoutInfo[this.currentRound+1];
        if (this.currentBagType != desiredBagType)
        {
            switch(this.currentBagType)
            {
                case ROUND_HEAVY_BAG:
                    this.heavyBag.fadeOut();
                    break;
                case ROUND_DOUBLE_ENDED_BAG:
                    this.doubleEndedBag.fadeOut();
                    break;
            }
            this.currentBagType = null;
        }
    }
    showBagForNextRound()
    {
        let desiredBagType = this.workoutInfo[this.currentRound + 1].bagType;
        if (this.currentBagType != desiredBagType)
        {
            switch(desiredBagType)
            {
                case ROUND_HEAVY_BAG:
                    this.heavyBag.fadeIn();
                    this.currentBagType = ROUND_HEAVY_BAG;
                    break;
                case ROUND_DOUBLE_ENDED_BAG:
                    this.doubleEndedBag.fadeIn();
                    this.currentBagType = ROUND_DOUBLE_ENDED_BAG;
                    break;
            }
            
        }
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
    updateWorkoutMessage()
    {
        console.assert(this.workoutInfo);
        switch(this.state)
        {
            case SESSION_INTRO:
                {
                    console.assert(!this.workoutStageTextBox.visible && this.workoutIntroTextBox.visible);
                    this.workoutIntroTextBox.displayMessage(this.workoutInfo[0].introText);
                }
                break;
            case SESSION_GET_READY:
                {
                    console.assert(!this.workoutStageTextBox.visible && this.workoutIntroTextBox.visible);
                    console.assert(this.workoutInfo.length > (this.currentRound + 1));
                    let roundInfo = this.workoutInfo[this.currentRound + 1];
                    this.workoutIntroTextBox.displayMessage(roundInfo.introText);
                    this.nextWorkoutStageTime = roundInfo.stages[0].startTimePercent * this.roundDuration;
                    this.nextWorkoutStage = 0;
                }
                break;
            case SESSION_ROUND:
                {
                    console.assert(this.workoutStageTextBox.visible && !this.workoutIntroTextBox.visible);
                    if (this.elapsedTime >= this.nextWorkoutStageTime)
                    {
                        let roundInfo = this.workoutInfo[this.currentRound];
                        this.workoutStageTextBox.displayMessage(roundInfo.stages[this.nextWorkoutStage].descriptionText);
                        this.nextWorkoutStage++;
                        if (this.nextWorkoutStage < roundInfo.stages.length)
                        {
                            this.nextWorkoutStageTime = roundInfo.stages[this.nextWorkoutStage].startTimePercent * this.roundDuration;
                        }
                        else
                        {
                            this.nextWorkoutStageTime = Number.MAX_VALUE;
                        }
                    }
                }
                break;
            case SESSION_REST:
                {
                    console.assert(this.workoutStageTextBox.visible && !this.workoutIntroTextBox.visible);
                    this.workoutStageTextBox.displayMessage("TAKE A BREATHER!");
                }
                break;
            case SESSION_OUTRO:
                this.workoutIntroTextBox.visible = false;
                this.workoutStageTextBox.visible = false;
                break;
        }
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