import * as TWEEN from "@tweenjs/tween.js";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {State, TimedState, EndState} from './state.js';
import { DDSLoader } from 'three/examples/jsm/loaders/DDSLoader.js';

var createGeometry = require('three-bmfont-text')
var loadFont = require('load-bmfont')

import * as PDAccel from './pdacceleration.js';
import { TextureLoader } from "three";

export class Zone
{
    constructor(inScene, inRenderer, inCamera)
    {
        this.scene = inScene;
        this.camera = inCamera;
        this.renderer = inRenderer;
        this.focusObjectsGroup = new THREE.Group();
        this.sceneObjectsGroup = new THREE.Group();
        this.currentState = null;
        this.accumlatedTime = 0.0;

        this.loaded = false;

        this.initialize();
    }

    initialize()
    {
    }

    onStart(accumulatedTime)
    {
        this.scene.add(this.focusObjectsGroup);
        this.scene.add(this.sceneObjectsGroup);
    }

    onEnd()
    {
        this.scene.remove(this.focusObjectsGroup);
        this.scene.remove(this.sceneObjectsGroup);
        this.scene.fog = null;
    }

    update(dt, accumlatedTime)
    {
        this.accumlatedTime = accumlatedTime;
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
}

export class ZoneIntro extends Zone
{
    initialize()
    {
        super.initialize();


        let fog = new THREE.FogExp2(0xfff4ed, 0.015);
        this.scene.fog = fog;


        const texture = new THREE.TextureLoader().load( './content/chillzone.png' );

        const pg = new THREE.PlaneGeometry( 4, 1, 1 );
        const pm = new THREE.MeshBasicMaterial( {color: 0xffffff, transparent:true, map: texture} );
        const logo = new THREE.Mesh( pg, pm );

        logo.position.y = 2.0;
        logo.position.z = -2.0;

        let tweenUp = new TWEEN.Tween(logo.position).to({y:2.1}, 4.0).easing(TWEEN.Easing.Cubic.InOut);
        let tweenDown = new TWEEN.Tween(logo.position).to({y:2.0}, 4.0).easing(TWEEN.Easing.Cubic.InOut);
        tweenUp.chain(tweenDown);
        tweenDown.chain(tweenUp);
        logo.tween = tweenUp;
        this.logo = logo;
        this.addFocusObject(logo);

        const directionalLight = new THREE.DirectionalLight(0xf58789, 1);
        directionalLight.position.set(10.095, 9.2364, 14.453);
        this.addSceneObject(directionalLight);
    
        const light = new THREE.AmbientLight(0xf58789); // soft white light
        this.addSceneObject(light);


        const loader = new GLTFLoader();
        loader.load('./content/intro_environment.gltf', 
            gltf => this.addSceneObject(gltf.scene));
        

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


    }

    update(dt, accumulatedTime)
    {
        super.update(dt, accumulatedTime);

        PDAccel.ApplyPDVec3(
            this.logo.position, this.currentLogoVelocity,
            this.targetLogoPosition, this.targetLogoVelocity,
            0.05, 0.2, dt);
 
        if (this.nextLogoPositionTime < accumulatedTime)
        {
            this.nextLogoPositionTime = accumulatedTime + Math.random() * 5.0;
            this.targetLogoPosition.x = this.originalLogoPosition.x + (Math.random() * 2.0 - 1.0) * 0.125;
            this.targetLogoPosition.y = this.originalLogoPosition.y + (Math.random() * 2.0 - 1.0) * 0.125;
        }
    }
}

export class ZoneDefault extends Zone
{
    initialize()
    {
        super.initialize();

        this.repeatingHaptics = [];

        const geometry = new THREE.SphereGeometry( 0.15, 32, 32 );
        const material = new THREE.MeshPhysicalMaterial( {color: 0xeac3b9, metalness:0.125, roughness:0.55}); //{color: 0xfac3b9, metalness:0.2, roughness: 0.5} );
        let sphere = new THREE.Mesh( geometry, material );
    
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

        this.soundChime = new THREE.PositionalAudio(listener);
        this.soundChime2 = new THREE.PositionalAudio(listener);
        audioLoader.load('./content/Mono-Electronic_Chime-KevanGC-495939803.mp3', (buffer) => {
            this.soundChime.setBuffer(buffer);
            this.soundChime.setRefDistance(50);
            this.soundChime.setVolume(0.5);

            this.soundChime2.setBuffer(buffer);
            this.soundChime2.setRefDistance(10);
            this.soundChime2.setVolume(1.0);
        });

        this.soundObject = new THREE.Object3D();
        this.soundObject.position.set(0.0, 2.0, -2.0);
        this.soundObject.add(this.sound);
        this.soundObject.add(this.soundChime);
        this.addSceneObject(this.soundObject);

        this.sphere = sphere;
        // this.sphere.add(this.sound);

        sphere.position.z = -2.0;
        sphere.position.y = 0.75;
        sphere.scale.set(0.0, 0.0, 0.0);
        sphere.initialPosition = sphere.position;
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

        let fog = new THREE.FogExp2(0xfff4ed, 0.0027);
        this.scene.fog = fog;
    

        const directionalLight = new THREE.DirectionalLight(0xfff7fc, 0.55);
        directionalLight.position.set(10.095, 9.2364, 14.453);
        this.addSceneObject(directionalLight);
    
        // const light = new THREE.AmbientLight(0xf58789); // soft white light
        // this.addSceneObject(light);

        const hemi = new THREE.HemisphereLight( 0xffffff, 0xf58779, 0.55 );
        this.addSceneObject(hemi);


        // const loader = new GLTFLoader();
        // loader.load('./content/environment1.gltf', 
        //     gltf => this.addSceneObject(gltf.scene)
        // );



        let loaderPromise = new Promise( resolve => {
            let loader = new GLTFLoader();
            loader.load('./content/environment1_2.gltf', resolve);
        });
        loaderPromise.then(
            gltf => {
                for (let i = 0; i < gltf.scene.children.length; i++)
                {
                    let obj = gltf.scene.children[i];
                    if (obj.name == "Skydome")
                    {
                    obj.material.fog = false;
                    // obj.material.emissive.set(1.0, 1.0, 1.0); // = 0xffffff;
                    // obj.material.emissiveMap = obj.material.map;
                    // obj.material.map = null;
                    // obj.material.color.set(1.0, 1.0, 1.0); //, 1.0); // = 0xffffff;
                    //     // obj.material = new THREE.MeshBasicMaterial({
                        //     color: 0x00ace7, //obj.material.color,
                        //     fog:false,
                        //     side: THREE.BackSide
                        // });
                        break;
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
                    color: 0xfac3b9,
                    opacity: 0.0,
                    depthTest: false //:THREE.NeverDepth

                });

                // scale and position the mesh to get it doing something reasonable
                this.fontMesh = new THREE.Mesh(this.fontGeometry, this.fontMaterial);
                this.fontMesh.renderOrder = 0;
                this.fontMesh.position.set(0.0, 0.0, -3);
                this.fontMesh.scale.set(0.0025, 0.0025, 0.0025);
                this.fontMesh.rotation.set(3.14, 0, 0);

                this.addSceneObject(this.fontMesh);

                this.textTweenIn = new TWEEN.Tween(this.fontMaterial); //.to({a:1.0}, 0.5).easing(TWEEN.Easing.Cubic.InOut);
                this.textTweenOut = new TWEEN.Tween(this.fontMaterial); //.to({a:0.0}, 0.5).easing(TWEEN.Easing.Cubic.InOut);
                this.textTweenIn.chain(this.textTweenOut);
            });

    }

    update(dt, accumulatedTime)
    {
        super.update(dt, accumulatedTime);
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
            this.textTweenIn.start(this.accumlatedTime);
        }
        else if (fadeIn)
        {
            this.fontMaterial.opacity = 0.0;
            this.textTweenIn._chainedTweens.length = 0;
            this.textTweenIn.start(this.accumlatedTime);
        }
        else if (fadeOut)
        {
            this.fontMaterial.opacity = 1.0;
            this.textTweenOut.start(this.accumlatedTime);
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
        let rh = {index: index, intensity: intensity, milliseconds: seconds*1000.0, waitTime: wait, numLeft: repeat, nextBuzz: this.accumlatedTime};
        this.repeatingHaptics.push(rh);
    }

    onIntroStart()
    {

        this.sphere.tweenIntro.start(this.accumlatedTime);
    }

    onBreatheStart()
    {
        this.sound.play();
        this.sphere.tween.start(this.accumlatedTime);
    }

    onBreatheEnd()
    {
        // if (this.sound.isPlaying)
        //     this.sound.stop();
    }

    onStart(accumulatedTime)
    {
        super.onStart(accumulatedTime);

        const kNumIterations = 3;
        let endState = new EndState();
        let outroState = new TimedState(3.0, endState);
        let breatheState = new TimedState(10.0*kNumIterations, outroState);
        let breatheOutState = new TimedState(5.0, breatheState);
        let breatheInState = new TimedState(5.0, breatheOutState);
        let introFocusObjectState = new TimedState(3.0, breatheInState);
        let instructionsState = new TimedState(5.0, introFocusObjectState);
        let introBeatState = new TimedState(3.0, instructionsState);

        introBeatState.onStartCallbacks.push(() => {

        });

        instructionsState.onStartCallbacks.push(() => {
            this.sound.play();
            //this.soundChime.play();
            //this.soundChime2.play(0.5);
            this.updateText("Clear your mind\nand focus\non your breathing.", 1.0, 3.0, 1.0);
            // this.activateHaptics(1, 0.1, 100);
            // this.activateHaptics(0, 0.1, 250);
        });
        instructionsState.onEndCallbacks.push(() => {
            //this.updateText("");
        });

        introFocusObjectState.onStartCallbacks.push(() => {
            this.sphere.tweenIntro.start(this.accumlatedTime);

            //this.soundChime.play();
            //this.soundChime2.play(1.0);

        });

        breatheInState.onStartCallbacks.push(() => {

            //this.soundChime.play();
            //this.soundChime2.play(1.0);

            this.sphere.tweenUp.start(this.accumlatedTime);
            this.updateText("Breathe In", 1.5, 3.0, 0.05);
            this.pulseHapticsRepeat(0, 0.1, 0.01, 0.95, 5);
            this.pulseHapticsRepeat(1, 0.1, 0.01, 0.95, 5);
        });
        breatheOutState.onStartCallbacks.push(() => {
            this.sphere.tweenDown.start(this.accumlatedTime);
            this.updateText("Breathe Out", 0.05, 3.0, 1.5);

            this.pulseHapticsRepeat(0, 0.1, 0.01, 0.95, 5);
            this.pulseHapticsRepeat(1, 0.1, 0.01, 0.95, 5);

        });
        breatheState.onStartCallbacks.push(() => {
            //this.updateText("");
            this.sphere.tweenLoop.start(this.accumlatedTime);

            this.pulseHapticsRepeat(0, 0.1, 0.01, 0.95, kNumIterations*2*5);
            this.pulseHapticsRepeat(1, 0.1, 0.01, 0.95, kNumIterations*2*5);
        });
        breatheState.onEndCallbacks.push(() => {
            this.sphere.tweenLoop.stop();
        });
        outroState.onStartCallbacks.push(() => {
            this.updateText("Great job!", 1.0, 3.0, 1.0)
            this.sphere.tweenOut.start(this.accumlatedTime);
            this.soundChime.play();
        });
        outroState.onEndCallbacks.push(() => {
        });

        this.startState(introBeatState);
    }

    onEnd()
    {
        super.onEnd();
        this.sound.stop();
    }
}
