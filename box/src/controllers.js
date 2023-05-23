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

        
        // controllers.push(renderer.xr.getControllerGrip( 0 ));
        // // let con0 = renderer.xr.getControllerGrip(0);
        // // con0.add(controllerModelFactory.createControllerModel(con0));
        // // scene.add(con0);
        // controllers[0].controllerModel = controllerModelFactory.createControllerModel(controllers[0]);
        // scene.add( controllers[0] );
        
        // renderer.xr.getControllerGrip(0).addEventListener("connected", (evt) => {
        //     setupHandForController(0, evt);
        // });
        // renderer.xr.getControllerGrip(0).addEventListener("disconnected", (evt) => {
        //     console.log("Lost Gamepad for Controller 0");
        //     console.table(evt.data);
    
        //     if (evt.data == null)
        //         return;
    
        //     controllers[0].gamepad = null;
        //     if (evt.data.handedness == "left")
        //     {
        //         if (leftHand.glove != null)
        //         {
        //             leftHand.glove.hide();
        //         }
        //         leftHand.controller = null;
        //         leftHand.isSetUp = false;
        //     }
        //     else
        //     {
        //         if (rightHand.glove != null)
        //         {
        //             rightHand.glove.hide();
        //         }
        //         rightHand.controller = null;
        //         rightHand.isSetUp = false;
        //     }
            
        // });
    
        // controllers.push(renderer.xr.getControllerGrip( 1 ));
        // controllers[1].controllerModel = controllerModelFactory.createControllerModel(controllers[1]);
        // scene.add( controllers[1] );
       
        // renderer.xr.getControllerGrip(1).addEventListener("connected", (evt) => {
        //     setupHandForController(1, evt);
        // });
        // renderer.xr.getControllerGrip(1).addEventListener("disconnected", (evt) => {
        //     console.log("Lost Gamepad for Controller 1");
        //     console.table(evt.data);
            
        //     if (evt.data == null)
        //         return;
    
        //     controllers[1].gamepad = null;
    
        //     if (evt.data.handedness == "left")
        //     {
        //         if (leftHand.glove != null)
        //         {
        //             leftHand.glove.hide();
        //         }
        //         leftHand.controller = null;
        //         leftHand.isSetUp = false;
        //     }
        //     else
        //     {
        //         if (rightHand.glove != null)
        //         {
        //             rightHand.glove.hide();
        //         }
        //         rightHand.controller = null;
        //         rightHand.isSetUp = false;
        //     }
        // });

    }

    controllerConnected(event, index)
    {
        this.controllerGamepads[index] = event.data.gamepad;

        if (event.data.handedness == "left")
        {
            for(let cb of this.leftControllerConnectedCallbacks)
            {
                cb(index, this.controllerGrips[index], this.controllerTargetRays[index], this.controllerGamepads[index], this.controllerModels[index]);
            }
        }
        else if (event.data.handedness == "right")
        {
            for(let cb of this.rightControllerConnectedCallbacks)
            {
                cb(index, this.controllerGrips[index], this.controllerTargetRays[index], this.controllerGamepads[index], this.controllerModels[index]);
            }
        }
    }

    controllerDisconnected(event, index)
    {
        this.controllerGamepads[index] = null;

        if (event.data.handedness == "left")
        {
            for(let cb of this.leftControllerDisconnectedCallbacks)
            {
                cb();
            }
        }
        else if (event.data.handedness == "right")
        {
            for(let cb of this.rightControllerDisconnectedCallbacks)
            {
                cb();
            }
        }
    }

}