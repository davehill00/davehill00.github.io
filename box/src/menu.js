import ThreeMeshUI from 'three-mesh-ui'
import {workoutData} from "./workoutData.js";

import { justifyContent } from 'three-mesh-ui/src/utils/block-layout/JustifyContent';
// import {CanvasTexture} from 'three/examples/jsm/interactive/HTMLMesh';

import html2canvas from 'html2canvas';
import {UIPanel} from './uiPanel.js';

import {gControllers, getSfxVolume, setSfxVolume, EndWebXRSession} from './box.js';
import { TextBox } from './textBox.js';
import { MultiInstanceSound } from './multiBufferSound.js';

// import { contentDirection } from 'three-mesh-ui/src/utils/block-layout/ContentDirection.js';

// let logoTexture = new THREE.TextureLoader().load("./content/heavy_bag_trainer_logo.png");


// FONT TEXTURE STRING:
// ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*(),.<>  /?;:'"\|`~-_=+[]{}•

let dotTexture = new THREE.TextureLoader().load("./content/small_dot.png");
let clearColor = new THREE.Color(0x000000);

let _x = new THREE.Vector3();
let _y = new THREE.Vector3();
let _z = new THREE.Vector3();
let kZeroVector = new THREE.Vector3(0,0,0);

let _intersection = {};

let worldToLocal = new THREE.Matrix4();

let worldHit = [];

class MenuInputController
{
    constructor(scene)
    {
        this.scene = scene;
        this.active = false;

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
        this.callbacks = [];
        let cb = (index, targetRaySpace, gripSpace, gamepad, model) => {
            console.log("MENU: ControllerConnected CB - LEFT")
            _this.setupInputController(_this.leftInputController, targetRaySpace, gripSpace, gamepad, model);

        };
        this.callbacks.push(cb);
        gControllers.leftControllerConnectedCallbacks.push(cb);
        
        cb = (index, targetRaySpace, gripSpace, gamepad, model) => {
            console.log("MENU: ControllerConnected CB - RIGHT")
            _this.setupInputController(_this.rightInputController, targetRaySpace, gripSpace, gamepad, model);
        }
        this.callbacks.push(cb);
        gControllers.rightControllerConnectedCallbacks.push(cb);


        cb = () => {
            console.log("MENU: ControllerDisconnected CB - LEFT")
            _this.wrapupInputController(_this.leftInputController);
        };
        this.callbacks.push(cb);
        gControllers.leftControllerDisconnectedCallbacks.push(cb);

        cb = () => {
            console.log("MENU: ControllerDisconnected CB - RIGHT")
            _this.wrapupInputController(_this.rightInputController);
        };
        this.callbacks.push(cb);
        gControllers.rightControllerDisconnectedCallbacks.push();
    }

    shutdown()
    {
        // this.scene.remove(this.leftInputController.targetRaySpace);
        // this.scene.remove(this.leftInputController.gripSpace);
        // this.scene.remove(this.rightInputController.targetRaySpace);
        // this.scene.remove(this.rightInputController.gripSpace);

        let index;
        index = gControllers.leftControllerConnectedCallbacks.indexOf(this.callbacks[0]); 
        gControllers.leftControllerConnectedCallbacks.splice(index, 1);

        index = gControllers.rightControllerConnectedCallbacks.indexOf(this.callbacks[1]); 
        gControllers.rightControllerConnectedCallbacks.splice(index, 1);

        index = gControllers.leftControllerDisconnectedCallbacks.indexOf(this.callbacks[2]); 
        gControllers.leftControllerDisconnectedCallbacks.splice(index, 1);

        index = gControllers.rightControllerDisconnectedCallbacks.indexOf(this.callbacks[3]); 
        gControllers.rightControllerDisconnectedCallbacks.splice(index, 1);
        
        // gControllers.rightControllerConnectedCallbacks.remove(this.callbacks[1]);
        // gControllers.leftControllerDisconnectedCallbacks.remove(this.callbacks[2]);
        // gControllers.rightControllerDisconnectedCallbacks.remove(this.callbacks[3]);

        // this.leftInputController.model.visible = false;
        // this.leftInputController.targetRaySpace.visible = false;
        if (this.leftInputController  )
        {
            if (this.leftInputController.targetRaySpace) 
            {
                this.leftInputController.targetRaySpace.traverse( (obj)=>{obj.visible = false});
            }
            if (this.leftInputController.gripSpace)
            {
                this.leftInputController.gripSpace.traverse( (obj)=>{obj.visible = false});
            }
        }
        
        if (this.rightInputController  )
        {
            if (this.rightInputController.targetRaySpace) 
            {
                this.rightInputController.targetRaySpace.traverse( (obj)=>{obj.visible = false});
            }
            if (this.rightInputController.gripSpace)
            {
                this.rightInputController.gripSpace.traverse( (obj)=>{obj.visible = false});
            }
        }

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
        let rayMaterial = new THREE.MeshBasicMaterial({color: 0xffffff, transparent: true, opacity: 1.0});
        rayMaterial.customProgramCacheKey = function() { return 'ray_material'; };

        rayMaterial.onBeforeCompile = (shader) => {
            shader.vertexShader = shader.vertexShader.replace(
                "#include <clipping_planes_pars_vertex>",
                `#include <clipping_planes_pars_vertex>
                varying vec3 vLocalPosition;
                `
            )
            .replace(
                "#include <begin_vertex>",
                `#include <begin_vertex>
                vLocalPosition = position;`
            );

            // console.log("VERTEX SHADER----");
            // console.log(shader.vertexShader);


            shader.fragmentShader = shader.fragmentShader.replace(
                "#include <dithering_pars_fragment>",
                `#include <dithering_pars_fragment>
                varying vec3 vLocalPosition;`
            )
            .replace(
                "vec4 diffuseColor = vec4( diffuse, opacity );",
                `vec4 diffuseColor = vec4( diffuse, opacity );
                diffuseColor.a = smoothstep(1.0, 0.0, 
                    saturate( (vLocalPosition.z + -0.05)/(-0.2) ) ); //0.25 + vLocalPosition.z saturate(vLocalPosition.z + 0.2), (vLocalPosition.z < -0.2) ? 0.5 : 1.0;
                `
            )
            // console.log("FRAGMENT SHADER----");
            // console.log(shader.fragmentShader);
        }
        let ray = new THREE.Mesh(
            new THREE.BoxGeometry(kWidth, kWidth, 2.0 * halfLength),
            // new THREE.MeshBasicMaterial({color: 0xffffff})
            rayMaterial
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
            new THREE.PlaneGeometry(kWidth*4, kWidth*4), //, kWidth),
            new THREE.MeshBasicMaterial({color: 0xffffff, map: dotTexture, transparent: true})
        );
        controller.gripSpace.add(dot);
        
        controller.contactDot = dot;
        dot.visible = false;


        controller.raycaster = new THREE.Raycaster();
        controller.raycaster.layers.set(0);
      
        this.leftHits = [];
        this.rightHits = [];       
    }

    enable()
    {
        this.active = true;
        this.leftInputController.visible = true;
        this.rightInputController.visible = true;

        if (this.leftInputController  )
        {
            if (this.leftInputController.targetRaySpace) 
            {
                this.leftInputController.targetRaySpace.traverse( (obj)=>{obj.visible = true});
            }
            if (this.leftInputController.gripSpace)
            {
                this.leftInputController.gripSpace.traverse( (obj)=>{obj.visible = true});
            }
        }
        
        if (this.rightInputController  )
        {
            if (this.rightInputController.targetRaySpace) 
            {
                this.rightInputController.targetRaySpace.traverse( (obj)=>{obj.visible = true});
            }
            if (this.rightInputController.gripSpace)
            {
                this.rightInputController.gripSpace.traverse( (obj)=>{obj.visible = true});
            }
        }
    }
    disable()
    {
        this.active = false;
        this.leftInputController.visible = false;
        this.rightInputController.visible = false;


        if (this.leftInputController  )
        {
            if (this.leftInputController.targetRaySpace) 
            {
                this.leftInputController.targetRaySpace.traverse( (obj)=>{obj.visible = false});
            }
            if (this.leftInputController.gripSpace)
            {
                this.leftInputController.gripSpace.traverse( (obj)=>{obj.visible = false});
            }
        }
        
        if (this.rightInputController  )
        {
            if (this.rightInputController.targetRaySpace) 
            {
                this.rightInputController.targetRaySpace.traverse( (obj)=>{obj.visible = false});
            }
            if (this.rightInputController.gripSpace)
            {
                this.rightInputController.gripSpace.traverse( (obj)=>{obj.visible = false});
            }
        }
        
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

    onSessionStart(session)
    {

        session.target.getSession().addEventListener("select", this.onSelect)
    }

    update(dt, menu, worldGeo)
    {
        if (!this.active)
            return;

        if (this.leftInputController && this.leftInputController.model && !this.leftInputController.envMapSet)
        {
            this.leftInputController.model.traverse( (child) => {
                if(child.isMesh)
                {
                    child.material.envMapIntensity = 0.25;
                }
            } );
            this.leftInputController.envMapSet = true;
        }
        if (this.rightInputController && this.rightInputController.model && !this.rightInputController.envMapSet)
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
        if (this.rightInputController && this.leftInputController)
        {
            this.doControllerHitCheck(this.leftInputController, worldGeo, interactables);
            this.doControllerHitCheck(this.rightInputController, worldGeo, interactables);

            this.doControllerInput(this.leftInputController);
            this.doControllerInput(this.rightInputController);
        }

    }

    doControllerHitCheck(inputController, worldGeo, interactables)
    {
        if (inputController.isSetUp)
        {
            let from = inputController.gripSpace.position;
            inputController.gripSpace.matrixWorld.extractBasis(_x, _y, _z);
            let dir = _z;
            dir.negate();
            inputController.raycaster.set(from, dir);

            

            worldHit.length = 0;
            inputController.raycaster.intersectObject(worldGeo, false, worldHit)
            if (worldHit.length > 0)
            {

                // set the contact dot
                inputController.contactDot.position.z = -worldHit[0].distance + 0.02;
                inputController.contactDot.visible = true;
                
                // translate world hit into panel space (i.e., local space on the world geo)
                // because worldGeo may contain a scale factor (since it's the hole-punch), create a copy without the scale before inverting it.
                worldToLocal.extractRotation(worldGeo.matrixWorld); // <-- worldGeo.matrixWorld may contain a scale factor
                worldToLocal.copyPosition(worldGeo.matrixWorld); // <-- worldGeo.matrixWorld may contain a scale factor
                
                worldToLocal.invert();
                
                _x.copy(worldHit[0].point);
                _x.applyMatrix4(worldToLocal);

                // set up ray caster to test in panel space against interactables
                _x.z += 10;
                _z.set(0,0,-1);
                inputController.raycaster.set(_x, _z);


                let prevHovered = null;
                if (inputController.hits.length > 0)
                {
                    prevHovered = inputController.hits[0].object.parent;
                    
                }
                inputController.hits.length = 0;

                inputController.raycaster.intersectObjects(interactables, false, inputController.hits);

                if (inputController.hits.length > 0)
                {
                    

                    let curHovered = inputController.hits[0].object.parent;
                    
                    if (prevHovered !== null && curHovered != prevHovered && prevHovered.isButton)
                    {
                        prevHovered.setState('idle');
                    }

                    if (curHovered != prevHovered && curHovered.isButton)
                    {
                        curHovered.setState('hovered');
                        if (inputController.gamepad != null && inputController.gamepad.hapticActuators != null)
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
            else
            {
                inputController.contactDot.visible = false;
            }
        }
    }

    doControllerInput(controller, forceSelect = false)
    {
        if (controller.isSetUp)
        {
            if (controller.gamepad !== null &&
                controller.gamepad.buttons != null &&
                (controller.gamepad.buttons[0].value > 0.25 ||
                    controller.gamepad.buttons[4].pressed))
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

    onSelect(data)
    {
        console.log("ON SELECT EVENT")
        console.log(data);

        if (data && data.inputSource && data.inputSource.profiles.includes('generic-hand'))
        {
            if (data.inputSource.handedness == "right")
            {
                this.doControllerInput(this.rightInputController, true);
            }
            else if (data.inputSource.handedness == "left")
            {
                this.doControllerInput(this.leftInputController, true);
            }
            else
            {
                console.log("UNKNOWN input source")
            }
        }
    }
}

let defaultButtonOptions = {
    width: 256,
    height: 48,
    borderRadius: 0.0,
    borderWidth: 0,
    backgroundColor: new THREE.Color(0x000000),
    hoverColor: new THREE.Color(0x332703),
    fontColor: new THREE.Color(0x9f7909),
    fontHoverColor: new THREE.Color(0xa67f0a),
    margin: 0
}
let defaultButtonTextOptions = {
    fontSize: 28,
}

let defaultTextOptions = {
    fontColor: new THREE.Color(0x9f7909)
}

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
    borderRadius: 0,
    borderWidth: 0,
    backgroundOpacity: 0.0,
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

export class MainMenu
{
    constructor(scene, renderer, pageUI, musicManager)
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
            sfxVolume: 0.8,
            musicVolume: musicManager.getMusicVolume(),
            doBagSwap: false,
        };

        // this.sfxVolumeAdjustSound = new THREE.PositionalAudio(musicManager.audioListener);
        // this.sfxVolumeAdjustSound.setRefDistance(40.0);
        // this.sfxVolumeAdjustSound.setVolume(1.0);
        // new THREE.AudioLoader().load(
        //     "./content/trim-Punch-Kick-A1-www.fesliyanstudios.com.mp3",
        //     (buffer) => { this.sfxVolumeAdjustSound.buffer = buffer; }
        // )

        this.sfxVolumeAdjustSound = new MultiInstanceSound(musicManager.audioListener, 3, ['./content/trim-Punch-Kick-A1-www.fesliyanstudios.com.mp3']);

        this.musicManager = musicManager;
        this.renderer = renderer;
        this.uiQuadLayerHolePunch = new THREE.Mesh(
            new THREE.PlaneGeometry(1.0, 0.85),
            new THREE.MeshBasicMaterial(
                {
                    colorWrite: false,
                }
            )
        );
        this.uiQuadLayerHolePunch.position.set(0.0, 1.5, -1.2);
        this.uiQuadLayer = null;
        this.uiQuadLayerHolePunch.add(this.sfxVolumeAdjustSound);
        
        this.uiQuadScene = new THREE.Scene();
        this.uiQuadCamera = new THREE.OrthographicCamera(-1.0, 1.0, 0.75, -0.75, 0.1, 100);
        this.uiQuadScene.add(this.uiQuadCamera);


        console.log("READ MENU SETTINGS");
        this.readSettings();
        
        this.createSimpleStartMenu();
        this.createAudioSettingsMenu();
        this.createTwoOptionDialog();
        // this.createSettingsMenu();
        this.setCurrentMenu(this.startMenuBase);
    }

    onSessionStart(session)
    {
        this.uiQuadLayer = this.renderer.xr.createQuadLayer(2048, 2*1024*0.85, 1.0, 0.75);
        this.uiQuadLayer.layer.transform = new XRRigidTransform(this.uiQuadLayerHolePunch.position, this.uiQuadLayerHolePunch.quaternion);

        this.inputController.onSessionStart(session)
    }

    show()
    {
        this.scene.add(this.uiQuadLayerHolePunch);
        this.renderer.xr.registerQuadLayer(this.uiQuadLayer, -2);
        console.assert(this.uiQuadCamera != null);
        this.doRenderLoop = true;
        this.inputController.enable();
    }

    hide()
    {
        this.scene.remove(this.uiQuadLayerHolePunch);
        this.renderer.xr.unregisterQuadLayer(this.uiQuadLayer);
        this.doRenderLoop = false;
        this.inputController.disable();
    }

    setCurrentMenu(menu, addToScene = true)
    {
        if (this.currentMenu)
        {
            this.uiQuadScene.remove(this.currentMenu);
        }
        if (addToScene)
        {
            this.uiQuadScene.add(menu);
        }
        this.currentMenu = menu;
    }

    createSimpleStartMenu()
    {
        this.startMenuBase = new UIPanel(1024, 1024*0.85, {
            fontFamily: './content/ROCKB.TTF-msdf.json',
            fontTexture: './content/ROCKBTTF.png',
            contentDirection: 'column',
            // justifyContent: 'top', //space-between',
            backgroundOpacity: 1.0,
            backgroundColor: new THREE.Color(0x9f7909),
            padding: 8,
            // offset: 0,
            borderWidth: 0,
            // borderColor: new THREE.Color( 0x9f7909 ),
            borderRadius: 0.0,
        });
        
        if (true)
        {
            let backplate = this.startMenuBase.addHorizontalLayoutSubBlock(1.0, {backgroundColor: new THREE.Color(0x000000), offset: 16, borderRadius: 0.0, backgroundOpacity: 1.0, padding: 8});

            backplate.addImage("./content/heavy_bag_trainer_logo.png", {
                width: 380,
                height: 190,
                margin: 8,
                // offset: 15/512,
            });

            let _this = this;
            backplate
                .addVerticalLayoutSubBlock((56+8+8)*2, {borderRadius: 0.0, padding: 0, margin: 0})
                .addHorizontalLayoutSubBlock((256+8+8)*2, {backgroundColor: new THREE.Color(0x9f7909), borderRadius: 0.0, backgroundOpacity: 1.0, offset: 16, padding: 8, margin: 0})
                .addButton(()=>{_this.onStartButtonClicked()}, {...defaultButtonOptions, borderWidth: 0, height: 56, name: "StartButton", margin: 0})
                .addText("START", {...defaultButtonTextOptions, fontSize: 40});
            

                
            let settingsContainer = backplate
                .addVerticalLayoutSubBlock((56+6+6)*2, {borderRadius: 0.0, padding: 6, margin: 0})
                .addHorizontalLayoutSubBlock((260+6+6)*2, {backgroundColor: new THREE.Color(0x000000), borderRadius: 0.0, backgroundOpacity: 1.0, offset: 16, padding: 0, margin: 0, contentDirection: 'row'});

            settingsContainer
                .addHorizontalLayoutSubBlock(40*2, {backgroundColor: new THREE.Color(0x0040ff), backgroundOpacity: 0.0, margin: 0.0, padding: 0.0, offset: 8})
                .addVerticalLayoutSubBlock(56*2, {backgroundColor: new THREE.Color(0x9f7909), backgroundOpacity: 1.0, margin: 0.0, padding: 0.0, offset: 8, justifyContent: 'center'})
                .addButton(()=>{_this.onWorkoutTypeChanged(-1)}, {
                    ...defaultButtonOptions, 
                    width: 32, 
                    height: 50,
                    borderRadius: 0,
                    borderWidth: 0,
                    backgroundOpacity: 0.0,
                }).addText("<");

            settingsContainer.addHorizontalLayoutSubBlock(4, {backgroundColor: new THREE.Color(0x000000)});

            let workoutTypeButton = settingsContainer
                .addHorizontalLayoutSubBlock((180+4+4)*2, {backgroundColor: new THREE.Color(0xff00ff), borderRadius: 0.0, backgroundOpacity: 1.0, offset: 16, padding: 0, margin: 0, contentDirection: 'row'})
                .addVerticalLayoutSubBlock(56*2, {backgroundColor: new THREE.Color(0x9f7909), backgroundOpacity: 1.0, margin: 0.0, padding: 0.0, offset: 8, justifyContent: 'center'})
                .addButton(()=>{_this.onSettingsButtonClicked()}, {...defaultButtonOptions, name: "SettingsButton", height: 50, width: 180});
            this.workoutTypeValueTextField = workoutTypeButton.addText(this.getMatchConfigString(), {...defaultButtonTextOptions, fontSize: 16});

            settingsContainer.addHorizontalLayoutSubBlock(4, {backgroundColor: new THREE.Color(0x000000)});

            settingsContainer
                .addHorizontalLayoutSubBlock(40*2, {backgroundColor: new THREE.Color(0x0040ff), backgroundOpacity: 0.0, margin: 0.0, padding: 0.0, offset: 8})
                .addVerticalLayoutSubBlock(56*2, {backgroundColor: new THREE.Color(0x9f7909), backgroundOpacity: 1.0, margin: 0.0, padding: 0.0, offset: 8, justifyContent: 'center'})
                .addButton(()=>{_this.onWorkoutTypeChanged(1)}, {
                    ...defaultButtonOptions, 
                    width: 32, 
                    height: 50,
                    borderRadius: 0,
                    borderWidth: 0,
                    backgroundOpacity: 0.0,
                }).addText(">");

            let audioSettingsContainer = backplate
            .addVerticalLayoutSubBlock((24+6+6)*2, {borderRadius: 0.0, padding: 6, margin: 0})
            .addHorizontalLayoutSubBlock((176+6+6)*2, {backgroundColor: new THREE.Color(0x000000), borderRadius: 0.0, backgroundOpacity: 1.0, offset: 16, padding: 0, margin: 0, contentDirection: 'row'});

            let audioButton = audioSettingsContainer
                .addHorizontalLayoutSubBlock((176+6+6)*2, {backgroundColor: new THREE.Color(0xff00ff), borderRadius: 0.0, backgroundOpacity: 1.0, offset: 16, padding: 0, margin: 0, contentDirection: 'row'})
                .addVerticalLayoutSubBlock(38*2, {backgroundColor: new THREE.Color(0x9f7909), backgroundOpacity: 1.0, margin: 0.0, padding: 0.0, offset: 8, justifyContent: 'center'})
                .addButton(()=>{_this.onAudioSettingsButtonClicked()}, {...defaultButtonOptions, name: "AudioSettingsButton", height: 30, width: 184-4});
                audioButton.addText("Audio Options", {...defaultButtonTextOptions, fontSize: 16});
            
        }

        // this.startMenuBase.position.y = 1.5;
        this.startMenuBase.position.z = -0.5;
    }

    createSettingsMenu()
    {
        this.settingsMenuBase = new UIPanel(1024, 768, {
            fontFamily: './content/ROCKB.TTF-msdf.json',
            fontTexture: './content/ROCKBTTF.png',
            // contentDirection: 'column',
            // justifyContent: 'top', //space-between',
            backgroundOpacity: 1.0,
            backgroundColor: new THREE.Color(0x9f7909),
            padding: 8,
            // padding: 32,
            // offset: 0,
            borderWidth: 0,
            // borderColor: new THREE.Color( 0x9f7909 ),
            fontColor: new THREE.Color( 0x9f7909 ),
            borderRadius: 0.0,
            name: "SettingsMenu Base",
            margin: 0
        });
        this.settingsMenuBase.position.z = -5.5;
        this.settingsContainer = this.settingsMenuBase.addHorizontalLayoutSubBlock((1024-32), {borderWidth: 0, offset: 8, borderRadius: 0.0, margin: 0, backgroundColor: new THREE.Color(0x000000), backgroundOpacity: 1.0});

        let _this = this;

        let settingsBlock;
        let settingValueBlock;



        // Round Time
        settingsBlock = this.settingsContainer.addVerticalLayoutSubBlock(kSettingsBlockHeight, settingsBlockDefaultOptions);
        settingsBlock.addHorizontalLayoutSubBlock(kSettingsBlockLabelWidth, settingsLabelBlockDefaultOptions).addText("Round Time:", settingsLabelDefaultOptions);
        settingsBlock
            .addHorizontalLayoutSubBlock(48*2, {backgroundColor: new THREE.Color(0xff00ff), backgroundOpacity: 0.0, margin: 0.0, padding: 4.0, offset: 8})
            .addVerticalLayoutSubBlock(40*2, {backgroundColor: new THREE.Color(0x9f7909), backgroundOpacity: 1.0, margin: 0.0, padding: 4.0, offset: 8})
            .addButton(()=>{_this.onRoundTimeChanged(-30)}, settingsUpDownButtonDefaultOptions).addText("<");
        settingValueBlock = settingsBlock.addHorizontalLayoutSubBlock(kSettingsFieldWidth, settingsValueBlockDefaultOptions);
        this.roundTimeValueTextField = settingValueBlock.addText(this.formatTime(this.settings.roundTime), settingsValueTextDefaultOptions);
        settingsBlock
            .addHorizontalLayoutSubBlock(48*2, {backgroundColor: new THREE.Color(0xff00ff), backgroundOpacity: 0.0, margin: 0.0, padding: 4.0, offset: 8})
            .addVerticalLayoutSubBlock(40*2, {backgroundColor: new THREE.Color(0x9f7909), backgroundOpacity: 1.0, margin: 0.0, padding: 4.0, offset: 8})
            .addButton(()=>{_this.onRoundTimeChanged(30)}, settingsUpDownButtonDefaultOptions).addText(">");

        // Rest Time
        settingsBlock = this.settingsContainer.addVerticalLayoutSubBlock(kSettingsBlockHeight, settingsBlockDefaultOptions);
        settingsBlock.addHorizontalLayoutSubBlock(kSettingsBlockLabelWidth, settingsLabelBlockDefaultOptions).addText("Rest Time:", settingsLabelDefaultOptions);
        settingsBlock
            .addHorizontalLayoutSubBlock(48*2, {backgroundColor: new THREE.Color(0xff00ff), backgroundOpacity: 0.0, margin: 0.0, padding: 4.0, offset: 8})
            .addVerticalLayoutSubBlock(40*2, {backgroundColor: new THREE.Color(0x9f7909), backgroundOpacity: 1.0, margin: 0.0, padding: 4.0, offset: 8})
            .addButton(()=>{_this.onRestTimeChanged(-10)}, settingsUpDownButtonDefaultOptions).addText("<");
        settingValueBlock = settingsBlock.addHorizontalLayoutSubBlock(kSettingsFieldWidth, settingsValueBlockDefaultOptions);
        this.restTimeValueTextField = settingValueBlock.addText(this.formatTime(this.settings.restTime), settingsValueTextDefaultOptions);
        settingsBlock
            .addHorizontalLayoutSubBlock(48*2, {backgroundColor: new THREE.Color(0xff00ff), backgroundOpacity: 0.0, margin: 0.0, padding: 4.0, offset: 8})
            .addVerticalLayoutSubBlock(40*2, {backgroundColor: new THREE.Color(0x9f7909), backgroundOpacity: 1.0, margin: 0.0, padding: 4.0, offset: 8})
            .addButton(()=>{_this.onRestTimeChanged(10)}, settingsUpDownButtonDefaultOptions).addText(">");

        
        if (this.settings.workoutType == 0)
        {
            this.createSettingsMenuTimedRounds();
        }
        else
        {
            this.createSettingsMenuScripted();
        }



         // Cancel / Accept
         let okCancelBlock = this.settingsContainer.addVerticalLayoutSubBlock(64*2, {contentDirection:'row', justifyContent:'center', borderWidth: 0});      
         okCancelBlock
             .addHorizontalLayoutSubBlock((150+12+12)*2, {backgroundColor: new THREE.Color(0xff00ff), backgroundOpacity: 0.0, margin: 0.0, padding: 6.0, offset: 8})
             .addVerticalLayoutSubBlock((48+6+6)*2, {backgroundColor: new THREE.Color(0x9f7909), backgroundOpacity: 1.0, margin: 0.0, padding: 6.0, offset: 8})
             .addButton(()=>{_this.onSettingsCancelClicked()}, {...defaultButtonOptions, width: 150}).addText("CANCEL");
         okCancelBlock
             .addHorizontalLayoutSubBlock((150+12+12)*2, {backgroundColor: new THREE.Color(0xff00ff), backgroundOpacity: 0.0, margin: 0.0, padding: 6.0, offset: 8})
             .addVerticalLayoutSubBlock((48+6+6)*2, {backgroundColor: new THREE.Color(0x9f7909), backgroundOpacity: 1.0, margin: 0.0, padding: 6.0, offset: 8})
             .addButton(()=>{_this.onSettingsAcceptClicked()}, {...defaultButtonOptions, width: 150}).addText("ACCEPT");
 
    }

    createSettingsMenuScripted()
    {
        let _this = this;

        let settingsBlock = this.settingsContainer
            .addVerticalLayoutSubBlock(380, {backgroundColor: new THREE.Color(0x00ffff), backgroundOpacity: 0.0, contentDirection:'row', justifyContent: 'start'});
            

        settingsBlock
            .addHorizontalLayoutSubBlock((48 + 6 + 6)*2, {backgroundColor: new THREE.Color(0xff00ff), backgroundOpacity: 0.0, margin: 6, contentDirection: 'row', justifyContent: 'center'})
            .addVerticalLayoutSubBlock(350, {backgroundColor: new THREE.Color(0x9f7909), backgroundOpacity: 1.0, margin: 6, justifyContent:'center'})
            .addButton(()=>{_this.onWorkoutSelectionChanged(-1)}, {...defaultButtonOptions, width:48, height: 328/2}).addText("<");
        
        let workoutDescriptionField = settingsBlock
            .addHorizontalLayoutSubBlock(1024 - (160*2), {backgroundOpacity: 1.0, backgroundColor: new THREE.Color(0x000000)});

        this.workoutDescriptionTextBox = new TextBox(1000, "left", 0.67, "top", 0.32, 0x9f7909, "", "", false);
        this.workoutDescriptionTextBox.position.z = -1.0;
        this.workoutDescriptionTextBox.position.y = 0.00;
        this.workoutDescriptionTextBox.displayMessage(workoutData[this.settings.whichScriptedWorkout][0].introText);
        
        this.uiQuadScene.add(this.workoutDescriptionTextBox);

        settingsBlock
            .addHorizontalLayoutSubBlock((48 + 6 + 6)*2, {backgroundColor: new THREE.Color(0xff00ff), backgroundOpacity: 0.0, margin: 6, contentDirection: 'row', justifyContent: 'center'})
            .addVerticalLayoutSubBlock(350, {backgroundColor: new THREE.Color(0x9f7909), backgroundOpacity: 1.0, margin: 6, justifyContent:'center'})
            .addButton(()=>{_this.onWorkoutSelectionChanged(1)}, {...defaultButtonOptions, width:48, height: 328/2}).addText(">");
        

    }

    createSettingsMenuTimedRounds()
    {
        let _this = this;

        let settingsBlock;
        let settingValueBlock;
       
        // Timed Round Options
       
        // Round Count
        settingsBlock = this.settingsContainer.addVerticalLayoutSubBlock(kSettingsBlockHeight, settingsBlockDefaultOptions);
        settingsBlock.addHorizontalLayoutSubBlock(kSettingsBlockLabelWidth, settingsLabelBlockDefaultOptions).addText("Rounds:", settingsLabelDefaultOptions);
        settingsBlock
            .addHorizontalLayoutSubBlock(48*2, {backgroundColor: new THREE.Color(0xff00ff), backgroundOpacity: 0.0, margin: 0.0, padding: 4.0, offset: 8})
            .addVerticalLayoutSubBlock(40*2, {backgroundColor: new THREE.Color(0x9f7909), backgroundOpacity: 1.0, margin: 0.0, padding: 4.0, offset: 8})
            .addButton(()=>{_this.onRoundCountChanged(-1)}, settingsUpDownButtonDefaultOptions).addText("<");
        settingValueBlock = settingsBlock.addHorizontalLayoutSubBlock(kSettingsFieldWidth, settingsValueBlockDefaultOptions);
        this.roundCountValueTextField = settingValueBlock.addText(this.settings.roundCount.toString(), settingsValueTextDefaultOptions);
        settingsBlock
            .addHorizontalLayoutSubBlock(48*2, {backgroundColor: new THREE.Color(0xff00ff), backgroundOpacity: 0.0, margin: 0.0, padding: 4.0, offset: 8})
            .addVerticalLayoutSubBlock(40*2, {backgroundColor: new THREE.Color(0x9f7909), backgroundOpacity: 1.0, margin: 0.0, padding: 4.0, offset: 8})
            .addButton(()=>{_this.onRoundCountChanged(1)}, settingsUpDownButtonDefaultOptions).addText(">");

        // Bag Type
        settingsBlock = this.settingsContainer.addVerticalLayoutSubBlock(kSettingsBlockHeight, settingsBlockDefaultOptions);
        settingsBlock.addHorizontalLayoutSubBlock(kSettingsBlockLabelWidth, settingsLabelBlockDefaultOptions).addText("Bag Type:", settingsLabelDefaultOptions);
        settingsBlock
            .addHorizontalLayoutSubBlock(48*2, {backgroundColor: new THREE.Color(0xff00ff), backgroundOpacity: 0.0, margin: 0.0, padding: 4.0, offset: 8})
            .addVerticalLayoutSubBlock(40*2, {backgroundColor: new THREE.Color(0x9f7909), backgroundOpacity: 1.0, margin: 0.0, padding: 4.0, offset: 8})
            .addButton(()=>{_this.onBagTypeChanged(-1)}, settingsUpDownButtonDefaultOptions).addText("<");
        settingValueBlock = settingsBlock.addHorizontalLayoutSubBlock(kSettingsFieldWidth, settingsValueBlockDefaultOptions);
        this.bagTypeValueTextField = settingValueBlock.addText(this.getBagTypeString(), settingsValueTextDefaultOptions);
        settingsBlock
            .addHorizontalLayoutSubBlock(48*2, {backgroundColor: new THREE.Color(0xff00ff), backgroundOpacity: 0.0, margin: 0.0, padding: 4.0, offset: 8})
            .addVerticalLayoutSubBlock(40*2, {backgroundColor: new THREE.Color(0x9f7909), backgroundOpacity: 1.0, margin: 0.0, padding: 4.0, offset: 8})
            .addButton(()=>{_this.onBagTypeChanged(1)}, settingsUpDownButtonDefaultOptions).addText(">");

        // Swap Bag
        settingsBlock = this.settingsContainer.addVerticalLayoutSubBlock(kSettingsBlockHeight, settingsBlockDefaultOptions);
        settingsBlock.addHorizontalLayoutSubBlock(kSettingsBlockLabelWidth, settingsLabelBlockDefaultOptions).addText("Swap Bag:", settingsLabelDefaultOptions);
        settingsBlock
            .addHorizontalLayoutSubBlock(48*2, {backgroundColor: new THREE.Color(0xff00ff), backgroundOpacity: 0.0, margin: 0.0, padding: 4.0, offset: 8})
            .addVerticalLayoutSubBlock(40*2, {backgroundColor: new THREE.Color(0x9f7909), backgroundOpacity: 1.0, margin: 0.0, padding: 4.0, offset: 8})
            .addButton(()=>{_this.onSwapBagChanged()}, settingsUpDownButtonDefaultOptions).addText("<");
        settingValueBlock = settingsBlock.addHorizontalLayoutSubBlock(kSettingsFieldWidth, settingsValueBlockDefaultOptions);
        this.swapBagValueTextField = settingValueBlock.addText(this.getSwapBagString(), settingsValueTextDefaultOptions);
        settingsBlock
            .addHorizontalLayoutSubBlock(48*2, {backgroundColor: new THREE.Color(0xff00ff), backgroundOpacity: 0.0, margin: 0.0, padding: 4.0, offset: 8})
            .addVerticalLayoutSubBlock(40*2, {backgroundColor: new THREE.Color(0x9f7909), backgroundOpacity: 1.0, margin: 0.0, padding: 4.0, offset: 8})
            .addButton(()=>{_this.onSwapBagChanged()}, settingsUpDownButtonDefaultOptions).addText(">");

               
       


        // this.scene.add(this.settingsMenuBase);

    }

    createAudioSettingsMenu()
    {
        this.audioSettingsMenuBase = new UIPanel(1024, 384, {
            fontFamily: './content/ROCKB.TTF-msdf.json',
            fontTexture: './content/ROCKBTTF.png',
            // contentDirection: 'column',
            // justifyContent: 'top', //space-between',
            backgroundOpacity: 1.0,
            backgroundColor: new THREE.Color(0x9f7909),
            padding: 8,
            // padding: 32,
            // offset: 0,
            borderWidth: 0,
            // borderColor: new THREE.Color( 0x9f7909 ),
            fontColor: new THREE.Color( 0x9f7909 ),
            borderRadius: 0.0,
            name: "SettingsMenu Base",
            margin: 0
        });
        // this.uiQuadLayerHolePunch.scale.y = 384/(0.85 * 1024);
        this.audioSettingsMenuBase.position.z = -5.5;
        this.audioSettingsContainer = this.audioSettingsMenuBase.addHorizontalLayoutSubBlock((1024-32), {borderWidth: 0, offset: 8, borderRadius: 0.0, margin: 0, backgroundColor: new THREE.Color(0x000000), backgroundOpacity: 1.0});

        let _this = this;

        let settingsBlock;
        let settingValueBlock;
       
        // Timed Round Options
       
        // SFX Volume
        settingsBlock = this.audioSettingsContainer.addVerticalLayoutSubBlock(kSettingsBlockHeight, settingsBlockDefaultOptions);
        settingsBlock.addHorizontalLayoutSubBlock(kSettingsBlockLabelWidth, settingsLabelBlockDefaultOptions).addText("SFX:", settingsLabelDefaultOptions);
        settingsBlock
            .addHorizontalLayoutSubBlock(48*2, {backgroundColor: new THREE.Color(0xff00ff), backgroundOpacity: 0.0, margin: 0.0, padding: 4.0, offset: 8})
            .addVerticalLayoutSubBlock(40*2, {backgroundColor: new THREE.Color(0x9f7909), backgroundOpacity: 1.0, margin: 0.0, padding: 4.0, offset: 8})
            .addButton(()=>{_this.onSfxVolumeChanged(-0.1)}, settingsUpDownButtonDefaultOptions).addText("<");
        settingValueBlock = settingsBlock.addHorizontalLayoutSubBlock(kSettingsFieldWidth, settingsValueBlockDefaultOptions);
        this.sfxVolumeValueTextField = settingValueBlock.addText(this.getVolumeString(this.settings.sfxVolume), settingsValueTextDefaultOptions);
        settingsBlock
            .addHorizontalLayoutSubBlock(48*2, {backgroundColor: new THREE.Color(0xff00ff), backgroundOpacity: 0.0, margin: 0.0, padding: 4.0, offset: 8})
            .addVerticalLayoutSubBlock(40*2, {backgroundColor: new THREE.Color(0x9f7909), backgroundOpacity: 1.0, margin: 0.0, padding: 4.0, offset: 8})
            .addButton(()=>{_this.onSfxVolumeChanged(0.1)}, settingsUpDownButtonDefaultOptions).addText(">");

        // Music Volume
        settingsBlock = this.audioSettingsContainer.addVerticalLayoutSubBlock(kSettingsBlockHeight, settingsBlockDefaultOptions);
        settingsBlock.addHorizontalLayoutSubBlock(kSettingsBlockLabelWidth, settingsLabelBlockDefaultOptions).addText("Music:", settingsLabelDefaultOptions);
        settingsBlock
            .addHorizontalLayoutSubBlock(48*2, {backgroundColor: new THREE.Color(0xff00ff), backgroundOpacity: 0.0, margin: 0.0, padding: 4.0, offset: 8})
            .addVerticalLayoutSubBlock(40*2, {backgroundColor: new THREE.Color(0x9f7909), backgroundOpacity: 1.0, margin: 0.0, padding: 4.0, offset: 8})
            .addButton(()=>{_this.onMusicVolumeChanged(-0.1)}, settingsUpDownButtonDefaultOptions).addText("<");
        settingValueBlock = settingsBlock.addHorizontalLayoutSubBlock(kSettingsFieldWidth, settingsValueBlockDefaultOptions);
        this.musicVolumeTextField = settingValueBlock.addText(this.getVolumeString(this.settings.musicVolume), settingsValueTextDefaultOptions);
        settingsBlock
            .addHorizontalLayoutSubBlock(48*2, {backgroundColor: new THREE.Color(0xff00ff), backgroundOpacity: 0.0, margin: 0.0, padding: 4.0, offset: 8})
            .addVerticalLayoutSubBlock(40*2, {backgroundColor: new THREE.Color(0x9f7909), backgroundOpacity: 1.0, margin: 0.0, padding: 4.0, offset: 8})
            .addButton(()=>{_this.onMusicVolumeChanged(0.1)}, settingsUpDownButtonDefaultOptions).addText(">");


        // Cancel / Accept
        let okCancelBlock = this.audioSettingsContainer.addVerticalLayoutSubBlock(64*2, {contentDirection:'row', justifyContent:'center', borderWidth: 0});      
        okCancelBlock
            .addHorizontalLayoutSubBlock((150+12+12)*2, {backgroundColor: new THREE.Color(0xff00ff), backgroundOpacity: 0.0, margin: 0.0, padding: 6.0, offset: 8})
            .addVerticalLayoutSubBlock((48+6+6)*2, {backgroundColor: new THREE.Color(0x9f7909), backgroundOpacity: 1.0, margin: 0.0, padding: 6.0, offset: 8})
            .addButton(()=>{_this.onAudioSettingsCancelClicked()}, {...defaultButtonOptions, width: 150}).addText("CANCEL");
        okCancelBlock
            .addHorizontalLayoutSubBlock((150+12+12)*2, {backgroundColor: new THREE.Color(0xff00ff), backgroundOpacity: 0.0, margin: 0.0, padding: 6.0, offset: 8})
            .addVerticalLayoutSubBlock((48+6+6)*2, {backgroundColor: new THREE.Color(0x9f7909), backgroundOpacity: 1.0, margin: 0.0, padding: 6.0, offset: 8})
            .addButton(()=>{_this.onAudioSettingsAcceptClicked()}, {...defaultButtonOptions, width: 150}).addText("ACCEPT");

    }


    createTwoOptionDialog()
    {
        this.twoOptionDialogBase = new UIPanel(1024, 512, {
            fontFamily: './content/ROCKB.TTF-msdf.json',
            fontTexture: './content/ROCKBTTF.png',
            // contentDirection: 'column',
            // justifyContent: 'top', //space-between',
            backgroundOpacity: 1.0,
            backgroundColor: new THREE.Color(0x9f7909),
            padding: 8,
            // padding: 32,
            // offset: 0,
            borderWidth: 0,
            // borderColor: new THREE.Color( 0x9f7909 ),
            fontColor: new THREE.Color( 0x9f7909 ),
            borderRadius: 0.0,
            name: "Two Option Dialog",
            margin: 0
        });

        let _this = this;

        // this.uiQuadLayerHolePunch.scale.y = 512/(0.85 * 1024);
        this.twoOptionDialogBase.position.z = -5.5;
        this.twoOptionDialogContainer = this.twoOptionDialogBase.addHorizontalLayoutSubBlock((1024-32), {borderWidth: 0, offset: 8, borderRadius: 0.0, margin: 0, backgroundColor: new THREE.Color(0x000000), backgroundOpacity: 1.0});


        let messageBlock = this.twoOptionDialogContainer.addVerticalLayoutSubBlock(325, settingsBlockDefaultOptions);
        this.twoOptionDialogTextBox = messageBlock.addText("Great job! Come back tomorrow for another workout.", {...defaultTextOptions, fontSize: 40});


        let okCancelBlock = this.twoOptionDialogContainer.addVerticalLayoutSubBlock(64*2, {contentDirection:'row', justifyContent:'center', borderWidth: 0});      
        okCancelBlock
            .addHorizontalLayoutSubBlock((150+12+12)*2, {backgroundColor: new THREE.Color(0xff00ff), backgroundOpacity: 0.0, margin: 0.0, padding: 6.0, offset: 8})
            .addVerticalLayoutSubBlock((48+6+6)*2, {backgroundColor: new THREE.Color(0x9f7909), backgroundOpacity: 1.0, margin: 0.0, padding: 6.0, offset: 8})
            .addButton(()=>{_this.onOkClicked()}, {...defaultButtonOptions, width: 150}).addText("OK");
        // okCancelBlock
        //     .addHorizontalLayoutSubBlock((150+12+12)*2, {backgroundColor: new THREE.Color(0xff00ff), backgroundOpacity: 0.0, margin: 0.0, padding: 6.0, offset: 8})
        //     .addVerticalLayoutSubBlock((48+6+6)*2, {backgroundColor: new THREE.Color(0x9f7909), backgroundOpacity: 1.0, margin: 0.0, padding: 6.0, offset: 8})
        //     .addButton(()=>{_this.onAudioSettingsAcceptClicked()}, {...defaultButtonOptions, width: 150}).addText("ACCEPT");
            
        // let _this = this;

        // let settingsBlock;
        // let settingValueBlock;
       
        // // Timed Round Options
       
        // // SFX Volume
        // settingsBlock = this.audioSettingsContainer.addVerticalLayoutSubBlock(kSettingsBlockHeight, settingsBlockDefaultOptions);
        // settingsBlock.addHorizontalLayoutSubBlock(kSettingsBlockLabelWidth, settingsLabelBlockDefaultOptions).addText("SFX:", settingsLabelDefaultOptions);
        // settingsBlock
        //     .addHorizontalLayoutSubBlock(48*2, {backgroundColor: new THREE.Color(0xff00ff), backgroundOpacity: 0.0, margin: 0.0, padding: 4.0, offset: 8})
        //     .addVerticalLayoutSubBlock(40*2, {backgroundColor: new THREE.Color(0x9f7909), backgroundOpacity: 1.0, margin: 0.0, padding: 4.0, offset: 8})
        //     .addButton(()=>{_this.onSfxVolumeChanged(-0.1)}, settingsUpDownButtonDefaultOptions).addText("<");
        // settingValueBlock = settingsBlock.addHorizontalLayoutSubBlock(kSettingsFieldWidth, settingsValueBlockDefaultOptions);
        // this.sfxVolumeValueTextField = settingValueBlock.addText(this.getVolumeString(this.settings.sfxVolume), settingsValueTextDefaultOptions);
        // settingsBlock
        //     .addHorizontalLayoutSubBlock(48*2, {backgroundColor: new THREE.Color(0xff00ff), backgroundOpacity: 0.0, margin: 0.0, padding: 4.0, offset: 8})
        //     .addVerticalLayoutSubBlock(40*2, {backgroundColor: new THREE.Color(0x9f7909), backgroundOpacity: 1.0, margin: 0.0, padding: 4.0, offset: 8})
        //     .addButton(()=>{_this.onSfxVolumeChanged(0.1)}, settingsUpDownButtonDefaultOptions).addText(">");
    }

    showEndOfWorkoutDialog()
    {
        this.twoOptionDialogTextBox.set({content: "Great job! Come back tomorrow for another workout."});
        this.dialogOkayCB = this.exitGameCallback;
        this._showTwoOptionDialog();
    }
    _showTwoOptionDialog()
    {
        this.setCurrentMenu(this.twoOptionDialogBase);
        this.uiQuadLayerHolePunch.scale.y = 512/(0.85 * 1024);
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

    onSfxVolumeChanged(increment)
    {
        this.settings.sfxVolume = Math.max(0.0, Math.min(this.settings.sfxVolume + increment, 1.0));
        this.sfxVolumeValueTextField.set({content: this.getVolumeString(this.settings.sfxVolume)});
        console.log( "SFX Volume = " + getSfxVolume() );

        setSfxVolume(this.settings.sfxVolume);

        this.sfxVolumeAdjustSound.play(kZeroVector, 1.0);
        // this.sfxVolumeAdjustSound.setVolume(this.settings.sfxVolume);

        console.log("Play VolChange SFX");
        // this.sfxVolumeAdjustSound.play();
        //@TODO - update audio engine
    }

    onMusicVolumeChanged(increment)
    {
        this.settings.musicVolume = Math.max(0.0, Math.min(this.settings.musicVolume + increment, 1.0));
        this.musicVolumeTextField.set({content: this.getVolumeString(this.settings.musicVolume)});

        //@TODO - update audio engine
        this.musicManager.setMusicVolume(this.settings.musicVolume);
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

    getVolumeString(value)
    {
        console.assert(0<=value && value <= 1.0);

        return (value * 100).toFixed().toString();

    }

    onWorkoutTypeChanged(val)
    {
        this.settings.workoutType = (this.settings.workoutType + val + 2) % 2;
        this.workoutTypeValueTextField.set({content:this.getMatchConfigString()});
        
        window.localStorage.setItem("cfg_workoutType", this.settings.workoutType);

        // this.uiWorkoutTypeDisplay.innerHTML = this.getWorkoutTypeString();

        // if (this.settings.workoutType == 0)
        // {
        //     this.roundOptionsParent.remove(this.scriptedRoundContainer);
        //     this.roundOptionsParent.add(this.timedRoundContainer);
        //     this.roundOptionsParent.update(true, true, true);
        //     // this.timedRoundContainer.visible = true;
        //     // this.timedRoundContainer.offset = 7/512;
            
        // }
        // else
        // {
        //     this.roundOptionsParent.remove(this.timedRoundContainer);
        //     this.roundOptionsParent.add(this.scriptedRoundContainer);
        //     this.roundOptionsParent.update(true, true, true);

        //     // this.timedRoundContainer.visible = false;
        //     // this.timedRoundContainer.offset = -1.0;
        // }
    }

    onWorkoutSelectionChanged(val)
    {
        this.settings.whichScriptedWorkout = (this.settings.whichScriptedWorkout + val + workoutData.length) % workoutData.length;
        this.workoutDescriptionTextBox.displayMessage(workoutData[this.settings.whichScriptedWorkout][0].introText);
    }

    getMatchConfigString()
    {
        let matchDescription;
        if (this.settings.workoutType == 0)
        {
            let roundOrRounds = (this.settings.roundCount > 1) ? 
            (" Rounds,\n" + this.formatTime(this.settings.restTime) + " Rest") : " Round";

            matchDescription = this.settings.roundCount.toString() + " x " + this.formatTime(this.settings.roundTime) + roundOrRounds;
        }
        else
        {
            matchDescription = workoutData[this.settings.whichScriptedWorkout][0].uiShortText + 
            "\n" + this.formatTime(this.settings.roundTime) + " Round, " + this.formatTime(this.settings.restTime) + " Rest";
        }

        return matchDescription; //this.roundCount.toString() + " x " + this.formatTime(this.roundTime) + roundOrRounds;
    }

    onStartButtonClicked()
    {
        this.readSettings();

        // this.scene.remove(this.startMenuBase);
        this.hide();
        this.inputController.disable();
        //this.inputController.shutdown();
        

        // @TODO - replace with workoutType when I hook up that part of the UI
        this.boxingSession.initialize(this.settings.roundCount, this.settings.roundTime, this.settings.restTime, this.settings.bagType, this.settings.doBagSwap, this.settings.workoutType, this.settings.whichScriptedWorkout);
        this.boxingSession.startGame();
        // this.onStartCb();
    }

    onSettingsButtonClicked()
    {
        // let workoutType = this.settings.workoutType;
        this.readSettings();

        this.originalSettings = {...this.settings}; //copy settings into originalSettings

        this.createSettingsMenu();

        this.onRoundTimeChanged(0);
        this.onRestTimeChanged(0);
        if (this.settings.workoutType == 0)
        {
            this.onRoundCountChanged(0);
            this.onBagTypeChanged(0);
            this.onSwapBagChanged();
        }

        // this.settings.workoutType = workoutType;

        ThreeMeshUI.update();
       
        this.setCurrentMenu(this.settingsMenuBase, true);
    }

    onAudioSettingsButtonClicked()
    {
        if (true)
        {
            this.originalSettings = {...this.settings};

        //this.createAudioSettingsMenu();
            this.uiQuadLayerHolePunch.scale.y = 384/(0.85 * 1024);
            ThreeMeshUI.update();
        
            this.setCurrentMenu(this.audioSettingsMenuBase, true);
        }
        // else
        // {
        //     this.setCurrentMenu(this.twoOptionDialogBase, true);
        //     this.uiQuadLayerHolePunch.scale.y = 512/(0.85 * 1024);
        //     // ThreeMeshUI.update();
        // }
    }

    onSettingsCancelClicked()
    {
        this.settings = this.originalSettings;
        this.uiQuadScene.remove(this.workoutDescriptionTextBox);
        this.setCurrentMenu(this.startMenuBase);
    }

    onSettingsAcceptClicked()
    {
        this.writeSettings();
        this.uiQuadScene.remove(this.workoutDescriptionTextBox);
        this.onWorkoutTypeChanged(0);
        this.setCurrentMenu(this.startMenuBase);
        
    }

    onAudioSettingsCancelClicked()
    {
        this.settings = this.originalSettings;
        this.musicManager.setMusicVolume(this.settings.musicVolume);
        this.setCurrentMenu(this.startMenuBase);
        this.uiQuadLayerHolePunch.scale.y = 1.0;
    }
    onAudioSettingsAcceptClicked()
    {
        this.writeSettings();
        this.setCurrentMenu(this.startMenuBase);
        this.uiQuadLayerHolePunch.scale.y = 1.0;
    }

    onOkClicked()
    {
        this.dialogOkayCB();
    }
    exitGameCallback()
    {
        EndWebXRSession();
    }

    writeSettings()
    {
        window.localStorage.setItem("cfg_roundTime", this.settings.roundTime);
        window.localStorage.setItem("cfg_roundCount", this.settings.roundCount);
        window.localStorage.setItem("cfg_restTime", this.settings.restTime);
        window.localStorage.setItem("cfg_bagType", this.settings.bagType);
        window.localStorage.setItem("cfg_bagSwap", this.settings.doBagSwap ? 1 : 0);
        window.localStorage.setItem("cfg_workoutType", this.settings.workoutType);
        window.localStorage.setItem("cfg_scriptedWorkoutId", workoutData[this.settings.whichScriptedWorkout][0].uid);
        window.localStorage.setItem("cfg_sfxVolume", this.settings.sfxVolume );
        window.localStorage.setItem("cfg_musicVolume", this.settings.musicVolume );

    }
    readSettings()
    {
        if (!window.localStorage.getItem("first_run"))
        {
            window.localStorage.setItem("first_run", "true");
            this.writeSettings();
            // window.localStorage.setItem("cfg_roundTime", this.settings.roundTime);
            // window.localStorage.setItem("cfg_roundCount", this.settings.roundCount);
            // window.localStorage.setItem("cfg_restTime", this.settings.restTime);
            // window.localStorage.setItem("cfg_bagType", this.settings.bagType);
            // window.localStorage.setItem("cfg_bagSwap", this.settings.doBagSwap ? 1 : 0);
            // window.localStorage.setItem("cfg_workoutType", this.settings.workoutType);
            // window.localStorage.setItem("cfg_scriptedWorkoutId", workoutData[this.settings.whichScriptedWorkout][0].uid);
            // window.localStorage.setItem("cfg_arMode", this.settings.arMode ? 1 : 0)
            // window.localStorage.setItem("cfg_sfxVolume", this.settings.sfxVolume );
            // window.localStorage.setItem("cfg_musicVolume", this.settings.musicVolume );
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
            
            val = window.localStorage.getItem("cfg_scriptedWorkoutId");
            if (val)
            {
                let matchCfgId = (element) => element[0].uid == val;
                let matchedIndex = workoutData.findIndex(matchCfgId);
                if (matchedIndex < 0)
                {
                    //failed to match
                    this.settings.whichScriptedWorkout = 0;
                }
                else
                {
                    this.settings.whichScriptedWorkout = matchedIndex;
                }
            }

            val = window.localStorage.getItem("cfg_sfxVolume");
            if (val)
            {
                this.settings.sfxVolume = parseFloat(val);
                setSfxVolume(this.settings.sfxVolume);
            }
            val = window.localStorage.getItem("cfg_musicVolume");
            if (val)
            {
                
                this.settings.musicVolume = parseFloat(val);
                console.log("SET MUSIC VOLUME: " + this.settings.musicVolume);
                this.musicManager.setMusicVolume(this.settings.musicVolume);
            }

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
        this.inputController.update(dt, this.currentMenu, this.uiQuadLayerHolePunch);
    }

    render(renderer, frame)
    {
        if (this.doRenderLoop)
        {
            let renderProps = renderer.properties.get(this.uiQuadLayer.renderTarget);
            renderProps.__ignoreDepthValues = false;

            
            // set viewport, rendertarget, and renderTargetTextures
            this.uiQuadLayer.setupToRender(renderer, frame);
            
            renderer.xr.enabled = false;
            renderer.setClearColor(clearColor, 1.0);
            renderer.render(this.uiQuadScene, this.uiQuadCamera);
            renderer.setClearColor(clearColor, 0.0);
            renderer.xr.enabled = true;
        }
    }
}