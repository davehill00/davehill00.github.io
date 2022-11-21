import * as THREE from 'three';
import { TextBox } from './textBox';
import {MovingAverageEventsPerMinute} from './movingAverage.js';

var MSDFShader = require('./thirdparty/three-bmfont-text/shaders/msdf')

const SESSION_NULL = 0;
const SESSION_INTRO = 1;
const SESSION_GET_READY = 2;
const SESSION_ROUND = 3;
const SESSION_REST = 4;
const SESSION_OUTRO = 5;
const SESSION_PAUSED = 6;

const kPunchNames = 
[
    "UNRECOGNIZED",
    "JAB(1)",
    "STRAIGHT(2)",
    "LEFT HOOK(3)",
    "RIGHT HOOK(4)",
    "LEFT UPPER(5)",
    "RIGHT UPPER(6)"
];

import {workoutData, ROUND_HEAVY_BAG, ROUND_DOUBLE_END_BAG, ROUNDTYPE_SCRIPTED, ROUNDTYPE_NUM_PUNCHES, ROUNDTYPE_TIMED, ROUNDTYPE_SPEED, ROUNDTYPE_NUM_PUNCHES_TIMEADJUSTED} from "./workoutData.js";
import {TimedBoxingRound, ScriptedBoxingRound, NumberOfPunchesBoxingRound, SpeedRound, TimeAdjustedNumberOfPunchesBoxingRound} from "./BoxingRounds.js";
import { PunchDetector, PUNCH_JAB, PUNCH_LEFT_HOOK, PUNCH_RIGHT_HOOK, PUNCH_STRAIGHT, PUNCH_UNKNOWN, PUNCH_LEFT_UPPERCUT, PUNCH_RIGHT_UPPERCUT } from './punchDetector';

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

let tVec0 = new THREE.Vector3();

export function formatTimeString(timeInSeconds)
{
    let hours = Math.floor(timeInSeconds / 3600);
    let minutes = Math.floor((timeInSeconds - (hours * 3600)) / 60);
    let seconds = timeInSeconds - (hours * 3600) - (minutes * 60);

    return minutes.toString().padStart(1, '0') + ':' + seconds.toFixed(0).toString().padStart(2, '0');
}


export class BoxingSession
{
    constructor(scene, camera, renderer, audioListener, heavyBag, doubleEndBag, numRounds, roundDuration, restDuration, bagType, doBagSwapEachRound)
    {
        this.scene = scene;
        this.audioListener = audioListener;
        this.heavyBag = heavyBag;
        this.doubleEndBag = doubleEndBag;
        this.TV = null;
        this.forceRoundOver = false;
        this.camera = camera;
        this.renderer = renderer;

        // this.initialize(numRounds, roundDuration, restDuration);

        heavyBag.punchCallbacks.push((glove, speed, velocity) => {this.onBagHit(glove, speed, velocity)});
        doubleEndBag.punchCallbacks.push((glove, speed, velocity) => {this.onBagHit(glove, speed, velocity)});
        
        this.punchingStats = new PunchingStats(scene);
        this.punchDetector = new PunchDetector();
        this.lastPunchType = null;
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

        this.workoutSummaryTextBox = new TextBox(570, "left", 1.55, "top", 0.53, 0x000000);
        this.workoutSummaryTextBox.position.y = 0.007;
        this.workoutSummaryTextBox.visible = false;

        this.currentTimeInWholeSeconds = -1.0;

        this.headingArrow = new THREE.Mesh(
            new THREE.BoxGeometry(0.05, 0.05, 0.5),
            new THREE.MeshBasicMaterial({color: 0x804080})
        );
        this.punchArrow = new THREE.Mesh(
            new THREE.BoxGeometry(0.05, 0.05, 0.5),
            new THREE.MeshBasicMaterial({color: 0x408040})
        );

        this.headingArrow.position.set(0.0, 0.1, -1.0);
        this.punchArrow.position.set(0.0, 0.15, -1.0);

        // this.scene.add(this.headingArrow);
        // this.scene.add(this.punchArrow);
  
        this.scene.traverse((node) => {
            if (node.name == "Screen")
            {
                this.TV = node;
                this.TV.add(this.timerTextBox);
                this.TV.add(this.roundsTextBox);
                this.TV.add(this.stateTextBox);
                this.TV.add(this.workoutIntroTextBox);
                this.TV.add(this.workoutStageTextBox);
                this.TV.add(this.workoutSummaryTextBox);

                this.TV.add(this.sound321);
                this.TV.add(this.soundEndOfRound);
                this.TV.add(this.soundGetReady);
                this.TV.add(this.soundNewInstructions);

                // this.updateTimer();
                // this.updateRoundsMessage();
            }
        });




        // models?

        document.addEventListener('keypress', (event) => {this.onKeyPress(event)});
    }

    initialize(numRounds, roundDuration, restDuration, bagType, bagSwap, workoutType, whichScriptedWorkout)
    {
        // roundDuration = 10;
        // restDuration = 5;
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

        this.punchingStats.initialize();

        
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
            else if (roundInfo.roundType == ROUNDTYPE_NUM_PUNCHES_TIMEADJUSTED)
            {
                round = new TimeAdjustedNumberOfPunchesBoxingRound(roundDuration, roundInfo.numPunchesPerMinute, roundNumber, this.numRounds, roundInfo.bagType)
            }
            else if (roundInfo.roundType == ROUNDTYPE_TIMED)
            {
                round = new TimedBoxingRound(roundDuration, roundNumber, this.numRounds, roundInfo.bagType, roundInfo.introText);
            }
            else if (roundInfo.roundType == ROUNDTYPE_SPEED)
            {
                round = new SpeedRound(roundInfo, roundDuration, roundNumber, this.numRounds, roundInfo.introText);
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
        this.forceRoundOver = false;

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
        
        if (this.state == SESSION_PAUSED)
            return;


        if (this.doubleEndBag.visible)
        {
            this.doubleEndBag.update(dt, accumulatedTime);
        }
        else if (this.heavyBag.visible)
        {
            this.heavyBag.update(dt, accumulatedTime);
        }

        this.punchingStats.update(dt, accumulatedTime);

        
        if (this.renderer && this.renderer.xr && this.renderer.xr.isPresenting)
        {
            let xrCamera = this.renderer.xr.getCamera(this.camera);
            xrCamera.getWorldPosition(tVec0);
            this.punchDetector.update(dt, tVec0);


            this.punchDetector.getAverageDirection(tVec0);
            let cosTheta = tVec0.x;
            // console.log("ANGLE = ", Math.acos(cosTheta) * 180.0 / Math.PI);
            this.headingArrow.rotation.set(0.0, Math.acos(cosTheta) - 1.57, 0.0);

            this.punchDetector.getLastPunchDirection(tVec0);
            cosTheta = tVec0.x;

            this.punchArrow.rotation.set(0.0, Math.acos(cosTheta) - 1.57, 0.0);
    
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
                    this.updateTimer(kIntroDuration /*+ kIntroGetReadyDuration*/ - this.elapsedTime);
                }
                break;
            case SESSION_GET_READY:
                this.elapsedTime += dt;
                let readyDuration = (this.currentRound == 0) ? kIntroGetReadyDuration : kRestGetReadyDuration;
                if (this.elapsedTime > readyDuration)
                {

                    if (this.currentRound == 0)
                    {
                        // Start the "elapsed time" timer now so that it doesn't record the intro. 
                        this.punchingStats.start(); 
                    }
                    else
                    {
                        this.punchingStats.resume();
                    }
                    
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
                if (this.boxingRoundInfo.isOver(this.elapsedTime) || this.forceRoundOver == true )
                {
                    this.boxingRoundInfo.end(this);
                    this.punchingStats.pause();

                    this.elapsedTime = 0.0;
                    this.playedAlmostDoneAlert = false;

                    //play "end of round" sound
                    this.soundEndOfRound.play();

                    if ( this.boxingRoundInfo.didPlayerFail() || this.boxingRoundInfo.isFinalRound())
                    {
                        if (this.boxingRoundInfo.didPlayerFail())
                        {
                            this.displayWorkoutInfoMessage("Better luck next time!", false);
                        }
                        else
                        {
                            let message = this.punchingStats.getEndOfRoundSummaryString();
                            //this.displayWorkoutInfoMessage(message); //"Great job!", false);
                            this.workoutStageTextBox.visible = false;
                            this.workoutSummaryTextBox.displayMessage(message);
                            this.workoutSummaryTextBox.visible = true;
                        }
                        this.state = SESSION_OUTRO;
                    }
                    else
                    {
                        this.displayWorkoutInfoMessage("Take a breather!", false);
                        this.hideBag();

                        this.state = SESSION_REST;
                    }

                    
                    this.updateRoundsMessage();

                    this.forceRoundOver = false;
                    
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
        this.updateRoundsMessage();
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
        if (this.currentBagType == ROUND_HEAVY_BAG)
        {
            this.punchDetector.initialize(this.heavyBag);
        }
        else
        {
            this.punchDetector.initialize(this.doubleEndBag);
        }
    }

    updateTimer(value, bRoundUp = true, bChangeColorOnFinalTenSeconds=true)
    {
        let message;
        if (this.state == SESSION_NULL || this.state == SESSION_OUTRO)
        {
            this.timerTextBox.setMessageColor(kGreyColor);
            message = "0:00";
        }
        else
        {
            let newTimeInWholeSeconds = bRoundUp ? Math.ceil(value) : Math.floor(value);
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

    onBagHit(glove, speed, velocity)
    {           
        this.lastPunchType = this.punchDetector.analyzePunch_V3(glove, velocity);

        if (this.state == SESSION_ROUND)
        {
            this.boxingRoundInfo.onBagHit(glove.whichHand, speed, velocity);
            this.punchingStats.onBagHit(glove.whichHand, speed, velocity, this.lastPunchType);
        }
    }

    onKeyPress(event)
    {
        if (event.code == 'Period')
        {
            if (this.state == SESSION_ROUND)
            {
                this.forceRoundOver = true;
            }

            this.elapsedTime += 60.0;
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
        this.lastPunchSpeed = 0.0;
        this.lastPunchType = 0;
        this.lastPunchTypeCount = 0;
        this.clearLastPunchTime = 0.0;
        this.punchRecord = [];
        this.punchRecordLength = 0;
  
        this.punchRateNew = new MovingAverageEventsPerMinute(32, 4.0); //, 1.0);

        this.smoothAvgPPM = 0;
        this.nextStatsUpdate = 0;


        // Summary stats
        this.startTime = 0.0;
        this.punchCounts = [0,0,0,0,0,0,0];
        this.maxSpeed = 0.0;
        this.accumulatedSpeedForAverage = 0.0;




        this.statsTextBox = new TextBox(520, "left", 1.55, "bottom", 0.25, 0x000000);
        // this.textBox.position.x = 0.12;
        this.statsTextBox.position.y = -0.35;

        this.punchTextBox = new TextBox(520, "right", 0.85, "center", 0.25, 0x000000);
        this.punchTextBox.position.x = 0.375;
        this.punchTextBox.position.y = -0.35;

        this.scene.traverse((node) => {
            if (node.name == "Screen")
            {
                this.TV = node;
                this.TV.add(this.statsTextBox);
                this.TV.add(this.punchTextBox);
            }
        });

        this.updateStatsDisplay();
    }

    initialize()
    {
        this.startTime = -1.0;
        for (let i = 0; i < this.punchCounts.length; i++)
        {
            this.punchCounts[i] = 100;
        }
        this.maxSpeed = 0.0;
        this.accumulatedSpeedForAverage = 0.0;
    }

    start()
    {
        this.startTime = -1.0;
        this.elapsedWorkoutTime = 0.0;
    }

    pause()
    {
        this.elapsedWorkoutTime += this.accumulatedTime - this.startTime;
    }

    resume()
    {
        this.startTime = this.accumulatedTime;
    }

    getEndOfRoundSummaryString()
    {
        let message;
        message = "WORKOUT COMPLETE:\n"
        message += " \u2022 Total time:\u00a0" + formatTimeString(this.elapsedWorkoutTime) + "\n";
        message += " \u2022 Jab:\u00a0" + this.punchCounts[PUNCH_JAB] + ", Straight:\u00a0" + this.punchCounts[PUNCH_STRAIGHT] 
                + ", L\u00a0Hook:\u00a0" + this.punchCounts[PUNCH_LEFT_HOOK] + ", R\u00a0Hook:\u00a0" + this.punchCounts[PUNCH_RIGHT_HOOK] 
                + ", L\u00a0Upper:\u00a0" + this.punchCounts[PUNCH_LEFT_UPPERCUT] + ", R\u00a0Upper:\u00a0" + this.punchCounts[PUNCH_RIGHT_UPPERCUT] + 
                ", Other:\u00a0" + this.punchCounts[PUNCH_UNKNOWN] + "\n";
        message += " \u2022 Max:\u00a0" + this.maxSpeed.toFixed(1) + "\u00a0m/s, Avg:\u00a0" + (this.accumulatedSpeedForAverage/Math.max(this.punches,1)).toFixed(1) + "\u00a0m/s";
        return message;
    }

    update(dt, accumulatedTime)
    {
        this.punchRateNew.update(accumulatedTime);
        if(this.nextStatsUpdate < accumulatedTime)
        {
            this.updateStatsDisplay();
            this.nextStatsUpdate = this.accumulatedTime + 0.5;

        }
        if(this.lastPunchType != -1 && this.clearLastPunchTime < accumulatedTime)
        {
            this.lastPunchType = -1;
            this.punchRecordLength = 0;
            //this.updateStatsDisplay(false, true);
            // console.log("CLEAR LAST PUNCH");

            this.clearLastPunchTime = this.accumulatedTime + 1.0;
        }
        
        this.accumulatedTime = accumulatedTime;

        if (this.startTime < 0.0)
        {
            this.startTime = accumulatedTime;
        }
    }

    onBagHit(whichHand, speed, velocity, lastPunchType)
    {
        this.punches++;
        this.lastPunchTime = this.accumulatedTime;
        this.punchRateNew.recordEntry(this.accumulatedTime);

        this.lastPunchSpeed = speed; //velocity.length();

        this.maxSpeed = Math.max(this.maxSpeed, speed);
        this.accumulatedSpeedForAverage += speed;
        this.punchCounts[lastPunchType]++;


        //console.log("PUNCH TYPE: " + kPunchNames[lastPunchType]);
        if ((this.lastPunchType != lastPunchType) || (lastPunchType == PUNCH_UNKNOWN))
        {
            this.lastPunchType = lastPunchType;
            this.lastPunchTypeCount = 1;
        }
        else
        {
            this.lastPunchTypeCount++;
        }
        // Reset if this gets too long
        if (this.punchRecordLength > 8)
        {
            this.punchRecordLength = 0;
        }
        this.punchRecord[this.punchRecordLength++] = (lastPunchType == PUNCH_UNKNOWN) ? "?" : lastPunchType;

        // A repeated punch will only count as an xN if it happens within this window of time.
        // This allows for Jab-Straight-Jab, Jab-Straight-Jab without getting an x2 on the second Jab.
        // Kind of counter-intuitive, but it doesn't feel great if you see the x2 when you feel like
        // you're starting a new flurry of punches.
        this.clearLastPunchTime = this.accumulatedTime + 0.75;

        this.updateStatsDisplay(true);
    }

    getCurrentPPM()
    {
        return this.cachedPPM;
    }

    updateStatsDisplay(isPunch=false, onlyPunchRecord=false)
    {       


        let message; 

        if (!onlyPunchRecord)
        {
            let ppm = this.punchRateNew.getAverageEPM(this.accumulatedTime);
            this.cachedPPM = ppm;

            message = 
            "PUNCHES:  " + this.punches.toString().padStart(3, '0') + "\n" + 
            "PPM:  " + ppm.toFixed(0).toString().padStart(3, '0') + "\n" + 
            "SPEED:  " + (isPunch ? this.lastPunchSpeed.toFixed(1) : "---");
           
            this.statsTextBox.displayMessage(message);
        }

        if (isPunch || onlyPunchRecord)
        {
            this.punchTextBox.visible = true;
            
            if (onlyPunchRecord)
            {
                message = "";
            }
            else
            {
                if (this.lastPunchTypeCount == 1)
                {
                    message = kPunchNames[this.lastPunchType];
                }
                else
                {
                    message = kPunchNames[this.lastPunchType] + " x " + this.lastPunchTypeCount.toFixed(0);
                }
            }
            message += "\n";
            for(let i = 0; i < this.punchRecordLength; i++)
            {
                if (i > 0)
                {
                    message += "-";
                }
                message += this.punchRecord[i];
            }
            this.punchTextBox.displayMessage(message);
        }
        else
        {
            this.punchTextBox.visible = false;
            this.lastPunchType = -1;
            this.lastPunchTypeCount = 0;
        }
        
        this.nextStatsUpdate = this.accumulatedTime + 1.5;
    }
}




