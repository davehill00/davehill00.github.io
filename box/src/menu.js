import ThreeMeshUI from 'three-mesh-ui'
import {workoutData} from "./workoutData.js";

import { justifyContent } from 'three-mesh-ui/src/utils/block-layout/JustifyContent';
// import {CanvasTexture} from 'three/examples/jsm/interactive/HTMLMesh';

import html2canvas from 'html2canvas';
import {UIPanel} from './uiPanel.js';

import {gControllers} from './box.js';
// import { contentDirection } from 'three-mesh-ui/src/utils/block-layout/ContentDirection.js';

// let logoTexture = new THREE.TextureLoader().load("./content/heavy_bag_trainer_logo.png");

let _x = new THREE.Vector3();
let _y = new THREE.Vector3();
let _z = new THREE.Vector3();
let _intersection = {};

class MenuInputController
{
    constructor(scene)
    {
        this.scene = scene;

        this.leftInputController = 
        {
            gripSpace: null,
            targetRaySpace: null,
            gamepad: null,
            model: null,
            isSetUp: false,
            triggerPressed: false,
            hits: []
        };
        this.rightInputController = 
        {
            gripSpace: null,
            targetRaySpace: null,
            gamepad: null,
            model: null,
            isSetUp: false,
            triggerPressed: false,
            hits: []
        };

        //setup callbacks
        let _this = this;
        gControllers.leftControllerConnectedCallbacks.push((index, targetRaySpace, gripSpace, gamepad, model) => {
            _this.setupInputController(_this.leftInputController, targetRaySpace, gripSpace, gamepad, model);

        });
        gControllers.rightControllerConnectedCallbacks.push((index, targetRaySpace, gripSpace, gamepad, model) => {
            _this.setupInputController(_this.rightInputController, targetRaySpace, gripSpace, gamepad, model);
        });
        gControllers.leftControllerDisconnectedCallbacks.push(() => {
            _this.wrapupInputController(_this.leftInputController);
        });
        gControllers.leftControllerDisconnectedCallbacks.push(() => {
            _this.wrapupInputController(_this.rightInputController);
        });
    }

    shutdown()
    {
        // this.leftInputController.model.visible = false;
        // this.leftInputController.targetRaySpace.visible = false;
        this.leftInputController.targetRaySpace.traverse( (obj)=>{obj.visible = false});
        this.leftInputController.gripSpace.traverse( (obj)=>{obj.visible = false});
        // this.leftInputController.contactDot.visible = false;

        this.rightInputController.targetRaySpace.traverse( (obj)=>{obj.visible = false});
        this.rightInputController.gripSpace.traverse( (obj)=>{obj.visible = false});


        // this.rightInputController.model.visible = false;
        // this.rightInputController.targetRaySpace.visible = false;
        // this.rightInputController.gripSpace.visible = false;
        // this.rightInputController.contactDot.visible = false;
    }
    
    setupInputController(controller, targetRaySpace, gripSpace, gamepad, model)
    {
        controller.gripSpace = gripSpace;
        controller.targetRaySpace = targetRaySpace;
        controller.gamepad = gamepad;
        controller.model = model;
        controller.isSetUp = true;

        const kWidth = 0.0035;
        const halfLength = 0.25;
        let ray = new THREE.Mesh(
            new THREE.BoxGeometry(kWidth, kWidth, 2.0 * halfLength),
            new THREE.MeshBasicMaterial({color: 0xffffff})
        );
        ray.position.z -= halfLength + 0.003;
        ray.position.y -= 0.001;
        // ray.position.x -= 0.006;

        controller.model.envMap = this.scene.envMap;

        
        controller.targetRaySpace.add(controller.model);
        controller.gripSpace.add(ray);
        this.scene.add(controller.targetRaySpace);
        this.scene.add(controller.gripSpace);

        let dot = new THREE.Mesh(
            new THREE.BoxGeometry(kWidth*2, kWidth*2, kWidth),
            new THREE.MeshBasicMaterial({color: 0xffffff})
        );
        controller.gripSpace.add(dot);
        
        controller.contactDot = dot;
        dot.visible = false;


        controller.raycaster = new THREE.Raycaster();
        controller.raycaster.layers.set(0);

        this.dummy = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.5, 0.5),
            new THREE.MeshBasicMaterial({color: 0xff00ff})
        );

        this.dummy.position.y = 1.5;
        this.dummy.position.z = -1.0;


        let x = new THREE.Mesh(
            new THREE.BoxGeometry(0.01, 0.01, 0.01),
            new THREE.MeshBasicMaterial({color: 0xff0000})
        );
        x.position.set(0.0, 1.5, 0.0);
        this.scene.add(x);

        let y = new THREE.Mesh(
            new THREE.BoxGeometry(0.01, 0.01, 0.01),
            new THREE.MeshBasicMaterial({color: 0x00ff00})
        );
        y.position.set(0.0, 1.5, -2.0);
        this.scene.add(y);
        
        this.leftHits = [];
        this.rightHits = [];

        // this.scene.add(this.dummy);
        
    }
    wrapupInputController(controller)
    {
        controller.gripSpace = null;
        controller.targetRaySpace = null;
        controller.gamepad = null;
        controller.model = null;
        controller.isSetUp = false;
        this.scene.remove(controller.targetRaySpace);
        this.scene.remove(controller.gripSpace);
    }

    update(dt, menu)
    {
        if (!this.leftInputController.envMapSet)
        {
            this.leftInputController.model.traverse( (child) => {
                if(child.isMesh)
                {
                    child.material.envMapIntensity = 0.25;
                }
            } );
            this.leftInputController.envMapSet = true;
        }
        if (!this.rightInputController.envMapSet)
        {
            this.rightInputController.model.traverse( (child) => {
                if(child.isMesh)
                {
                    child.material.envMapIntensity = 0.25;
                }
            } );
            this.rightInputController.envMapSet = true;
        }

        let interactables = menu.getInteractableElements();
        this.doControllerHitCheck(this.leftInputController, interactables);
        this.doControllerHitCheck(this.rightInputController, interactables);

        this.doControllerInput(this.leftInputController);
        this.doControllerInput(this.rightInputController);

    }

    doControllerHitCheck(inputController, interactables)
    {
        if (inputController.isSetUp)
        {
            let from = inputController.gripSpace.position;
            inputController.gripSpace.matrixWorld.extractBasis(_x, _y, _z);
            let dir = _z;
            dir.negate();
            inputController.raycaster.set(from, dir);

            let prevHovered = null;
            if (inputController.hits.length > 0)
            {
                prevHovered = inputController.hits[0].object.parent;
                
            }
            inputController.hits.length = 0;

            inputController.raycaster.intersectObjects(interactables, false, inputController.hits);

            if (inputController.hits.length > 0)
            {
                inputController.contactDot.position.z = -inputController.hits[0].distance + 0.02;
                inputController.contactDot.visible = true;

                let curHovered = inputController.hits[0].object.parent;
                
                if (prevHovered !== null && curHovered != prevHovered && prevHovered.isButton)
                {
                    prevHovered.setState('idle');
                }

                if (curHovered != prevHovered && curHovered.isButton)
                {
                    curHovered.setState('hovered');
                    if (inputController.gamepad.hapticActuators != null)
                    {
                        let hapticActuator = inputController.gamepad.hapticActuators[0];
                        if( hapticActuator != null)
                        {
                            hapticActuator.pulse( 0.6, 15 );
                        }
                    }
                }
            }
            else
            {
                if (prevHovered !== null && prevHovered.isButton)
                {
                    prevHovered.setState('idle');
                }

                inputController.contactDot.visible = false;
            }
        }
    }

    doControllerInput(controller)
    {
        if (controller.isSetUp)
        {
            if (controller.gamepad.buttons[0].value > 0.25)
            {
                if (!controller.triggerPressed)
                {
                    controller.triggerPressed = true;
                    if (controller.hits.length > 0)
                    {
                        let curHovered = controller.hits[0].object.parent;
                        if (curHovered.isButton)
                        {
                            curHovered.clickHandler();
                        }
                    }
                }
            }
            else
            {
                controller.triggerPressed = false;
            }
        }
    }
}

let defaultButtonOptions = {
    width: 256,
    height: 48,
    borderRadius: 0.0,
    borderWidth: 3,
    backgroundColor: new THREE.Color(0x000000),
    hoverColor: new THREE.Color(0x332703),
    fontColor: new THREE.Color(0x9f7909),
    fontHoverColor: new THREE.Color(0xa67f0a),
    margin: 4
}
let defaultButtonTextOptions = {
    fontSize: 28,
}

export class MainMenu
{
    constructor(scene, pageUI)
    {
        this.scene = scene;
        this.inputController = new MenuInputController(scene);
        this.settings = {
            roundTime: 120,
            restTime: 30,
            roundCount: 5,
            bagType: 0,
            workoutType: 0,
            whichScriptedWorkout: 0,
            doBagSwap: false,
        };

        this.readSettings();




        this.createSimpleStartMenu();
        this.createSettingsMenu();
        this.setCurrentMenu(this.startMenuBase);
    }

    setCurrentMenu(menu)
    {
        if (this.currentMenu)
        {
            this.scene.remove(this.currentMenu);
        }
        this.scene.add(menu);
        this.currentMenu = menu;
    }
    createSimpleStartMenu()
    {
        this.startMenuBase = new UIPanel(1024, 768, {
            fontFamily: './content/ROCKB.TTF-msdf.json',
            fontTexture: './content/ROCKBTTF.png',
            contentDirection: 'column',
            // justifyContent: 'top', //space-between',
            backgroundOpacity: 1.0,
            backgroundColor: new THREE.Color(0x000000),
            padding: 8,
            offset: 0,
            borderWidth: 8,
            borderColor: new THREE.Color( 0x9f7909 ),
            borderRadius: 0.0,
        });
        
        

        this.startMenuBase.addImage("./content/heavy_bag_trainer_logo.png", {
            width: 400,
            height: 200,
            margin: 8,
            offset: 15/512,
        });

        let _this = this;
        this.startMenuBase.addButton(()=>{_this.onStartButtonClicked()}, {...defaultButtonOptions, borderWidth: 6, height: 56, name: "StartButton"})
            .addText("START", {...defaultButtonTextOptions, fontSize: 40});
        
        this.startMenuBase.addButton(()=>{_this.onSettingsButtonClicked()}, {...defaultButtonOptions, name: "SettingsButton"}).addText("Settings");

        this.startMenuBase.position.y = 1.5;
        this.startMenuBase.position.z = -1.2;
    }

    createSettingsMenu()
    {
        this.settingsMenuBase = new UIPanel(1024, 768, {
            fontFamily: './content/ROCKB.TTF-msdf.json',
            fontTexture: './content/ROCKBTTF.png',
            // contentDirection: 'column',
            // justifyContent: 'top', //space-between',
            backgroundOpacity: 1.0,
            backgroundColor: new THREE.Color(0x000000),
            padding: 32,
            offset: 0,
            borderWidth: 8,
            borderColor: new THREE.Color( 0x9f7909 ),
            fontColor: new THREE.Color( 0x9f7909 ),
            borderRadius: 0.0,
            name: "SettingsMenu Base"
        });

        this.settingsMenuBase.position.y = 1.5;
        this.settingsMenuBase.position.z = -1.2;


        let settingsContainer = this.settingsMenuBase.addHorizontalLayoutSubBlock(1.0, {borderWidth: 2, offset:16, borderRadius: 0.0});
        let _this = this;

        let settingsBlock;
        let settingValueBlock;

        let kSettingsBlockHeight = 48*2;
        let kSettingsBlockLabelWidth = 170*2;
        let kSettingsFieldWidth = 190*2;

        let settingsBlockDefaultOptions = {
            borderWidth: 0,
            borderRadius: 0.0, 
            contentDirection:'row', 
            justifyContent: 'start',
        };
        let settingsLabelBlockDefaultOptions = 
        {
            borderWidth: 0,
            borderRadius: 0.0,
            justifyContent: 'center', 
        };
        let settingsLabelDefaultOptions = {
            fontSize: 24, 
            fontColor: new THREE.Color(0x9f7909), 
            textAlign:'right',
            // justifyContent: 'start',
            // name: settingsStrings[i] + "_textLabel"
        };
        let settingsUpDownButtonDefaultOptions = {
            ...defaultButtonOptions, 
            width: 32, 
            height: 32,
            borderRadius: 12
        };
        let settingsValueBlockDefaultOptions = {
            borderRadius: 0.0, 
            borderWidth: 0, 
            // bestFit: 'auto', 
            justifyContent:'center'
        };
        let settingsValueTextDefaultOptions = {
            fontColor: new THREE.Color(0x9f7909)
        };

        // Round Time
        settingsBlock = settingsContainer.addVerticalLayoutSubBlock(kSettingsBlockHeight, settingsBlockDefaultOptions);
        settingsBlock.addHorizontalLayoutSubBlock(kSettingsBlockLabelWidth, settingsLabelBlockDefaultOptions).addText("Round Time:", settingsLabelDefaultOptions);
        settingsBlock.addButton(()=>{_this.onRoundTimeChanged(-30)}, settingsUpDownButtonDefaultOptions).addText("-");
        settingValueBlock = settingsBlock.addHorizontalLayoutSubBlock(kSettingsFieldWidth, settingsValueBlockDefaultOptions);
        this.roundTimeValueTextField = settingValueBlock.addText(this.formatTime(this.settings.roundTime), settingsValueTextDefaultOptions);
        settingsBlock.addButton(()=>{_this.onRoundTimeChanged(30)}, settingsUpDownButtonDefaultOptions).addText("+");

        // Rest Time
        settingsBlock = settingsContainer.addVerticalLayoutSubBlock(kSettingsBlockHeight, settingsBlockDefaultOptions);
        settingsBlock.addHorizontalLayoutSubBlock(kSettingsBlockLabelWidth, settingsLabelBlockDefaultOptions).addText("Rest Time:", settingsLabelDefaultOptions);
        settingsBlock.addButton(()=>{_this.onRestTimeChanged(-10)}, settingsUpDownButtonDefaultOptions).addText("-");
        settingValueBlock = settingsBlock.addHorizontalLayoutSubBlock(kSettingsFieldWidth, settingsValueBlockDefaultOptions);
        this.restTimeValueTextField = settingValueBlock.addText(this.formatTime(this.settings.restTime), settingsValueTextDefaultOptions);
        settingsBlock.addButton(()=>{_this.onRestTimeChanged(10)}, settingsUpDownButtonDefaultOptions).addText("+");


        // // Workout Type
        // settingsBlock = settingsContainer.addVerticalLayoutSubBlock(kSettingsBlockHeight, settingsBlockDefaultOptions);
        // settingsBlock.addHorizontalLayoutSubBlock(kSettingsBlockLabelWidth, settingsLabelBlockDefaultOptions).addText("Workout:", settingsLabelDefaultOptions);
        // settingsBlock.addButton(()=>{_this.onWorkoutTypeChanged(-1)}, settingsUpDownButtonDefaultOptions).addText("-");
        // settingValueBlock = settingsBlock.addHorizontalLayoutSubBlock(190, settingsValueBlockDefaultOptions);
        // this.workoutTypeValueTextField = settingValueBlock.addText(this.getWorkoutTypeString(this.settings.workoutType), settingsValueTextDefaultOptions);
        // settingsBlock.addButton(()=>{_this.onWorkoutTypeChanged(1)}, settingsUpDownButtonDefaultOptions).addText("+");


        // this.roundOptionsParent = settingsContainer.addVerticalLayoutSubBlock(kSettingsBlockHeight * 3);

        // Timed Round Options
        // this.timedRoundContainer = this.roundOptionsParent.addVerticalLayoutSubBlock(kSettingsBlockHeight * 3);

        // Round Count
        settingsBlock = settingsContainer.addVerticalLayoutSubBlock(kSettingsBlockHeight, settingsBlockDefaultOptions);
        settingsBlock.addHorizontalLayoutSubBlock(kSettingsBlockLabelWidth, settingsLabelBlockDefaultOptions).addText("Rounds:", settingsLabelDefaultOptions);
        settingsBlock.addButton(()=>{_this.onRoundCountChanged(-1)}, settingsUpDownButtonDefaultOptions).addText("-");
        settingValueBlock = settingsBlock.addHorizontalLayoutSubBlock(kSettingsFieldWidth, settingsValueBlockDefaultOptions);
        this.roundCountValueTextField = settingValueBlock.addText(this.settings.roundCount.toString(), settingsValueTextDefaultOptions);
        settingsBlock.addButton(()=>{_this.onRoundCountChanged(1)}, settingsUpDownButtonDefaultOptions).addText("+");

        // Bag Type
        settingsBlock = settingsContainer.addVerticalLayoutSubBlock(kSettingsBlockHeight, settingsBlockDefaultOptions);
        settingsBlock.addHorizontalLayoutSubBlock(kSettingsBlockLabelWidth, settingsLabelBlockDefaultOptions).addText("Bag Type:", settingsLabelDefaultOptions);
        settingsBlock.addButton(()=>{_this.onBagTypeChanged(-1)}, settingsUpDownButtonDefaultOptions).addText("-");
        settingValueBlock = settingsBlock.addHorizontalLayoutSubBlock(kSettingsFieldWidth, settingsValueBlockDefaultOptions);
        this.bagTypeValueTextField = settingValueBlock.addText(this.getBagTypeString(), settingsValueTextDefaultOptions);
        settingsBlock.addButton(()=>{_this.onBagTypeChanged(1)}, settingsUpDownButtonDefaultOptions).addText("+");

        // Swap Bag
        settingsBlock = settingsContainer.addVerticalLayoutSubBlock(kSettingsBlockHeight, settingsBlockDefaultOptions);
        settingsBlock.addHorizontalLayoutSubBlock(kSettingsBlockLabelWidth, settingsLabelBlockDefaultOptions).addText("Swap Bag:", settingsLabelDefaultOptions);
        settingsBlock.addButton(()=>{_this.onSwapBagChanged()}, settingsUpDownButtonDefaultOptions).addText("-");
        settingValueBlock = settingsBlock.addHorizontalLayoutSubBlock(kSettingsFieldWidth, settingsValueBlockDefaultOptions);
        this.swapBagValueTextField = settingValueBlock.addText(this.getSwapBagString(), settingsValueTextDefaultOptions);
        settingsBlock.addButton(()=>{_this.onSwapBagChanged()}, settingsUpDownButtonDefaultOptions).addText("+");

        // // Scripted Round Options

        // this.scriptedRoundContainer = this.roundOptionsParent.addVerticalLayoutSubBlock(kSettingsBlockHeight * 3);

        // // Workout Selection
        // settingsBlock = this.timedRoundContainer.addVerticalLayoutSubBlock(kSettingsBlockHeight * 3, settingsBlockDefaultOptions);
        // settingsBlock.addHorizontalLayoutSubBlock(kSettingsBlockLabelWidth, settingsLabelBlockDefaultOptions).addText("Rounds:", settingsLabelDefaultOptions);
        // settingsBlock.addButton(()=>{_this.onWorkoutSelectionChanged(-1)}, settingsUpDownButtonDefaultOptions).addText("-");
        // settingValueBlock = settingsBlock.addHorizontalLayoutSubBlock(190, settingsValueBlockDefaultOptions);
        // this.workoutSelectionValueTextField = settingValueBlock.addText(workoutData[this.settings.whichScriptedWorkout][0].uiShortText, settingsValueTextDefaultOptions);
        // settingsBlock.addButton(()=>{_this.onWorkoutSelectionChanged(1)}, settingsUpDownButtonDefaultOptions).addText("+");

        // this.roundOptionsParent.remove(this.scriptedRoundContainer);
        // this.roundOptionsParent.update(true, true, true);
        
        // Cancel / Accept
        let okCancelBlock = settingsContainer.addVerticalLayoutSubBlock(64*2, {contentDirection:'row', justifyContent:'center', borderWidth: 0});      
        okCancelBlock.addButton(()=>{_this.onSettingsCancelClicked()}, {...defaultButtonOptions, width: 150}).addText("Cancel");
        okCancelBlock.addButton(()=>{_this.onSettingsAcceptClicked()}, {...defaultButtonOptions, width: 150}).addText("Accept");



        // this.scene.add(this.settingsMenuBase);

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
        this.settings.roundTime = Math.max(30, Math.min(this.settings.roundTime + increment, 600));
        this.roundTimeValueTextField.set(
            {
                content: this.formatTime(this.settings.roundTime)
            });
    }

    onRestTimeChanged(increment)
    {
        this.settings.restTime = Math.max(10, Math.min(this.settings.restTime + increment, 90));
        this.restTimeValueTextField.set({content: this.formatTime(this.settings.restTime)});
    }

    onRoundCountChanged(increment)
    {
        this.settings.roundCount = Math.max(1, Math.min(this.settings.roundCount + increment, 16));
        this.roundCountValueTextField.set({content: this.settings.roundCount.toString()});
    }

    onBagTypeChanged(val)
    {
        this.settings.bagType = (this.settings.bagType + val + 2) % 2;
        this.bagTypeValueTextField.set({content: this.getBagTypeString()});
    }

    getBagTypeString()
    {
        if (this.settings.bagType == 0)
        {
            return "HEAVY";
        }
        else if (this.settings.bagType == 1)
        {
            return "DOUBLE-END";
        }
    }

   
    onSwapBagChanged()
    {
        this.settings.doBagSwap = !this.settings.doBagSwap;
        this.swapBagValueTextField.set({content: this.getSwapBagString()});

        // this.uiSwapBagTypeButton.innerHTML = this.getBagSwapString();
    }

    getSwapBagString()
    {
        return this.settings.doBagSwap ? "YES" : "NO"; //"&#x2713;" : "";
    }

    getWorkoutTypeString()
    {
        if (this.settings.workoutType == 0)
        {
            return "TIMED";
        }
        else if (this.settings.workoutType == 1)
        {
            return "SCRIPTED";
        }
    }

    onWorkoutTypeChanged(val)
    {
        this.settings.workoutType = (this.settings.workoutType + val + 2) % 2;
        this.workoutTypeValueTextField.set({content:this.getWorkoutTypeString()});
        // this.uiWorkoutTypeDisplay.innerHTML = this.getWorkoutTypeString();

        if (this.settings.workoutType == 0)
        {
            this.roundOptionsParent.remove(this.scriptedRoundContainer);
            this.roundOptionsParent.add(this.timedRoundContainer);
            this.roundOptionsParent.update(true, true, true);
            // this.timedRoundContainer.visible = true;
            // this.timedRoundContainer.offset = 7/512;
            
        }
        else
        {
            this.roundOptionsParent.remove(this.timedRoundContainer);
            this.roundOptionsParent.add(this.scriptedRoundContainer);
            this.roundOptionsParent.update(true, true, true);

            // this.timedRoundContainer.visible = false;
            // this.timedRoundContainer.offset = -1.0;
        }
    }

    onWorkoutSelectionChanged(val)
    {
        this.settings.whichScriptedWorkout = (this.settings.whichScriptedWorkout + val + workoutData.length) % workoutData.length;
        this.workoutSelectionValueTextField.set({content: workoutData[this.settings.whichScriptedWorkout][0].uiShortText});
    }

    onStartButtonClicked()
    {
        this.readSettings();

        this.scene.remove(this.startMenuBase);
        this.inputController.shutdown();
        
        this.boxingSession.initialize(this.settings.roundCount, this.settings.roundTime, this.settings.restTime, this.settings.bagType, this.settings.doBagSwap, this.settings.workoutType, this.settings.whichScriptedWorkout);
        this.boxingSession.startGame();
        // this.onStartCb();
    }

    onSettingsButtonClicked()
    {
        this.readSettings();

        this.originalSettings = {...this.settings}; //copy settings into originalSettings

        this.setCurrentMenu(this.settingsMenuBase);
    }

    onSettingsCancelClicked()
    {
        this.settings = this.originalSettings;
        this.setCurrentMenu(this.startMenuBase);
    }

    onSettingsAcceptClicked()
    {
        this.writeSettings();
        this.setCurrentMenu(this.startMenuBase);
    }

    writeSettings()
    {
        window.localStorage.setItem("cfg_roundTime", this.settings.roundTime);
        window.localStorage.setItem("cfg_roundCount", this.settings.roundCount);
        window.localStorage.setItem("cfg_restTime", this.settings.restTime);
        window.localStorage.setItem("cfg_bagType", this.settings.bagType);
        window.localStorage.setItem("cfg_bagSwap", this.settings.doBagSwap ? 1 : 0);
        window.localStorage.setItem("cfg_workoutType", this.settings.workoutType);
        // window.localStorage.setItem("cfg_scriptedWorkoutId", workoutData[this.whichScriptedWorkout][0].uid);

    }
    readSettings()
    {
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
            window.localStorage.setItem("cfg_arMode", this.arMode ? 1 : 0)
        }
        else
        {
            let val;
            val = window.localStorage.getItem("cfg_roundTime");
            if (val)
            {
                this.settings.roundTime = parseInt(val);
            }

            val = window.localStorage.getItem("cfg_roundCount");
            if (val)
            {
                this.settings.roundCount = parseInt(val);
            }

            val = window.localStorage.getItem("cfg_restTime");
            if (val)
            {
                this.settings.restTime = parseInt(val);
            }

            val = window.localStorage.getItem("cfg_bagType");
            if (val)
            {
                this.settings.bagType = parseInt(val);
            }

            val = window.localStorage.getItem("cfg_bagSwap");
            if (val)
            {
                this.settings.doBagSwap = (parseInt(val) == 1);
            }
            
            val = window.localStorage.getItem("cfg_workoutType")
            if (val)
            {
                this.settings.workoutType = parseInt(val);
            }
            
            // val = window.localStorage.getItem("cfg_scriptedWorkoutId");
            // if (val)
            // {
            //     let matchCfgId = (element) => element[0].uid == val;
            //     let matchedIndex = workoutData.findIndex(matchCfgId);
            //     if (matchedIndex < 0)
            //     {
            //         //failed to match
            //         this.whichScriptedWorkout = 0;
            //     }
            //     else
            //     {
            //         this.whichScriptedWorkout = matchedIndex;
            //     }
            // }

            // val = window.localStorage.getItem("cfg_arMode");
            // if (val)
            // {
            //     this.arMode = false; //(parseInt(val) == 1);
            // }
        }
    }

    update(dt)
    {
        ThreeMeshUI.update();
        this.inputController.update(dt, this.currentMenu);
    }
}