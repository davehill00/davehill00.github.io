import * as TWEEN from "@tweenjs/tween.js";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {State, TimedState, EndState} from './state.js';
import { DDSLoader } from 'three/examples/jsm/loaders/DDSLoader.js';
import {Simple1DNoise} from './noise.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import { InputManager } from './inputManager.js';

var createGeometry = require('three-bmfont-text')
var loadFont = require('load-bmfont')

import * as PDAccel from './pdacceleration.js';
import { SphereGeometry, TextureLoader } from "three";
import { Flare } from "./flare.js";

export class Zone
{
    constructor(inScene, inRenderer, inCamera)
    {
        this.scene = inScene;
        this.camera = inCamera;
        this.renderer = inRenderer;
        this.focusObjectsGroup = new THREE.Group();
        this.sceneObjectsGroup = new THREE.Group();
        this.cameraObjectsGroup = new THREE.Group();
        this.currentState = null;
        this.accumulatedTime = 0.0;

        this.loaded = false;

        this.initialize();
    }

    initialize()
    {
    }

    onStart(accumulatedTime)
    {

        this.accumulatedTime = accumulatedTime;
        
        this.scene.add(this.focusObjectsGroup);
        this.scene.add(this.sceneObjectsGroup);
        this.camera.add(this.cameraObjectsGroup);
    }

    onEnd()
    {
        this.scene.remove(this.focusObjectsGroup);
        this.scene.remove(this.sceneObjectsGroup);
        this.camera.remove(this.cameraObjectsGroup);
        this.scene.fog = null;
    }

    update(dt, accumulatedTime)
    {
        this.accumulatedTime = accumulatedTime;
        if (this.currentState)
        {
            let newState = this.currentState.update(dt);
            if (newState)
            {
                this.currentState.onEnd();
                newState.onStart();
                this.currentState = newState;
            }
        }
    }

    startState(newState)
    {
        if (this.currentState)
        {
            this.currentState.onEnd();
        }
        if (newState)
        {
            newState.onStart();
        }
        this.currentState = newState;
    }

    addFocusObject(object)
    {
        this.focusObjectsGroup.add(object);
    }

    addSceneObject(object)
    {
        this.sceneObjectsGroup.add(object);
    }

    addCameraObject(object)
    {
        this.cameraObjectsGroup.add(object);
    }
}

export class ZoneIntro extends Zone
{
    initialize()
    {
        super.initialize();

        let fog = new THREE.Fog(0xfffbf8, 1.0, 95.0); //new THREE.FogExp2(0xfff4ed, 0.035);
        fog.color.convertSRGBToLinear();
        this.scene.fog = fog;


        const texture = new THREE.TextureLoader().load( './content/chillzone.png' );

        const pg = new THREE.PlaneGeometry( 4, 1, 1 );
        const pm = new THREE.MeshBasicMaterial( {color: 0xff9582, transparent:true, map: texture} );
        pm.color.convertSRGBToLinear();
        const logo = new THREE.Mesh( pg, pm );

        logo.position.y = 0.0;
        logo.position.z = -2.0;

        let tweenUp = new TWEEN.Tween(logo.position).to({y:2.1}, 4.0).easing(TWEEN.Easing.Cubic.InOut);
        let tweenDown = new TWEEN.Tween(logo.position).to({y:2.0}, 4.0).easing(TWEEN.Easing.Cubic.InOut);
        tweenUp.chain(tweenDown);
        tweenDown.chain(tweenUp);
        logo.tween = tweenUp;
        this.logo = logo;
        this.addFocusObject(logo);

        const directionalLight = new THREE.DirectionalLight(0xf58789, 8);
        directionalLight.color.convertSRGBToLinear();
        directionalLight.position.set(10.095, 9.2364, 14.453);
        this.addSceneObject(directionalLight);
    
        const light = new THREE.AmbientLight(0xf58789, 2.0); // soft white light
        light.color.convertSRGBToLinear();
        this.addSceneObject(light);


        const loader = new GLTFLoader();
        loader.load('./content/intro_environment.gltf', 
            gltf => this.addSceneObject(gltf.scene));
        

        this.noise = new Simple1DNoise;
        this.noise.setAmplitude(1);
        this.noise.setScale(2);

    }

    onStart(accumulatedTime)
    {
        super.onStart(accumulatedTime);
        //this.logo.tween.start(accumulatedTime);
        this.nextLogoPositionTime = accumulatedTime + Math.random() * 2.0;
        this.currentLogoPosition = this.logo.position.clone();
        this.currentLogoVelocity = new THREE.Vector3(0.0, 0.0, 0.0);
        
        this.targetLogoVelocity = new THREE.Vector3(0.0, 0.0, 0.0);
        this.targetLogoPosition = this.logo.position.clone();
        // this.targetLogoPosition.x += Math.random()*2.0 - 1.0;
        // this.targetLogoPosition.y += Math.random()*2.0 - 1.0;

        this.originalLogoPosition = this.logo.position.clone();

        this.targetCameraPosition = this.camera.position.clone();
        this.targetCameraPosition.x = this.noise.getVal(this.accumulatedTime);
        this.targetCameraPosition.y = this.noise.getVal(this.accumulatedTime + 2.0);
        this.currentCameraVelocity = new THREE.Vector3(0,0,0);
        this.targetCameraVelocity = new THREE.Vector3(0,0,0);

    }

    update(dt, accumulatedTime)
    {
        super.update(dt, accumulatedTime);

        // PDAccel.ApplyPDVec3(
        //     this.logo.position, this.currentLogoVelocity,
        //     this.targetLogoPosition, this.targetLogoVelocity,
        //     0.05, 0.2, dt);
 
        // if (this.nextLogoPositionTime < accumulatedTime)
        // {
        //     this.nextLogoPositionTime = accumulatedTime + Math.random() * 5.0;
        //     this.targetLogoPosition.x = this.originalLogoPosition.x + (Math.random() * 2.0 - 1.0) * 0.125;
        //     this.targetLogoPosition.y = this.originalLogoPosition.y + (Math.random() * 2.0 - 1.0) * 0.125;
        // }

        this.targetCameraPosition.x = this.noise.getVal(this.accumulatedTime);
        this.targetCameraPosition.y = this.noise.getVal(this.accumulatedTime + 2.0);

        PDAccel.ApplyPDVec3(this.camera.position, this.currentCameraVelocity,
            this.targetCameraPosition, this.targetCameraVelocity,
            0.05, 0.2, dt);
    }
}

export class ZoneDefault extends Zone
{
    initialize()
    {
        super.initialize();

        this.nextExitPromptTime = Infinity;
        this.lookForExitInput = false;
        this.repeatingHaptics = [];

        const geometry = new THREE.SphereGeometry( 0.14, 32, 32 );
        const material = new THREE.MeshPhysicalMaterial( {color: 0xeac3b9, metalness:0.125, roughness:0.55}); //{color: 0xfac3b9, metalness:0.2, roughness: 0.5} );
        let sphere = new THREE.Mesh( geometry, material );
    
        const blackoutQuad = new THREE.PlaneGeometry(1000.0, 1000.0, 1, 1);
        const blackoutMaterial = new THREE.MeshBasicMaterial(
            {
                color:0x000000, 
                opacity:1.0, 
                transparent:true,
                depthTest: false,
                fog: false
            }
        );
        this.fadeInFromBlack = new TWEEN.Tween(blackoutMaterial).delay(0.5).to({opacity:0.0}, 1.5).easing(TWEEN.Easing.Cubic.InOut);
        this.fadeOutToBlack = new TWEEN.Tween(blackoutMaterial).to({opacity:1.0}, 1.5).easing(TWEEN.Easing.Cubic.InOut).onComplete(
            () => {this.exitSession();});

        let blackoutMesh = new THREE.Mesh(blackoutQuad, blackoutMaterial);
        blackoutMesh.renderOrder = 1;
        blackoutMesh.position.z = -100;
        this.addCameraObject(blackoutMesh);

       // create an AudioListener and add it to the camera
        let listener = new THREE.AudioListener();
        this.camera.add( listener );
        
        // create the PositionalAudio object (passing in the listener)
        this.sound = new THREE.PositionalAudio(listener);

        // this.listener.context.resume();

        // load a sound and set it as the PositionalAudio object's buffer
        var audioLoader = new THREE.AudioLoader();
        audioLoader.load('./content/Wind-Mark_DiAngelo-1940285615.mp3', (buffer) => {
        //audioLoader.load('./content/Joyful-Flutterbee.mp3', (buffer) => {
            this.sound.setBuffer(buffer);
            this.sound.setRefDistance(40);
            this.sound.setVolume(0.125);
        });

        

        this.soundObject = new THREE.Object3D();
        this.soundObject.position.set(0.0, 2.0, -2.0);
        this.soundObject.add(this.sound);
        this.addSceneObject(this.soundObject);

        this.sphere = sphere;
        // this.sphere.add(this.sound);

        sphere.position.z = -3.0;
        sphere.position.y = 0.75;
        sphere.scale.set(0.0, 0.0, 0.0);
        sphere.initialPosition = sphere.position;
        sphere.castShadow = true;
        var tweenIntro = new TWEEN.Tween(sphere.scale).to({ x:1.0, y:1.0, z:1.0 }, 2.0).easing(TWEEN.Easing.Cubic.Out);
        var tweenUp = new TWEEN.Tween(sphere.position).to({ y: 1.25 }, 5.0).easing(TWEEN.Easing.Cubic.InOut);
        var tweenDown = new TWEEN.Tween(sphere.position).to({ y: 0.75 }, 5.0).easing(TWEEN.Easing.Cubic.InOut);

        var tweenUpLoop = new TWEEN.Tween(sphere.position).to({ y: 1.25 }, 5.0).easing(TWEEN.Easing.Cubic.InOut);
        var tweenDownLoop = new TWEEN.Tween(sphere.position).to({ y: 0.75 }, 5.0).easing(TWEEN.Easing.Cubic.InOut);


        tweenUpLoop.chain(tweenDownLoop);
        tweenDownLoop.chain(tweenUpLoop);

        sphere.tweenIntro = tweenIntro;
        sphere.tweenUp = tweenUp;
        sphere.tweenDown = tweenDown;
        sphere.tweenLoop = tweenUpLoop;
        sphere.tweenOut = new TWEEN.Tween(sphere.scale).delay(0.75).to({ x:0.0, y:0.0, z:0.0}, 3.0).easing(TWEEN.Easing.Cubic.In);

        this.addFocusObject(sphere);

        let fog = new THREE.FogExp2(0xfff4ed, 0.002527);
        fog.color.convertSRGBToLinear();
        this.scene.fog = fog;

        if (true)
        {

            const directionalLight = new THREE.DirectionalLight(0xfff7fc, 2.5);
            directionalLight.color.convertSRGBToLinear();
            //directionalLight.position.set(10.095, 9.2364, 14.453);

            setDirectionalLightPositionFromBlenderQuaternion(directionalLight, 0.923, 0.320, 0.060, -0.205); //, 0.275, 0.287, 0.487);

            this.addSceneObject(directionalLight);

            directionalLight.castShadow = true;
            directionalLight.shadow.mapSize.width = 2048; // default
            directionalLight.shadow.mapSize.height = 2048; // default
            directionalLight.shadow.camera.near = 0.5; // default
            directionalLight.shadow.camera.far = 100; // default
            const kSize = 20;
            directionalLight.shadow.camera.left = -kSize;
            directionalLight.shadow.camera.right = kSize;
            directionalLight.shadow.camera.top = 20; //kSize;
            directionalLight.shadow.camera.bottom = -2.5; //-kSize;
            directionalLight.shadow.bias = -0.00055;

        
            let sunVector = directionalLight.position.clone();
            sunVector.normalize();
            sunVector.multiplyScalar(100.0);
            this.flare = new Flare(sunVector, this, this.camera, this.renderer);

            // const light = new THREE.AmbientLight(0xf58789); // soft white light
            // this.addSceneObject(light);

            const hemi = new THREE.HemisphereLight( 0x8080aa, 0xf58779, 1.25 );
            hemi.color.convertSRGBToLinear();
            hemi.groundColor.convertSRGBToLinear();
            this.addSceneObject(hemi);
        }
        this.startedEnvMapLoad = false;
        // this.loadEnvMap();

        // const loader = new GLTFLoader();
        // loader.load('./content/environment1.gltf', 
        //     gltf => this.addSceneObject(gltf.scene)
        // );



        this.monolithObject = null;

        let loaderPromise = new Promise( resolve => {
            let loader = new GLTFLoader();
            loader.load('./content/environment1_2.gltf', resolve);
            //loader.load('./content/lightbakingtest.gltf', resolve);
        });
        loaderPromise.then(
            gltf => {
                for (let i = 0; i < gltf.scene.children.length; i++)
                {
                    let obj = gltf.scene.children[i];
                    if (obj.name == "Skydome")
                    {
                        //swap with a basic material so that the sky is unlit
                        obj.material = new THREE.MeshBasicMaterial(
                            {
                                color: 0xffffff,
                                fog: false,
                                side: THREE.BackSide,
                                map: obj.material.map
                            }
                        );
                    }
                    else if (obj.name == "Monolith")
                    {
                        this.monolithObject = obj;
                        this.setMonolithEnvMap = false;
                        obj.castShadow = true;
                    }
                    else if (obj.name == "Terrain")
                    {
                        obj.receiveShadow = true;
                        //obj.castShadow = true;
                    }
                    else
                    {
                        obj.castShadow = true;
                        obj.receiveShadow = true;
                    }
                }
                this.addSceneObject(gltf.scene);
            });





        // LOAD FONT
        loadFont('./content/arial-rounded.fnt',
            (err, font) => {
                // create a geometry of packed bitmap glyphs,
                // word wrapped to 300px and right-aligned
                this.fontGeometry = createGeometry({
                    align: 'center',
                    font: font,
                    flipY: true,
                    //width: 800
                })

                // const manager = new THREE.LoadingManager();
				// manager.addHandler( /\.dds$/i, new DDSLoader() );

                // // the texture atlas containing our glyphs
                // var texture = new DDSLoader(manager).load('./content/output.dds');

                var texture = new TextureLoader().load('./content/arial-rounded_0.png');

                // we can use a simple ThreeJS material
                this.fontMaterial = new THREE.MeshBasicMaterial({
                    map: texture,
                    transparent: true,
                    side: THREE.DoubleSide,
                    color: 0xfe9789, //0xfac3b9,
                    opacity: 0.0,
                    depthTest: false //:THREE.NeverDepth

                });
                this.fontMaterial.color.convertSRGBToLinear();

                // scale and position the mesh to get it doing something reasonable
                this.fontMesh = new THREE.Mesh(this.fontGeometry, this.fontMaterial);
                this.fontMesh.renderOrder = 0;
                this.fontMesh.position.set(0.0, 0.0, -2.0);
                this.fontMesh.scale.set(0.00125, 0.00125, 0.00125);
                this.fontMesh.rotation.set(3.14, 0, 0);

                this.addSceneObject(this.fontMesh);

                this.textTweenIn = new TWEEN.Tween(this.fontMaterial); //.to({a:1.0}, 0.5).easing(TWEEN.Easing.Cubic.InOut);
                this.textTweenOut = new TWEEN.Tween(this.fontMaterial); //.to({a:0.0}, 0.5).easing(TWEEN.Easing.Cubic.InOut);
                this.textTweenIn.chain(this.textTweenOut);
            });





    }

    loadEnvMap()
    {
        this.pmremRenderer = new THREE.WebGLRenderer({antialias: true});
        this.pmremRenderer.physicallyCorrectLights = true;
        this.pmremRenderer.toneMapping = THREE.ACESFilmicToneMapping;

        

        this.pmremRenderer.setSize(256, 256);
        this.pmremRenderer.setClearColor(0xfff4ed);

        this.pmremGenerator = new THREE.PMREMGenerator( this.pmremRenderer );
        this.pmremGenerator.compileEquirectangularShader();


        // THREE.DefaultLoadingManager.onLoad = function ( ) {

        //     this.pmremGenerator.dispose();
        //     this.pmremGenerator = null;

        new THREE.TextureLoader().load( './content/envmap.png', ( texture ) => {

            texture.encoding = THREE.sRGBEncoding;

            this.envMapRT = this.pmremGenerator.fromEquirectangular( texture );

            this.envMapCube = this.envMapRT.texture;

            texture.dispose();

        } );



    }
    exitSession()
    {
        this.renderer.xr.getSession().end();
    }
    update(dt, accumulatedTime)
    {
        super.update(dt, accumulatedTime);
        if (false) //!this.startedEnvMapLoad)
        {
            this.startedEnvMapLoad = true;
            this.loadEnvMap();
        }
        if (this.repeatingHaptics.length != 0)
        {
            //loop backwards so we can remove expired elements as we encounter them
            for (let i = this.repeatingHaptics.length - 1; i >= 0; i--)
            {
                let rh = this.repeatingHaptics[i];
                if (accumulatedTime >= rh.nextBuzz)
                {
                    rh.numLeft--;
                    this.activateHaptics(rh.index, rh.intensity, rh.milliseconds);
                    if (rh.numLeft > 0) 
                        rh.nextBuzz = accumulatedTime + rh.waitTime;
                    else
                        this.repeatingHaptics.splice(i, 1);
                }
            }
        }

        if (this.lookForExitInput && this.nextExitPromptTime < this.accumulatedTime)
        {
            this.updateText("Press and hold\nboth triggers to exit.", 1.0, 2.0, 1.0);
            this.nextExitPromptTime = this.accumulatedTime + 10.0;
        }


        if (this.lookForExitInput && this.renderer.inputManager.getTriggerPressedDuration(1) > 1.0)
        {
            this.lookForExitInput = false;
            this.fadeOutToBlack.start(this.accumulatedTime);
            //this.renderer.xr.getSession().end();
        }

        if (this.monolithObject && 
            //this.envMapCube && 
            this.renderer.envMapCube && this.setMonolithEnvMap == false)
        {
            this.monolithObject.material.envMap = this.renderer.envMapCube;
            this.monolithObject.material.envMapIntensity = 1.2;
            this.monolithObject.material.metalness = 0.8;
            this.monolithObject.material.roughness = 0.46;
            this.monolithObject.material.needsUpdate = true;
            this.monolithObject.material.color.set(0xffffff);

            this.sphere.material.color.convertSRGBToLinear();
            this.sphere.material.envMap = this.renderer.envMapCube;
            this.sphere.material.envMapIntensity = 1.0; //1.9;
            this.sphere.material.metalness = 0.96;
            this.sphere.material.roughness = 0.5;
            this.sphere.material.needsUpdate = true;

            this.setMonolithEnvMap = true;
            //this.monolithObject.material.map = this.envMapCube;
        }

        this.flare.update(dt);
    }

    updateText(str, fadeInTime, opaqueDuration, fadeOutTime)
    {

        
        this.fontGeometry.update(str);
        this.fontGeometry.computeBoundingBox();
        let box = this.fontGeometry.boundingBox;
        this.fontMesh.position.x = (box.max.x - box.min.x) * -0.5;
        this.fontMesh.position.y = (box.max.y - box.min.y) * -0.5;
        this.fontMesh.position.x *= this.fontMesh.scale.x;
        this.fontMesh.position.y *= this.fontMesh.scale.y;

        this.fontMesh.position.y += 0.65;

        this.textTweenIn.stop();
        this.textTweenOut.stop();

        let fadeIn = (fadeInTime > 0.0);
        let fadeOut = (fadeOutTime > 0.0);
        if (fadeIn)
            this.textTweenIn.to({opacity:1.0}, fadeInTime).easing(TWEEN.Easing.Cubic.Out);
        if (fadeOut)
            this.textTweenOut.delay(opaqueDuration).to({opacity:0.0}, fadeOutTime).easing(TWEEN.Easing.Cubic.Out);

        if (fadeIn && fadeOut)
        {
            this.fontMaterial.opacity = 0.0;
            this.textTweenIn.chain(this.textTweenOut);
            this.textTweenIn.start(this.accumulatedTime);
        }
        else if (fadeIn)
        {
            this.fontMaterial.opacity = 0.0;
            this.textTweenIn._chainedTweens.length = 0;
            this.textTweenIn.start(this.accumulatedTime);
        }
        else if (fadeOut)
        {
            this.fontMaterial.opacity = 1.0;
            this.textTweenOut.start(this.accumulatedTime);
        }
        else
        {
            this.fontMaterial.opacity = 1.0;
        }

    }

    activateHaptics(index, intensity, milliseconds)
    {
        let gamepad = this.scene.controllers[index].gamepad;
        if (gamepad != null && gamepad.hapticActuators != null)
        {
            let hapticActuator = gamepad.hapticActuators[0];
            if( hapticActuator != null)
                hapticActuator.pulse( intensity, milliseconds );
        }
    }
    pulseHapticsRepeat(index, intensity, seconds, wait, repeat)
    {
        let rh = {index: index, intensity: intensity, milliseconds: seconds*1000.0, waitTime: wait, numLeft: repeat, nextBuzz: this.accumulatedTime};
        this.repeatingHaptics.push(rh);
    }
    onStart(accumulatedTime)
    {
        super.onStart(accumulatedTime);

        const kNumIterations = 4;
        let endState = new EndState();
        let outroState = new TimedState(3.0, endState);
        let breatheState = new TimedState(10.0*kNumIterations, outroState);
        let breatheOutState = new TimedState(5.0, breatheState);
        let breatheInState = new TimedState(5.0, breatheOutState);
        let introFocusObjectState = new TimedState(3.0, breatheInState);
        let instructionsState = new TimedState(5.0, introFocusObjectState);
        let introBeatState = new TimedState(3.0, instructionsState);

        introBeatState.onStartCallbacks.push(() => {
            this.fadeInFromBlack.start(this.accumulatedTime);
        });

        instructionsState.onStartCallbacks.push(() => {
            this.sound.play();
            //this.soundChime.play();
            //this.soundChime2.play(0.5);
            this.updateText("Clear your mind\nand focus on\nyour breathing.", 1.0, 3.0, 1.0);
            // this.activateHaptics(1, 0.1, 100);
            // this.activateHaptics(0, 0.1, 250);
        });
        instructionsState.onEndCallbacks.push(() => {
            //this.updateText("");
        });

        introFocusObjectState.onStartCallbacks.push(() => {
            this.sphere.tweenIntro.start(this.accumulatedTime);

            //this.soundChime.play();
            //this.soundChime2.play(1.0);

        });

        breatheInState.onStartCallbacks.push(() => {

            //this.soundChime.play();
            //this.soundChime2.play(1.0);

            this.sphere.tweenUp.start(this.accumulatedTime);
            this.updateText("Breathe in.", 1.5, 3.3, 0.1);
            // this.pulseHapticsRepeat(0, 0.01, 0.03, 0.97, 5);
            // this.pulseHapticsRepeat(1, 0.01, 0.03, 0.97, 5);

            this.pulseHapticsRepeat(0, 0.01, 0.03, 0.97, (kNumIterations+1)*2*5); // (kNumIterations+1)*2*5 == number of breath iterations plus initial breathe in/out iteration time 5 seconds per direction
            this.pulseHapticsRepeat(1, 0.01, 0.03, 0.97, (kNumIterations+1)*2*5);
        });
        breatheOutState.onStartCallbacks.push(() => {
            this.sphere.tweenDown.start(this.accumulatedTime);
            this.updateText("Breathe out.", 0.1, 3.4, 1.5);

            // this.pulseHapticsRepeat(0, 0.01, 0.03, 0.97, 5);
            // this.pulseHapticsRepeat(1, 0.01, 0.03, 0.97, 5);

        });
        breatheState.onStartCallbacks.push(() => {
            //this.updateText("");
            this.sphere.tweenLoop.start(this.accumulatedTime);

            // this.pulseHapticsRepeat(0, 0.01, 0.03, 0.97, kNumIterations*2*5);
            // this.pulseHapticsRepeat(1, 0.01, 0.03, 0.97, kNumIterations*2*5);
        });
        breatheState.onEndCallbacks.push(() => {
            this.sphere.tweenLoop.stop();
        });
        outroState.onStartCallbacks.push(() => {
            this.updateText("Great job!", 1.0, 3.0, 1.0)
            this.sphere.tweenOut.start(this.accumulatedTime);
            //this.soundChime.play();
            this.pulseHapticsRepeat(0, 0.1, 0.5, 0.0, 1);
            this.pulseHapticsRepeat(1, 0.1, 0.5, 0.0, 1);
        });
        outroState.onEndCallbacks.push(() => {
        });

        endState.onStartCallbacks.push(() => {
            this.nextExitPromptTime = this.accumulatedTime + 3.0;
            this.lookForExitInput = true;
        });

        this.startState(introBeatState);
    }

    onEnd()
    {
        super.onEnd();
        if (this.sound && this.sound.isPlaying)
            this.sound.stop();
    }
}


export function setDirectionalLightPositionFromBlenderQuaternion(light, bQuatW, bQuatX, bQuatY, bQuatZ)
{

    const quaternion = new THREE.Quaternion(bQuatX, bQuatZ, -bQuatY, bQuatW);
    

    // const kDegToRad = 0.01745329252;
    // let euler = new THREE.Euler((xDeg) * kDegToRad, (yDeg) * kDegToRad, zDeg * kDegToRad);
    light.position.set(0.0, 20.0, 0.0);
    light.position.applyQuaternion(quaternion);
    //console.log("LIGHT POS: " + light.position.x * 20.0 + ", " + light.position.y * 20.0 + ", " + light.position.z * 20.0 );
}
