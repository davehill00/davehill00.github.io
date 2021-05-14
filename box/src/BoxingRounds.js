import {ROUND_HEAVY_BAG} from "./workoutData.js";
import {formatTimeString} from "./gamelogic.js";

const kRoundAlmostDoneTime = 10.0;

class BoxingRound
{
    constructor(roundNumber, maxRounds, bagType)
    {
        this.roundNumber = roundNumber;
        this.maxRounds = maxRounds;
        this.bagType = bagType;

        // console.log("Initialize Round " + roundNumber + "/" + maxRounds);
    }

    start(session, elapsedTime)
    {
    }

    update(session, elapsedTime)
    {
    }

    end(session)
    {
    }

    isOver(elapsedTime)
    {
        return false;
    }

    didPlayerFail()
    {
        return false;
    }

    isFinalRound()
    {
        return this.roundNumber == this.maxRounds;
    }

    getBagType()
    {
        return this.bagType;
    }

    getIntroText()
    {
        return "";
    }

    getBagTypeString()
    {
        return (this.bagType == ROUND_HEAVY_BAG) ? "Heavy Bag" : "Double-end Bag";
    }

    onBagHit(whichHand, speed)
    {

    }

}

export class TimedBoxingRound extends BoxingRound
{
    constructor(duration, roundNumber, maxRounds, bagType, introText = null)
    {
        super(roundNumber, maxRounds, bagType);
        this.roundDuration = duration;
        
        if (introText === null)
        {
            this.introText = "Freestyle round:\n \u2022 " + this.getBagTypeString() + ", " + formatTimeString(this.roundDuration) + " duration";
        }
        else
        {
            this.introText = introText;
        }
    }

    start(session, elapsedTime)
    {
        this.startTime = elapsedTime;
        this.endTime = this.startTime + this.roundDuration;
        this.playedAlmostDoneAlert = false;

        session.displayWorkoutInfoMessage(
            this.getBagTypeString() + "\nFreestyle", false);
    }

    update(session, elapsedTime)
    {
        if (!this.playedAlmostDoneAlert && (this.roundDuration - elapsedTime) < kRoundAlmostDoneTime)
        {
            this.playedAlmostDoneAlert = true;
            session.playGetReadySound();
        }

        session.updateTimer(this.roundDuration - elapsedTime);
    }

    end(session)
    {
    }

    isOver(elapsedTime)
    {
         return elapsedTime > this.roundDuration;
    }

    getIntroText()
    {
        return this.introText;
    }
}

export class ScriptedBoxingRound extends TimedBoxingRound
{
    constructor(info, duration, roundNumber)
    {
        super(duration, roundNumber, info.length - 1, info[roundNumber].bagType);
        this.roundInfo = info[roundNumber];
    }

    start(session, elapsedTime)
    {
        this.startTime = elapsedTime;
        this.endTime = this.startTime + this.roundDuration;
        this.playedAlmostDoneAlert = false;

        // display the stage[0] description
        session.displayWorkoutInfoMessage(this.roundInfo.stages[0].descriptionText, false);

        // prep for stage 1 message (if any)
        this.nextWorkoutStage = 1;
        this.updateNextWorkoutStageTime(this.nextWorkoutStage);
    }

    update(session, elapsedTime)
    {
        if (!this.playedAlmostDoneAlert && (this.roundDuration - elapsedTime) < kRoundAlmostDoneTime)
        {
            this.playedAlmostDoneAlert = true;
            session.playGetReadySound();
        }

        session.updateTimer(this.roundDuration - elapsedTime);
        
        if (elapsedTime >= this.nextWorkoutStageTime)
        {
            session.displayWorkoutInfoMessage(this.roundInfo.stages[this.nextWorkoutStage].descriptionText);
            this.nextWorkoutStage++;

            this.updateNextWorkoutStageTime(this.nextWorkoutStage);
        }
    }

    updateNextWorkoutStageTime(stage)
    {
        if (stage < this.roundInfo.stages.length)
        {
            this.nextWorkoutStageTime = this.roundInfo.stages[stage].startTimePercent * this.roundDuration;
        }
        else
        {
            this.nextWorkoutStageTime = Number.MAX_VALUE;
        }
    }

    getIntroText()
    {
        return this.roundInfo.introText;
    }
}

export class NumberOfPunchesBoxingRound extends BoxingRound
{
    constructor(numPunches, roundNumber, maxRounds, bagType, introText = null)
    {
        super(roundNumber, maxRounds, bagType);
        this.numPunches = numPunches;
        this.almostDonePunchCount = Math.floor(numPunches * 0.25);
        //console.log("Almost Done Count: " + this.almostDonePunchCount);

        if (introText === null)
        {
            this.introText = "Throw " + this.numPunches + " punches on the " + this.getBagTypeString() + ".";
        }
        else
        {
            this.introText = introText;
        }
    }

    start(session, elapsedTime)
    {
        session.displayWorkoutInfoMessage("THROW " + this.numPunches + " PUNCHES.", false);
        this.startTime = elapsedTime;
        this.session = session;
    }

    update(session, elapsedTime)
    {
        session.updateTimer(elapsedTime - this.startTime, false, false);
    }

    isOver(elapsedTime)
    {
        return this.numPunches <= 0;
    }

    onBagHit(whichHand, speed)
    {
        this.numPunches--;
        this.session.displayWorkoutInfoMessage("THROW " + this.numPunches + " PUNCHES.", false );

        if(this.numPunches == this.almostDonePunchCount)
        {
            this.session.playGetReadySound();
        }
    }

    getIntroText()
    {
        return this.introText;
    }
}

export class TimeAdjustedNumberOfPunchesBoxingRound extends NumberOfPunchesBoxingRound
{
    constructor(duration, ppm, roundNumber, maxRounds, bagType, introText = null)
    {
        super((duration / 60) * ppm, roundNumber, maxRounds, bagType);
    }
}

export class SpeedRound extends TimedBoxingRound
{
    //roundInfo, roundDuration, roundNumber, this.numRounds
    constructor(roundInfo, duration, roundNumber, maxRounds, introText = null)
    {
        super(duration, roundNumber, maxRounds, roundInfo.bagType); //roundInfo.introText);
        if (introText != null)
        {
            this.introText = introText;
        }
        else
        {
            this.introText = (this.bagType == ROUND_HEAVY_BAG) ? "HEAVY BAG SPEED:\n" : "DOUBLE-END SPEED:\n";
            for(let i = 0; i < roundInfo.stages.length; i++)
            {
                this.introText += " \u2022 ";
                if (i == 0)
                {
                    this.introText += "Start at " + roundInfo.stages[i].targetPPM + " PPM\n";
                }
                else if (i == (roundInfo.stages.length - 1))
                {
                    this.introText += "Finish at " + roundInfo.stages[i].targetPPM + " PPM";
                }
                else
                {
                    this.introText += "Ramp to " + roundInfo.stages[i].targetPPM + " PPM\n";
                }
            }
            // "DOUBLE-END SPEED:\n" +
            // " \u2022 Start at 300PPM\n" + 
            // " \u2022 Ramp up to 350PPM\n" + 
            // " \u2022 Finish off at 400PPM\n",
        }
        this.roundInfo = roundInfo;
    }

    start(session, elapsedTime)
    {
        this.startTime = elapsedTime;
        this.endTime = this.startTime + this.roundDuration;
        this.playedAlmostDoneAlert = false;

        this.targetPPM = this.roundInfo.stages[0].targetPPM;
        this.nextSpeedCheckTime = elapsedTime + 5.0;
        this.isShowingHurryUp = false;
        this.hurryUpCount = 0;
        this.nextHurryUpMessageTime = 0.0;

        // display the stage[0] description
        let descriptionText = "Start at " + this.roundInfo.stages[0].targetPPM + " PPM.";
        this.currentDescriptionText = descriptionText; //this.roundInfo.stages[0].descriptionText;
        session.displayWorkoutInfoMessage(this.currentDescriptionText, false);

        // prep for stage 1 message (if any)
        this.nextWorkoutStage = 1;
        this.updateNextWorkoutStageTime(this.nextWorkoutStage);
    }

    update(session, elapsedTime)
    {
        if (!this.playedAlmostDoneAlert && (this.roundDuration - elapsedTime) < kRoundAlmostDoneTime)
        {
            this.playedAlmostDoneAlert = true;
            session.playGetReadySound();
        }

        session.updateTimer(this.roundDuration - elapsedTime);

        if (elapsedTime >= this.nextWorkoutStageTime)
        {    
            let bIsLastStage = (this.nextWorkoutStageTime + 1) == this.roundInfo.stages.length;

            this.targetPPM = this.roundInfo.stages[this.nextWorkoutStage].targetPPM;
            this.nextSpeedCheckTime = elapsedTime + 3.0;

            let descriptionText = 
                bIsLastStage ? 
                    "Finish at " + this.targetPPM + "PPM!" :
                    "Go for " + this.targetPPM + " PPM.";

            this.currentDescriptionText = descriptionText; //this.roundInfo.stages[this.nextWorkoutStage].descriptionText;
            session.displayWorkoutInfoMessage(this.currentDescriptionText);

            this.nextWorkoutStage++;
            this.updateNextWorkoutStageTime(this.nextWorkoutStage);
        }
        else if (elapsedTime > this.nextSpeedCheckTime)
        {
            let ppm = session.punchingStats.getCurrentPPM();
            if ((this.targetPPM - ppm) > 5)
            {
                if (elapsedTime > this.nextHurryUpMessageTime)
                {
                    session.displayWorkoutInfoMessage("Pick up the pace!\nGet back to " + this.targetPPM + " PPM.");
                    this.isShowingHurryUp = true;
                    this.hurryUpCount++;
                    this.nextHurryUpMessageTime = elapsedTime + 1.0 + this.hurryUpCount * 2.0;
                }
                this.nextSpeedCheckTime = elapsedTime + 1.0; // check frequently if we're too slow
            }
            else if (this.isShowingHurryUp)
            {
                this.isShowingHurryUp = false;
                this.hurryUpCount = 0;
                this.nextHurryUpMessageTime = 0.0;
                session.displayWorkoutInfoMessage(this.currentDescriptionText, false);
                this.nextSpeedCheckTime = elapsedTime + 3.0; // check less frequently if we're currently on pace
                
            }
            
        }
    }

    updateNextWorkoutStageTime(stage)
    {
        if (stage < this.roundInfo.stages.length)
        {
            this.nextWorkoutStageTime = this.roundInfo.stages[stage].startTimePercent * this.roundDuration;

        }
        else
        {
            this.nextWorkoutStageTime = Number.MAX_VALUE;
        }
    }
}