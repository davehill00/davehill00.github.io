import ThreeMeshUI from 'three-mesh-ui'
import { justifyContent } from 'three-mesh-ui/src/utils/block-layout/JustifyContent';
// import {CanvasTexture} from 'three/examples/jsm/interactive/HTMLMesh';

import html2canvas from 'html2canvas';
import {UIPanel} from './uiPanel.js';

import {gControllers} from './box.js';
// import { contentDirection } from 'three-mesh-ui/src/utils/block-layout/ContentDirection.js';

let logoTexture = new THREE.TextureLoader().load("./content/heavy_bag_trainer_logo.png");

function generateLinearGradient() {
    var canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;

    var ctx = canvas.getContext('2d');

    var gradient = ctx.createLinearGradient(0, 0, 0, 64);
    gradient.addColorStop(0, 'black');
    gradient.addColorStop(1, 'white');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    return canvas;
}

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
        };




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
        this.startMenuBase = new UIPanel(512, 512, {
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
            margin: 8
        });

        let _this = this;
        this.startMenuBase.addButton(()=>{_this.onStartButtonClicked()}, {...defaultButtonOptions, borderWidth: 6, height: 56, name: "StartButton"})
            .addText("START", {...defaultButtonTextOptions, fontSize: 40});
        
        this.startMenuBase.addButton(()=>{_this.onSettingsButtonClicked()}, {...defaultButtonOptions, name: "SettingsButton"}).addText("Settings");

        // this.scene.add(this.startMenuBase);

        this.startMenuBase.position.y = 1.5;
        this.startMenuBase.position.z = -1.2;
    }

    createSettingsMenu()
    {
        this.settingsMenuBase = new UIPanel(512, 512, {
            fontFamily: './content/ROCKB.TTF-msdf.json',
            fontTexture: './content/ROCKBTTF.png',
            contentDirection: 'column',
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


        let settingsContainer = this.settingsMenuBase.addHorizontalLayoutSubBlock(512-64, {borderWidth: 2, offset:16, borderRadius: 0.0});
        let _this = this;

        let settingsBlock;
        let settingValueBlock;

        let kSettingsBlockHeight = 48;
        let kSettingsBlockLabelWidth = 170;
        let kSettingsUpDownSize = 32;

        let settingsBlockDefaultOptions = {
            borderWidth: 1,
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
        settingValueBlock = settingsBlock.addHorizontalLayoutSubBlock(190, settingsValueBlockDefaultOptions);
        this.roundTimeValueTextField = settingValueBlock.addText(this.formatTime(this.settings.roundTime), settingsValueTextDefaultOptions);
        settingsBlock.addButton(()=>{_this.onRoundTimeChanged(30)}, settingsUpDownButtonDefaultOptions).addText("+");

        // Rest Time
        settingsBlock = settingsContainer.addVerticalLayoutSubBlock(kSettingsBlockHeight, settingsBlockDefaultOptions);
        settingsBlock.addHorizontalLayoutSubBlock(kSettingsBlockLabelWidth, settingsLabelBlockDefaultOptions).addText("Rest Time:", settingsLabelDefaultOptions);
        settingsBlock.addButton(()=>{_this.onRestTimeChanged(-10)}, settingsUpDownButtonDefaultOptions).addText("-");
        settingValueBlock = settingsBlock.addHorizontalLayoutSubBlock(190, settingsValueBlockDefaultOptions);
        this.restTimeValueTextField = settingValueBlock.addText(this.formatTime(this.settings.restTime), settingsValueTextDefaultOptions);
        settingsBlock.addButton(()=>{_this.onRestTimeChanged(10)}, settingsUpDownButtonDefaultOptions).addText("+");

        // Round Count
        settingsBlock = settingsContainer.addVerticalLayoutSubBlock(kSettingsBlockHeight, settingsBlockDefaultOptions);
        settingsBlock.addHorizontalLayoutSubBlock(kSettingsBlockLabelWidth, settingsLabelBlockDefaultOptions).addText("Rounds:", settingsLabelDefaultOptions);
        settingsBlock.addButton(()=>{_this.onRoundCountChanged(-1)}, settingsUpDownButtonDefaultOptions).addText("-");
        settingValueBlock = settingsBlock.addHorizontalLayoutSubBlock(190, settingsValueBlockDefaultOptions);
        this.roundCountValueTextField = settingValueBlock.addText(this.settings.roundCount.toString(), settingsValueTextDefaultOptions);
        settingsBlock.addButton(()=>{_this.onRoundCountChanged(1)}, settingsUpDownButtonDefaultOptions).addText("+");

        // Bag Type
        settingsBlock = settingsContainer.addVerticalLayoutSubBlock(kSettingsBlockHeight, settingsBlockDefaultOptions);
        settingsBlock.addHorizontalLayoutSubBlock(kSettingsBlockLabelWidth, settingsLabelBlockDefaultOptions).addText("Bag Type:", settingsLabelDefaultOptions);
        settingsBlock.addButton(()=>{_this.onBagTypeChanged(-1)}, settingsUpDownButtonDefaultOptions).addText("-");
        settingValueBlock = settingsBlock.addHorizontalLayoutSubBlock(190, settingsValueBlockDefaultOptions);
        this.bagTypeValueTextField = settingValueBlock.addText(this.getBagTypeString(), settingsValueTextDefaultOptions);
        settingsBlock.addButton(()=>{_this.onBagTypeChanged(1)}, settingsUpDownButtonDefaultOptions).addText("+");

        // Cancel / Accept
        let okCancelBlock = settingsContainer.addVerticalLayoutSubBlock(64, {contentDirection:'row', justifyContent:'center', borderWidth: 0});      
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

    onStartButtonClicked()
    {
        this.scene.remove(this.startMenuBase);
        this.inputController.shutdown();
        
        this.onStartCb();
    }

    onSettingsButtonClicked()
    {
        this.setCurrentMenu(this.settingsMenuBase);
    }

    onSettingsCancelClicked()
    {
        this.setCurrentMenu(this.startMenuBase);
    }
    onSettingsAcceptClicked()
    {
        this.setCurrentMenu(this.startMenuBase);
    }

    OLDcreateSettingsMenu()
    {
        const kOffset = 0.0001;

        const workoutMenuBase = new ThreeMeshUI.Block({
            width: 0.85,
            height: 0.5,
            fontFamily: './content/ROCKB.TTF-msdf.json',
            fontTexture: './content/ROCKBTTF.png',
            contentDirection: 'column',
            // justifyContent: 'space-between',
            backgroundOpacity: 1.0,
            backgroundColor: new THREE.Color(0x000000),
            padding: 0.025,
            offset: 0,
            borderWidth: 0.004,
            borderColor: new THREE.Color( 0x9f7909 ),
            borderRadius: 0.0,
            
        });

        const workoutSettingsContainer = new ThreeMeshUI.Block({
            width: 0.8,
            height: 0.45,
            // padding: 0.01,
            justifyContent: 'space-between',
            offset: kOffset,
            borderWidth: 0.0,
            borderOpacity: 0.0,
            backgroundColor: new THREE.Color(0x000000),
            backgroundOpacity: 1.0,
        })


        let settingsStrings = [
            "Round Time",
            "Rest Time", 
            // "Workout",
            "Rounds",
            "Bag Type",
            "Swap Bag Each Round"

        ];


        for (let i = 0; i < settingsStrings.length; i++)
        {
            let itemContainer = new ThreeMeshUI.Block({
                width: 0.7,
                height: 0.05,
                justifyContent: 'start',
                backgroundColor: new THREE.Color(0x000000),
                backgroundOpacity: 1.0,
                contentDirection: 'row',
                offset: kOffset,
                // margin: 0.03
            });


            let labelBlock = new ThreeMeshUI.Block({
                width: 0.3,
                height: 0.04,
                bestFit: 'auto',
                justifyContent: 'start',
                alignItems: 'start',
                offset: kOffset,
                backgroundColor: new THREE.Color(0x000000),
                backgroundOpacity: 1.0,
            });
            let label = new ThreeMeshUI.Text({
                content: settingsStrings[i],
                fontColor: new THREE.Color(0x9f7909),
                textAlign: 'left',
                justifyContent: 'start',
                offset: kOffset,
            });
            labelBlock.add(label);

            let downButton = new ThreeMeshUI.Block({
                width: 0.04,
                height: 0.04,
                backgroundColor: new THREE.Color(0x000000),
                backgroundOpacity: 0.25,
                bestFit: 'auto',
                offset: kOffset,
                // borderRadius: 0.02,
                borderWidth: 0.002,
                borderOpacity: 1.0,
            });

            let minusText = new ThreeMeshUI.Text({
                content:"-",
                fontColor: new THREE.Color(0x9f7909),
                offset: kOffset,
            });
            downButton.add(minusText);


            let setting = new ThreeMeshUI.Block({
                width: 0.3,
                height: 0.04,
                backgroundColor: new THREE.Color(0x00ffff),
                backgroundOpacity: 0.25,
                bestFit: 'auto',
                offset: kOffset,
            })

            let upButton = new ThreeMeshUI.Block({
                width: 0.04,
                height: 0.04,
                backgroundColor: new THREE.Color(0x000000),
                backgroundOpacity: 0.25,
                bestFit: 'auto',
                offset: kOffset,
                // borderRadius: 0.02,
                borderWidth: 0.002,
                borderOpacity: 1.0,
            });
            let upText = new ThreeMeshUI.Text({
                content:"+",
                fontColor: new THREE.Color(0x9f7909),
                offset: kOffset,
            });
            upButton.add(upText);

            itemContainer.add(labelBlock, downButton, setting, upButton);
            // itemContainer.add(downButton);
            // itemContainer.add(setting);
            // itemContainer.add(upButton);

            workoutSettingsContainer.add(itemContainer);
        }

        let acceptCancelContainer = new ThreeMeshUI.Block({
            width: 0.7,
            height: 0.04,
            contentDirection: 'row',
            justifyContent: 'space-around',
            backgroundColor: new THREE.Color(0x000000),
            backgroundOpacity: 1.0,
            offset: kOffset,
        });
        let acceptButton = new ThreeMeshUI.Block({
            width: 0.2,
            height: 0.04,
            bestFit: 'auto',
            offset: kOffset,
            borderWidth: 0.002,
            borderOpacity: 1.0,
            backgroundColor: new THREE.Color(0x000000),
            backgroundOpacity: 1.0,
        });
        let acceptText = new ThreeMeshUI.Text({
            content:"Accept",
            fontColor: new THREE.Color(0x9f7909),
            offset: kOffset,
        });
        acceptButton.add(acceptText);

        let cancelButton = new ThreeMeshUI.Block({
            width: 0.2,
            height: 0.04,
            bestFit: 'auto',
            offset: kOffset,
            borderWidth: 0.002,
            borderOpacity: 1.0,
            backgroundColor: new THREE.Color(0x000000),
            backgroundOpacity: 1.0,
        });
        let cancelText = new ThreeMeshUI.Text({
            content:"Cancel",
            fontColor: new THREE.Color(0x9f7909),
            offset: kOffset,
        });
        cancelButton.add(cancelText);

        acceptCancelContainer.add(cancelButton, acceptButton);

        workoutSettingsContainer.add(acceptCancelContainer);

        workoutMenuBase.add(workoutSettingsContainer);


        this.scene.add(workoutMenuBase);
        workoutMenuBase.position.y = 1.5;
        workoutMenuBase.position.z = -0.1;



        // const container = new ThreeMeshUI.Block({
        //     width: 1.0,
        //     height: 0.6,
        //     padding: 0.2,
        //     fontFamily: './content/ROCKB.TTF-msdf.json',
        //     fontTexture: './content/ROCKBTTF.png',
        //     borderRadius: 0.0
        //    });
        // // container.position.z = -0.1;
        // // container.position.y = 1.5;
           
        // const startButton = new ThreeMeshUI.Block({
        //     width: 0.4,
        //     height: 0.2,
        //     padding: 0.01,
        //     backgroundColor: new THREE.Color(0xffff00),
        //     backgroundOpacity: 0.25

        // });


        // const anotherBlock = new ThreeMeshUI.Block({
        //     width: 0.7,
        //     height: 0.3,
        //     backgroundColor: new THREE.Color(0x00ffff),
        //     backgroundOpacity: 0.25
        // });


        //    //
           
        //    const text = new ThreeMeshUI.Text({
        //     content: "Some text to be displayed",
        //     fontColor: new THREE.Color(0xff00ff),
        //    });

        //    container.add(startButton, anotherBlock);
        //    anotherBlock.add(text);
           
        //    // scene is a THREE.Scene (see three.js)
        //    this.scene.add( container );
    }

    update(dt)
    {
        ThreeMeshUI.update();
        this.inputController.update(dt, this.currentMenu);
    }
}