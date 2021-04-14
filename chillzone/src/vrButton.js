import css from './styles.css';

export class VRButton
{
    constructor(renderer)
    {
        this.renderer = renderer;

        // this.uiButtonGroup = document.createElement("div");
        // this.uiButtonGroup.className = "button_container";
        // document.body.appendChild(this.uiButtonGroup);

        this.uiStartButton = document.createElement("button");
        this.uiStartButton.className = "vr_button";
        this.uiStartButton.innerHTML = "&#x2022;  &#x2022;  &#x2022;";
        // this.uiStartButton.disabled = true;
        this.uiStartButton.onclick = () => {this.onStartClicked()};

        // this.stylizeElement(this.uiStartButton);
        document.body.appendChild(this.uiStartButton);
    }

    stylizeElement(element)
    {
        element.style.position = 'absolute';
        element.style.bottom = '20px';
        element.style.padding = '12px 6px';
        element.style.border = '1px solid #fff';
        element.style.borderRadius = '4px';
        element.style.background = 'rgba(0,0,0,0.1)';
        element.style.color = '#fff';
        element.style.font = 'normal 13px sans-serif';
        element.style.textAlign = 'center';
        element.style.opacity = '0.5';
        element.style.outline = 'none';
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
        this.uiStartButton.innerHTML = "e n t e r";
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