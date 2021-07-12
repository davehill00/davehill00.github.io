
export class VRButton
{
    constructor(renderer)
    {
        this.renderer = renderer;

        // this.uiButtonGroup = document.createElement("div");
        // this.uiButtonGroup.className = "button_container";
        // document.body.appendChild(this.uiButtonGroup);

        this.uiStartButton = document.createElement("button");
        // this.uiStartButton.className = "vr_button";
        this.stylizeElement(this.uiStartButton);
        this.uiStartButton.innerHTML = "&#x2022;  &#x2022;  &#x2022;";
        // this.uiStartButton.disabled = true;
        this.uiStartButton.onclick = () => {this.onStartClicked()};

        // this.stylizeElement(this.uiStartButton);
        document.body.appendChild(this.uiStartButton);
    }

    stylizeElement(element)
    {
        element.style.display = 'unset';
        element.style.position = 'absolute';

        element.style.bottom = '20px';
        element.style.height = '80px'
        element.style.width = '120px';
        element.style.left = 'calc(50% - 60px)';
        element.style.padding = '12px 6px';
        element.style.border = '2px solid #888';
        element.style.borderRadius = '0px';
        element.style.background = '#ffffff'; //'rgba(0,0,0,1.0)';
        element.style.color = '#000000';
        element.style.font = 'normal 24px sans-serif';
        element.style.textAlign = 'center';
        element.style.opacity = '0.8';
        element.style.outline = 'solid';
        element.style.zIndex = '999';
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
        this.uiStartButton.innerHTML = "ENTER VR";
        // this.uiConfigureButton.disabled = false;
        // this.uiConfigureButton.innerHTML = this.getMatchConfigString();

    }
    
    onWebXRNotFound()
    {
        this.uiStartButton.innerHTML = "WebXR not supported"
        this.uiStartButton.classList.add("webxr_not_found");
        this.uiStartButton.disabled = false;
        this.uiStartButton.onclick = () => {
            window.open("https://immersiveweb.dev", "_blank");
        }

        // this.uiConfigureButton.style.display = "none";
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
}