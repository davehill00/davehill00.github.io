import * as THREE from 'three';

export class PageUI
{

    constructor(renderer)
    {
        this.renderer = renderer;

        this.roundTime = 120;
        this.roundCount = 3;
        this.restTime = 30;

        if (!window.localStorage.getItem("first_run"))
        {
            window.localStorage.setItem("first_run", "true");
            window.localStorage.setItem("cfg_roundTime", this.roundTime);
            window.localStorage.setItem("cfg_roundCount", this.roundCount);
            window.localStorage.setItem("cfg_restTime", this.restTime);
        }
        else
        {
            let val;
            val = window.localStorage.getItem("cfg_roundTime");
            if (val)
                this.roundTime = parseInt(val);

            val = window.localStorage.getItem("cfg_roundCount");
            if (val)
                this.roundCount = parseInt(val);

            val = window.localStorage.getItem("cfg_restTime");
            if (val)
                this.restTime = parseInt(val);
        }



        this.createUIElements();
        this.checkForXR();
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
        this.uiLogo.src = "./content/heavy_bag_trainer_logo.png";


        this.uiContainer.appendChild(this.uiLogo);

        this.uiButtonContainer = document.createElement("div");
        this.uiButtonContainer.className = "button_container";

        this.uiContainer.appendChild(this.uiButtonContainer);

        this.uiButtonGroup = document.createElement("div");
        this.uiButtonGroup.className = "button_group";
        this.uiButtonContainer.appendChild(this.uiButtonGroup);


        this.uiStartButton = document.createElement("button");
        this.uiStartButton.innerHTML = "START";
        this.uiStartButton.disabled = true;
        this.uiStartButton.onclick = () => {this.onStartClicked()};
        this.uiButtonGroup.appendChild(this.uiStartButton);

        
        this.uiConfigureButton = document.createElement("button");
        this.uiConfigureButton.style.fontSize = "2.25vw"
        this.uiConfigureButton.style.borderWidth = "0.4vw";
        this.uiConfigureButton.innerHTML = this.getMatchConfigString();
        this.uiConfigureButton.disabled = true;
        this.uiConfigureButton.onclick = () => {this.onConfigureClicked()};
        this.uiButtonGroup.appendChild(this.uiConfigureButton);


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
        let val = div.clientWidth - roundTime.clientWidth - 200;
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
        // ROUNDS
        //
        div = document.createElement("div");
        div.className = "plus_minus_container";
        this.uiConfigurationGroup.appendChild(div);

        let roundCount = document.createElement("p");
        roundCount.innerHTML = "ROUNDS:";
        roundCount.className = "configuration_label";
        div.appendChild(roundCount);

        let roundCountMinusButton = document.createElement("button");
        roundCountMinusButton.innerHTML = "-";
        roundCountMinusButton.className = "plus_minus_button";
        val = div.clientWidth - roundCount.clientWidth - 200;
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
        val = div.clientWidth - restTime.clientWidth - 200;
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
        this.uiConfigureButton.disabled = false;

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

        this.uiRoundCountDisplay.innerHTML = this.roundCount.toString();
        this.uiRoundTimeDisplay.innerHTML = this.formatTime(this.roundTime);
        this.uiRestTimeDisplay.innerHTML = this.formatTime(this.restTime);

        this.uiLogo.style.width = "25%";

        this.uiButtonContainer.style.height = "0%";
        this.uiButtonGroup.style.visibility = "hidden";

        this.uiConfigurationContainer.style.height = "auto";
        this.uiConfigurationGroup.style.visibility = "visible";

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

        this.hideConfigurationUI();
    }

    onOkClicked()
    {
        this.hideConfigurationUI();
        window.localStorage.setItem("cfg_roundTime", this.roundTime);
        window.localStorage.setItem("cfg_roundCount", this.roundCount);
        window.localStorage.setItem("cfg_restTime", this.restTime);
    }

    hideConfigurationUI()
    {
        this.uiLogo.style.width = "50%";

        this.uiButtonContainer.style.height = "auto";
        this.uiButtonGroup.style.visibility = "visible";

        this.uiConfigurationContainer.style.height = "0%";
        this.uiConfigurationGroup.style.visibility = "hidden";

        this.uiConfigureButton.innerHTML = this.getMatchConfigString();
    }

    getMatchConfigString()
    {
        let roundOrRounds = (this.roundCount > 1) ? 
            (" Rounds,<br>" + this.formatTime(this.restTime) + " Rest") : " Round";

        return this.roundCount.toString() + " x " + this.formatTime(this.roundTime) + roundOrRounds;
    }
}