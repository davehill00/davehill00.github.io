import {workoutData} from "./workoutData.js";


const kMaxLogo = "40%";
const kMinLogo = "20%";
export class PageUI
{

    constructor(renderer)
    {
        this.renderer = renderer;

        this.roundTime = 120;
        this.roundCount = 3;
        this.restTime = 30;
        this.workoutType = 1;
        this.whichScriptedWorkout = 0;
        this.numScriptedWorkouts = workoutData.length;
        
        this.bagType = 1;
        this.doBagSwap = true;

        if (!window.localStorage.getItem("first_run"))
        {
            window.localStorage.setItem("first_run", "true");
            window.localStorage.setItem("cfg_roundTime", this.roundTime);
            window.localStorage.setItem("cfg_roundCount", this.roundCount);
            window.localStorage.setItem("cfg_restTime", this.restTime);
            window.localStorage.setItem("cfg_bagType", this.bagType);
            window.localStorage.setItem("cfg_bagSwap", this.doBagSwap ? 1 : 0);
            window.localStorage.setItem("cfg_workoutType", this.workoutType);
            window.localStorage.setItem("cfg_scriptedWorkoutId", workoutData[this.whichScriptedWorkout][0].uid);
        }
        else
        {
            let val;
            val = window.localStorage.getItem("cfg_roundTime");
            if (val)
            {
                this.roundTime = parseInt(val);
            }

            val = window.localStorage.getItem("cfg_roundCount");
            if (val)
            {
                this.roundCount = parseInt(val);
            }

            val = window.localStorage.getItem("cfg_restTime");
            if (val)
            {
                this.restTime = parseInt(val);
            }

            val = window.localStorage.getItem("cfg_bagType");
            if (val)
            {
                this.bagType = parseInt(val);
            }

            val = window.localStorage.getItem("cfg_bagSwap");
            if (val)
            {
                this.doBagSwap = (parseInt(val) == 1);
            }
            
            val = window.localStorage.getItem("cfg_workoutType")
            if (val)
            {
                this.workoutType = parseInt(val);
            }
            
            val = window.localStorage.getItem("cfg_scriptedWorkoutId");
            if (val)
            {
                let matchCfgId = (element) => element[0].uid == val;
                let matchedIndex = workoutData.findIndex(matchCfgId);
                if (matchedIndex < 0)
                {
                    //failed to match
                    this.whichScriptedWorkout = 0;
                }
                else
                {
                    this.whichScriptedWorkout = matchedIndex;
                }
            }
        }



        this.createUIElements();
        //this.checkForXR();
    }

    createUIElements()
    {
        this.uiBackplate = document.createElement("div");
        this.uiBackplate.className = "ui_backplate";
        document.body.appendChild(this.uiBackplate);

        this.uiContainer = document.createElement("div");
        this.uiContainer.className = "ui_container";
        document.body.appendChild(this.uiContainer);

        this.uiLogo = document.createElement("img");
        this.uiLogo.className = "title_image";
        this.uiLogo.style.width = kMaxLogo;
        this.uiLogo.src = "./content/heavy_bag_trainer_logo.png";


        this.uiContainer.appendChild(this.uiLogo);

        this.uiButtonContainer = document.createElement("div");
        this.uiButtonContainer.className = "button_container";

        this.uiContainer.appendChild(this.uiButtonContainer);

        this.uiButtonGroup = document.createElement("div");
        this.uiButtonGroup.className = "button_group";
        this.uiButtonContainer.appendChild(this.uiButtonGroup);


        this.uiStartButton = document.createElement("button");
        this.uiStartButton.innerHTML = "LOADING";
        this.uiStartButton.disabled = true;
        this.uiStartButton.onclick = () => {this.onStartClicked()};
        this.uiButtonGroup.appendChild(this.uiStartButton);

        
        this.uiConfigureButton = document.createElement("button");
        this.uiConfigureButton.style.fontSize = "2.25vw"
        this.uiConfigureButton.style.borderWidth = "0.4vw";
        this.uiConfigureButton.innerHTML = "&#x2022;&#x2022;&#x2022;"; // ... with bullet chars instead of periods
        this.uiConfigureButton.disabled = true;
        this.uiConfigureButton.onclick = () => {this.onConfigureClicked()};
        this.uiButtonGroup.appendChild(this.uiConfigureButton);


        this.uiAboutButton = document.createElement("button");
        this.uiAboutButton.style.fontSize = "2.25vw";
        this.uiAboutButton.style.borderWidth = "0.4vw";
        this.uiAboutButton.innerHTML = "About";
        this.uiAboutButton.onclick = () => {this.onAboutClicked()};
        this.uiButtonGroup.appendChild(this.uiAboutButton);

        let appVersionText = document.createElement("span");
        // appVersionText.innerHTML = "Version 0.4&beta;";
        appVersionText.innerHTML = "Version 0.4";
        appVersionText.className = "app_version_text";
        
        this.uiButtonGroup.appendChild(appVersionText);


        this.uiConfigurationContainer = document.createElement("div");
        this.uiConfigurationContainer.className = "configuration_container";
        this.uiConfigurationContainer.style.height = "0%";
        this.uiContainer.appendChild(this.uiConfigurationContainer);

        this.uiConfigurationGroup = document.createElement("div");
        this.uiConfigurationGroup.className = "configuration_group";
        this.uiConfigurationGroup.style.visibility = "hidden";

        this.uiConfigurationContainer.appendChild(this.uiConfigurationGroup);
        

        //
        // ROUND TIME
        // 
 

        let div = document.createElement("div");
        div.className = "plus_minus_container";

        this.uiConfigurationGroup.appendChild(div);

        let roundTime = document.createElement("p");
        roundTime.innerHTML = "ROUND TIME:";
        roundTime.className = "configuration_label";
        div.appendChild(roundTime);

        let roundTimeMinusButton = document.createElement("button");
        roundTimeMinusButton.innerHTML = "-";
        roundTimeMinusButton.className = "plus_minus_button";
        let val = div.clientWidth - roundTime.clientWidth - 300;
        roundTimeMinusButton.style.marginLeft = val.toString() + "px";
        roundTimeMinusButton.onclick = () => {this.onRoundTimeChanged(-30)};
        div.appendChild(roundTimeMinusButton);
        
        this.uiRoundTimeDisplay = document.createElement("p");
        this.uiRoundTimeDisplay.innerHTML = this.formatTime(this.roundTime);
        this.uiRoundTimeDisplay.className = "configuration_label";
        this.uiRoundTimeDisplay.style.marginLeft = "auto";
        div.appendChild(this.uiRoundTimeDisplay);

        let roundTimePlusButton = document.createElement("button");
        roundTimePlusButton.innerHTML = "+";
        roundTimePlusButton.className = "plus_minus_button";
        roundTimePlusButton.style.marginLeft = "auto";
        roundTimePlusButton.onclick = () => {this.onRoundTimeChanged(30)};
        div.appendChild(roundTimePlusButton);

 

        //
        // REST TIME
        //
        div = document.createElement("div");
        div.className = "plus_minus_container";
        this.uiConfigurationGroup.appendChild(div);

        let restTime = document.createElement("p");
        restTime.innerHTML = "REST TIME:";
        restTime.className = "configuration_label";
        div.appendChild(restTime);

        let restTimeMinusButton = document.createElement("button");
        restTimeMinusButton.innerHTML = "-";
        restTimeMinusButton.className = "plus_minus_button";
        val = div.clientWidth - restTime.clientWidth - 300;
        restTimeMinusButton.style.marginLeft = val.toString() + "px";
        restTimeMinusButton.onclick = () => {this.onRestTimeChanged(-5)};
        div.appendChild(restTimeMinusButton);
        
        this.uiRestTimeDisplay = document.createElement("p");
        this.uiRestTimeDisplay.innerHTML = this.formatTime(this.restTime);
        this.uiRestTimeDisplay.className = "configuration_label";
        this.uiRestTimeDisplay.style.marginLeft = "auto";
        div.appendChild(this.uiRestTimeDisplay);

        let restTimePlusButton = document.createElement("button");
        restTimePlusButton.innerHTML = "+";
        restTimePlusButton.className = "plus_minus_button";
        restTimePlusButton.style.marginLeft = "auto";
        restTimePlusButton.onclick = () => {this.onRestTimeChanged(5)};
        div.appendChild(restTimePlusButton);

        //
        // Workout Type: Timed vs. Scripted
        //
        div = document.createElement("div");
        div.className = "plus_minus_container";
        this.uiConfigurationGroup.appendChild(div);

        let workoutType = document.createElement("p");
        workoutType.innerHTML = "WORKOUT:";
        workoutType.className = "configuration_label";
        div.appendChild(workoutType);

        let workoutTypeLeftButton = document.createElement("button");
        workoutTypeLeftButton.innerHTML = "<";
        workoutTypeLeftButton.className = "plus_minus_button";
        val = div.clientWidth - workoutType.clientWidth - 300;
        workoutTypeLeftButton.style.marginLeft = val.toString() + "px";
        workoutTypeLeftButton.onclick = () => {this.onWorkoutTypeChanged(-1)};
        div.appendChild(workoutTypeLeftButton);
        
        this.uiWorkoutTypeDisplay = document.createElement("p");
        this.uiWorkoutTypeDisplay.innerHTML = this.getWorkoutTypeString();
        this.uiWorkoutTypeDisplay.className = "configuration_label";
        this.uiWorkoutTypeDisplay.style.marginLeft = "auto";
        div.appendChild(this.uiWorkoutTypeDisplay);

        let workoutTypeRightButton = document.createElement("button");
        workoutTypeRightButton.innerHTML = ">";
        workoutTypeRightButton.className = "plus_minus_button";
        workoutTypeRightButton.style.marginLeft = "auto";
        workoutTypeRightButton.onclick = () => {this.onWorkoutTypeChanged(1)};
        div.appendChild(workoutTypeRightButton);

        //
        // ROUNDS
        //
        this.uiTimedRoundGroup = document.createElement("div"); //create a group so we can show/hide easily
        this.uiConfigurationGroup.appendChild(this.uiTimedRoundGroup);

        
        div = document.createElement("div");
        div.className = "plus_minus_container";
        this.uiTimedRoundGroup.appendChild(div);

        let roundCount = document.createElement("p");
        roundCount.innerHTML = "ROUNDS:";
        roundCount.className = "configuration_label";
        div.appendChild(roundCount);

        let roundCountMinusButton = document.createElement("button");
        roundCountMinusButton.innerHTML = "-";
        roundCountMinusButton.className = "plus_minus_button";
        val = div.clientWidth - roundCount.clientWidth - 300;
        roundCountMinusButton.style.marginLeft = val.toString() + "px";
        roundCountMinusButton.onclick = () => {this.onRoundCountChanged(-1)};
        div.appendChild(roundCountMinusButton);
        
        this.uiRoundCountDisplay = document.createElement("p");
        this.uiRoundCountDisplay.innerHTML = this.roundCount.toString();
        this.uiRoundCountDisplay.className = "configuration_label";
        this.uiRoundCountDisplay.style.marginLeft = "auto";
        div.appendChild(this.uiRoundCountDisplay);

        let roundCountPlusButton = document.createElement("button");
        roundCountPlusButton.innerHTML = "+";
        roundCountPlusButton.className = "plus_minus_button";
        roundCountPlusButton.style.marginLeft = "auto";
        roundCountPlusButton.onclick = () => {this.onRoundCountChanged(1)};
        div.appendChild(roundCountPlusButton);

        // BAG TYPE
        div = document.createElement("div");
        div.className = "plus_minus_container";
        this.uiTimedRoundGroup.appendChild(div);

        let bagType = document.createElement("p");
        bagType.innerHTML = "BAG TYPE:";
        bagType.className = "configuration_label";
        div.appendChild(bagType);

        let bagTypeLeftButton = document.createElement("button");
        bagTypeLeftButton.innerHTML = "<";
        bagTypeLeftButton.className = "plus_minus_button";
        val = div.clientWidth - bagType.clientWidth - 300;
        bagTypeLeftButton.style.marginLeft = val.toString() + "px";
        bagTypeLeftButton.onclick = () => {this.onBagTypeChanged(-1)};
        div.appendChild(bagTypeLeftButton);
        
        this.uiBagTypeDisplay = document.createElement("p");
        this.uiBagTypeDisplay.innerHTML = this.getBagTypeString();
        this.uiBagTypeDisplay.className = "configuration_label";
        this.uiBagTypeDisplay.style.marginLeft = "auto";
        div.appendChild(this.uiBagTypeDisplay);

        let bagTypeRightButton = document.createElement("button");
        bagTypeRightButton.innerHTML = ">";
        bagTypeRightButton.className = "plus_minus_button";
        bagTypeRightButton.style.marginLeft = "auto";
        bagTypeRightButton.onclick = () => {this.onBagTypeChanged(1)};
        div.appendChild(bagTypeRightButton);


        // SWAP BAG EACH ROUND
        
        div = document.createElement("div");
        div.className = "plus_minus_container";
        this.uiTimedRoundGroup.appendChild(div);

        let swapBagType = document.createElement("p");
        swapBagType.innerHTML = "SWAP BAG EACH ROUND:";
        swapBagType.className = "configuration_label";
        div.appendChild(swapBagType);

        this.uiSwapBagTypeButton = document.createElement("button");
        this.uiSwapBagTypeButton.innerHTML = this.getBagSwapString();
        this.uiSwapBagTypeButton.className = "plus_minus_button";
        this.uiSwapBagTypeButton.style.marginLeft = "auto";
        this.uiSwapBagTypeButton.style.borderRadius = "30%";
        
        this.uiSwapBagTypeButton.onclick = () => {this.onSwapBagTypeChecked()};
        div.appendChild(this.uiSwapBagTypeButton);


        if (this.workoutType != 0)
        {
            this.uiConfigurationGroup.removeChild(this.uiTimedRoundGroup);
        }



        //
        // Create the scripted workout selector UI
        // 

        this.uiScriptedWorkoutGroup = document.createElement("div"); //create a group so we can show/hide easily

        if (this.workoutType == 1)
        {
            this.uiConfigurationGroup.appendChild(this.uiScriptedWorkoutGroup);
        }
        
        // LEFT
        div = document.createElement("div");
        div.className = "plus_minus_container";
        this.uiScriptedWorkoutGroup.appendChild(div);

        // DESCRIPTION
        let workoutLeftButton = document.createElement("button");
        workoutLeftButton.innerHTML = "<";
        workoutLeftButton.className = "next_prev_button";
        //val = div.clientWidth - bagType.clientWidth - 300;
        //bagTypeLeftButton.style.marginLeft = val.toString() + "px";
        workoutLeftButton.onclick = () => {this.onWorkoutSelectionChanged(-1)};
        div.appendChild(workoutLeftButton);
        
        this.uiWorkoutDescription = document.createElement("p");
        // this.uiWorkoutDescription.innerHTML = "DOUBLE-END BAG INSANITY:<br>6 rounds of drills. All double-end, all the time!"
        this.uiWorkoutDescription.innerHTML = workoutData[this.whichScriptedWorkout][0].uiText;
        this.uiWorkoutDescription.className = "workout_description_text"; //"configuration_label";
        // this.uiWorkoutDescription.style.marginLeft = "auto";
        // this.uiWorkoutDescription.style.height = "100%";
        div.appendChild(this.uiWorkoutDescription);

        let workoutRightButton = document.createElement("button");
        workoutRightButton.innerHTML = ">";
        workoutRightButton.className = "next_prev_button";
        workoutRightButton.onclick = () => {this.onWorkoutSelectionChanged(1)};
        div.appendChild(workoutRightButton);

        // RIGHT




        // OK & CANCEL 
        this.uiConfigurationGroup.appendChild(document.createElement("br"));
        this.uiConfigurationGroup.appendChild(document.createElement("br"));

        div = document.createElement("div");
        div.className = "plus_minus_container";
        // div.style.width = "60%";
        this.uiConfigurationGroup.appendChild(div); 

        let cancelButton = document.createElement("button");
        cancelButton.className = "ok_cancel_button";
        cancelButton.innerHTML = "Cancel";
        cancelButton.style.boxShadow = "";
        cancelButton.onclick = () => { this.onCancelClicked(); }
        div.appendChild(cancelButton);

        let okButton = document.createElement("button");
        okButton.className = "ok_cancel_button";
        okButton.innerHTML = "Accept";
        okButton.style.marginLeft = "auto";
        okButton.style.boxShadow = "";
        okButton.onclick = () => { this.onOkClicked(); }
        div.appendChild(okButton);

    }

    checkForXR()
    {
        if ( 'xr' in navigator ) {
			navigator.xr.isSessionSupported( 'immersive-vr' ).then( 
                ( supported ) => {
			    	supported ? this.onWebXRSupported() : this.onWebXRNotFound();
			} );
		} else {
            this.onWebXRNotFound();
		}
    }

    onWebXRSupported()
    {
        this.uiStartButton.disabled = false;
        this.uiStartButton.innerHTML = "START";
        this.uiConfigureButton.disabled = false;
        this.uiConfigureButton.innerHTML = this.getMatchConfigString();

    }
    
    onWebXRNotFound()
    {
        this.uiStartButton.innerHTML = "WebXR not supported"
        this.uiStartButton.classList.add("webxr_not_found");
        this.uiStartButton.disabled = false;
        this.uiStartButton.onclick = () => {
            window.open("https://immersiveweb.dev", "_blank");
        }

        this.uiConfigureButton.style.display = "none";
    }

    onStartClicked()
    {
        // WebXR's requestReferenceSpace only works if the corresponding feature
        // was requested at session creation time. For simplicity, just ask for
        // the interesting ones as optional features, but be aware that the
        // requestReferenceSpace call will fail if it turns out to be unavailable.
        // ('local' is always available for immersive sessions and doesn't need to
        // be requested separately.)

        const sessionInit = { 
            requiredFeatures: [
                'local-floor', 
            ],
            optionalFeatures: [ 
            //'bounded-floor', 
            // 'hand-tracking',
            'high-fixed-foveation-level',
            // 'low-refresh-rate'
        ] };
        navigator.xr.requestSession( 'immersive-vr', sessionInit ).then( 
            (session) => {
                this.onSessionStarted(session);
            }
        );
    }

    onSessionStarted(session)
    {

        this.renderer.xr.setSession( session );
    }

    onConfigureClicked()
    {
        this.oldRoundTime = this.roundTime;
        this.oldRoundCount = this.roundCount;
        this.oldRestTime = this.restTime;
        this.oldBagType = this.bagType;
        this.oldBagSwap = this.doBagSwap;
        this.oldWorkoutType = this.workoutType;
        this.oldWhichScriptedWorkout = this.whichScriptedWorkout;



        this.uiRoundCountDisplay.innerHTML = this.roundCount.toString();
        this.uiRoundTimeDisplay.innerHTML = this.formatTime(this.roundTime);
        this.uiRestTimeDisplay.innerHTML = this.formatTime(this.restTime);

        this.uiBagTypeDisplay.innerHTML = this.getBagTypeString();
        this.uiSwapBagTypeButton.innerHTML = this.getBagSwapString();

        this.uiLogo.style.width = kMinLogo;

        this.uiButtonContainer.style.height = "0%";
        this.uiButtonGroup.style.visibility = "hidden";

        this.uiConfigurationContainer.style.height = "auto";
        this.uiConfigurationGroup.style.visibility = "visible";

    }

    onAboutClicked()
    {
        location.href="about.html";
    }

    formatTime(value)
    {
        let hours = Math.floor(value / 3600);
        let minutes = Math.floor((value - (hours * 3600)) / 60);
        let seconds = value - (hours * 3600) - (minutes * 60);

        let timeString = minutes.toString().padStart(1, '0') + ':' + seconds.toString().padStart(2, '0');
        return timeString;
    }

    onRoundTimeChanged(increment)
    {
        this.roundTime = Math.max(30, Math.min(this.roundTime + increment, 600));
        this.uiRoundTimeDisplay.innerHTML = this.formatTime(this.roundTime);
    }
    onRoundCountChanged(increment)
    {
        this.roundCount = Math.max(1, Math.min(this.roundCount + increment, 16));
        this.uiRoundCountDisplay.innerHTML = this.roundCount.toString();
    }
    onRestTimeChanged(increment)
    {
        this.restTime = Math.max(10, Math.min(this.restTime + increment, 90));
        this.uiRestTimeDisplay.innerHTML = this.formatTime(this.restTime);
    }

    onCancelClicked()
    {
        this.roundCount = this.oldRoundCount;
        this.roundTime = this.oldRoundTime;
        this.restTime = this.oldRestTime;
        this.doBagSwap = this.oldBagSwap;
        this.workoutType = this.oldWorkoutType;
        this.whichScriptedWorkout = this.oldWhichScriptedWorkout;

        this.hideConfigurationUI();
    }

    onOkClicked()
    {
        this.hideConfigurationUI();
        window.localStorage.setItem("cfg_roundTime", this.roundTime);
        window.localStorage.setItem("cfg_roundCount", this.roundCount);
        window.localStorage.setItem("cfg_restTime", this.restTime);
        window.localStorage.setItem("cfg_bagType", this.bagType);
        window.localStorage.setItem("cfg_bagSwap", this.doBagSwap ? 1 : 0);
        window.localStorage.setItem("cfg_workoutType", this.workoutType);
        window.localStorage.setItem("cfg_scriptedWorkoutId", workoutData[this.whichScriptedWorkout][0].uid);
    }

    hideConfigurationUI()
    {
        this.uiLogo.style.width = kMaxLogo;

        this.uiButtonContainer.style.height = "auto";
        this.uiButtonGroup.style.visibility = "visible";

        this.uiConfigurationContainer.style.height = "0%";
        this.uiConfigurationGroup.style.visibility = "hidden";

        this.uiConfigureButton.innerHTML = this.getMatchConfigString();
    }

    getMatchConfigString()
    {
        let matchDescription;
        if (this.workoutType == 0)
        {
            let roundOrRounds = (this.roundCount > 1) ? 
            (" Rounds,<br>" + this.formatTime(this.restTime) + " Rest") : " Round";

            matchDescription = this.roundCount.toString() + " x " + this.formatTime(this.roundTime) + roundOrRounds;
        }
        else
        {
            matchDescription = workoutData[this.whichScriptedWorkout][0].uiShortText + 
            "<br>" + this.formatTime(this.roundTime) + " Round, " + this.formatTime(this.restTime) + " Rest";
        }

        return matchDescription; //this.roundCount.toString() + " x " + this.formatTime(this.roundTime) + roundOrRounds;
    }

    onBagTypeChanged(val)
    {
        this.bagType = (this.bagType + val + 2) % 2;
        this.uiBagTypeDisplay.innerHTML = this.getBagTypeString();
    }

    getBagTypeString()
    {
        if (this.bagType == 0)
        {
            return "HEAVY";
        }
        else if (this.bagType == 1)
        {
            return "DOUBLE-END";
        }
    }

    onSwapBagTypeChecked()
    {
        this.doBagSwap = !this.doBagSwap;
        this.uiSwapBagTypeButton.innerHTML = this.getBagSwapString();
    }

    getBagSwapString()
    {
        return this.doBagSwap ? "&#x2713;" : "";
    }

    getWorkoutTypeString()
    {
        if (this.workoutType == 0)
        {
            return "TIMED";
        }
        else if (this.workoutType == 1)
        {
            return "SCRIPTED";
        }
    }

    onWorkoutTypeChanged(val)
    {
        this.workoutType = (this.workoutType + val + 2) % 2;
        this.uiWorkoutTypeDisplay.innerHTML = this.getWorkoutTypeString();

        if (this.workoutType == 0)
        {
            /*
            this.uiTimedRoundGroup.style.visibility = "visible";
            this.uiTimedRoundGroup.style.height = "auto";

            this.uiScriptedWorkoutGroup.style.visibility = "hidden";
            this.uiScriptedWorkoutGroup.style.height = "0%";
            */

            this.uiConfigurationGroup.replaceChild(this.uiTimedRoundGroup, this.uiScriptedWorkoutGroup);
            
        }
        else
        {
            /*
            this.uiConfigurationGroup.removeChild(this.uiTimedRoundGroup);
            this.uiTimedRoundGroup.style.visibility = "hidden";
            this.uiTimedRoundGroup.style.height = "0%";
            this.uiConfigurationGroup.appendChild(this.uiScriptedWorkoutGroup);
            this.uiScriptedWorkoutGroup.style.visibility = "visible";
            this.uiScriptedWorkoutGroup.style.height = "auto";
            */
            this.uiConfigurationGroup.replaceChild(this.uiScriptedWorkoutGroup, this.uiTimedRoundGroup);
        }
    }
    onWorkoutSelectionChanged(val)
    {
        this.whichScriptedWorkout = (this.whichScriptedWorkout + val + this.numScriptedWorkouts) % this.numScriptedWorkouts;
        this.uiWorkoutDescription.innerHTML = workoutData[this.whichScriptedWorkout][0].uiText;
    }
    
}