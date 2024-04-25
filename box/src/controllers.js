import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

export class Controllers
{
    constructor(scene, renderer)
    {
        this.scene = scene;
        this.renderer = renderer;


        this.controllerGrips = [];
        this.controllerGrips[0] = renderer.xr.getControllerGrip(0);
        this.controllerGrips[1] = renderer.xr.getControllerGrip(1);
        this.controllerTargetRays = [];
        this.controllerTargetRays[0] = renderer.xr.getController(0);
        this.controllerTargetRays[1] = renderer.xr.getController(1);
        this.controllerGamepads = [null, null];

        const controllerModelFactory = new XRControllerModelFactory();
        this.controllerModels = [];
        this.controllerModels[0] = controllerModelFactory.createControllerModel(this.controllerGrips[0]);
        this.controllerModels[1] = controllerModelFactory.createControllerModel(this.controllerGrips[1]);

        this.handedness = ["unknown", "unknown"];
        let _this = this;
        this.controllerGrips[0].addEventListener("connected", (evt) => {
            _this.controllerConnected(evt, 0);
        });
        this.controllerGrips[1].addEventListener("connected", (evt) => {
            _this.controllerConnected(evt, 1);
        });

        this.controllerGrips[0].addEventListener("disconnected", (evt) => {
            _this.controllerDisconnected(evt, 0);
        });
        this.controllerGrips[1].addEventListener("disconnected", (evt) => {
            _this.controllerDisconnected(evt, 1);
        });

        this.leftControllerConnectedCallbacks = [];
        this.leftControllerDisconnectedCallbacks = [];
        this.rightControllerConnectedCallbacks = [];
        this.rightControllerDisconnectedCallbacks = [];

        


    }

    controllerConnected(event, index)
    {
        console.log("CONTROLLER CONNECTED");
        console.log(event.data);

        if (event.data.gamepad == null ||
            event.data.gamepad.buttons.length < 2 ||
            event.data.profiles.includes('generic-hand') ||
            event.data.profiles.includes('oculus-hand'))
        {
            console.log("UNSUPPORTED CONTROLLER -- IGNORING CONNECT:")
            console.log(event.data);
            return;
        }

        this.controllerGamepads[index] = event.data.gamepad;

        if (event.data.handedness == "left")
        {
            for(let cb of this.leftControllerConnectedCallbacks)
            {
                console.log("INVOKING Connect Callback " + cb + " for left controller.")
                cb(index, this.controllerGrips[index], this.controllerTargetRays[index], this.controllerGamepads[index], this.controllerModels[index]);
            }
        }
        else if (event.data.handedness == "right")
        {
            for(let cb of this.rightControllerConnectedCallbacks)
            {
                console.log("INVOKING Connect Callback " + cb + " for right controller.")
                cb(index, this.controllerGrips[index], this.controllerTargetRays[index], this.controllerGamepads[index], this.controllerModels[index]);
            }
        }
    }

    controllerDisconnected(event, index)
    {
        console.log("CONTROLLER DISCONNECTED");
        console.log(event.data);

        if (event.data.gamepad == null ||
            event.data.gamepad.buttons.length < 2 ||
            event.data.profiles.includes('generic-hand') ||
            event.data.profiles.includes('oculus-hand'))
        {
            console.log("UNSUPPORTED CONTROLLER -- IGNORING DISCONNECT:")
            console.log(event.data);
            return;
        }

        this.controllerGamepads[index] = null;

        if (event && event.data)
        {
            if (event.data.handedness == "left")
            {
                for(let cb of this.leftControllerDisconnectedCallbacks)
                {
                    console.log("INVOKING Disconnect Callback " + cb + " for left controller.")
                    cb();
                }
            }
            else if (event.data.handedness == "right")
            {
                console.log(this.rightControllerDisconnectedCallbacks.length + " Right Controller Disconnect Callbacks to process.")
                for(let cb of this.rightControllerDisconnectedCallbacks)
                {
                    console.log("INVOKING Disconnect Callback " + cb + " for right controller.")
                    cb();
                }
            }
        }
        else
        {
            console.log("MALFORMED DISCONNECT EVENT - NO DATA");
            console.log(event);
        }
    }

}