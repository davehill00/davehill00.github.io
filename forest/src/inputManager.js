import * as THREE from 'three';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';


export var gInputManager = null;
export function InitializeInputManager(xr)
{
    gInputManager = new InputManager(xr);
}

export class InputManager
{
    constructor(xr)
    {
        console.assert(gInputManager == null);

        this.xr = xr;

        this.controllerModelFactory = new XRControllerModelFactory();
        this.controllers = [];
        this.controllers[0] = this.initController(0);
        this.controllers[1] = this.initController(1);

        this.keyboardEmulationInput = 
        {
            forward: 0.0,
            sideways: 0.0,
            turn: 0.0
        };

        document.addEventListener('keydown', (event) => { this.onKeyDown(event); });
        document.addEventListener('keyup', (event) => {this.onKeyUp(event); });

    }

    initController(which)
    {
        let con = this.xr.getControllerGrip(which);
        con.add(this.controllerModelFactory.createControllerModel(con));
        con.addEventListener("connected", (event) => {this.onControllerConnected(event, which)});
        con.addEventListener("disconnected", (event) => {this.onControllerDisconnected(event, which)});

        return con;
    }

    onControllerConnected(evt, whichController) 
    {
        if (evt.data && evt.data.handedness) {

            // Ensure right and left controllers are mapped consistently -- Right == 0, Left == 1
            if ((evt.data.handedness == "right") != (whichController == 0))
            {
                // Swap order of controllers array
                let tmp = this.controllers[0];
                this.controllers[0] = this.controllers[1];
                this.controllers[0] = tmp;
            }
            this.controllers[whichController].xrController = evt.data;
            this.controllers[whichController].xrConnected = true;
        }
    }

    onControllerDisconnected(evt, whichController) 
    {
        this.controllers[whichController].xrController = null;
        this.controllers[whichController].xrConnected = false;
    }

    readButton(whichHand, whichButton)
    {
        if (this.controllers[whichHand].xrConnected)
        {
            return this.controllers[whichHand].xrController.gamepad.buttons[whichButton];
        }
        return 0;
    }

    readAxis(whichHand, whichAxis)
    {
        if (this.controllers[whichHand].xrConnected)
        {
            return this.controllers[whichHand].xrController.gamepad.axes[whichAxis];
        }
        return 0;
    }

    hasXrInput()
    {
        return this.controllers[0].xrConnected && this.controllers[1].xrConnected;
    }

    getKeyboardEmulationInput()
    {
        return this.keyboardEmulationInput;
    }

    onKeyDown(event)
    {
        if (event.code == 'KeyW')
        {
            this.keyboardEmulationInput.forward = -1.0;
        }
        else if (event.code == 'KeyS')
        {
            this.keyboardEmulationInput.forward = 1.0;
        }
        else if (event.code == 'KeyQ')
        {
            this.keyboardEmulationInput.sideways = 1.0;
        }
        else if (event.code == 'KeyE')
        {
            this.keyboardEmulationInput.sideways = -1.0;
        }
        else if (event.code == 'KeyA')
        {
            this.keyboardEmulationInput.turn = -1.0;
        }
        else if (event.code == 'KeyD')
        {
            this.keyboardEmulationInput.turn = 1.0;
        }
    }

    onKeyUp(event)
    {
        if (event.code == 'KeyW')
        {
            this.keyboardEmulationInput.forward = 0.0;
        }
        else if (event.code == 'KeyS')
        {
            this.keyboardEmulationInput.forward = 0.0;
        }
        else if (event.code == 'KeyQ')
        {
            this.keyboardEmulationInput.sideways = 0.0;
        }
        else if (event.code == 'KeyE')
        {
            this.keyboardEmulationInput.sideways = 0.0;
        }
        else if (event.code == 'KeyA')
        {
            this.keyboardEmulationInput.turn = 0.0;
        }
        else if (event.code == 'KeyD')
        {
            this.keyboardEmulationInput.turn = 0.0;
        }
    }

}