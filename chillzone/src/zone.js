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

        const geometry = new THREE.SphereGeometry( 0.15, 32, 32 );
        const material = new THREE.MeshPhysicalMaterial( {color: 0xfac3b9, metalness:0.2, roughness: 0.5} );
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

        this.soundObject = new THREE.Object3D();
        this.soundObject.position.set(0.0, 2.0, -2.0);
        this.soundObject.add(this.sound);
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

        const hemi = new THREE.HemisphereLight( 0xffffff, 0x909090, 0.55); //0xf58779, 0.55 );
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
                var fontMaterial = new THREE.MeshBasicMaterial({
                    map: texture,
                    transparent: true,
                    side: THREE.DoubleSide,
                    color: 0xfac3b9,
                    depthTest: false //:THREE.NeverDepth

                });

                // scale and position the mesh to get it doing something reasonable
                this.fontMesh = new THREE.Mesh(this.fontGeometry, fontMaterial);
                this.fontMesh.renderOrder = 0;
                this.fontMesh.position.set(0.0, 0.0, -3);
                this.fontMesh.scale.set(0.0025, 0.0025, 0.0025);
                this.fontMesh.rotation.set(3.14, 0, 0);

                this.addSceneObject(this.fontMesh);
            });

    }

    updateText(str)
    {
        this.fontGeometry.update(str);
        this.fontGeometry.computeBoundingBox();
        let box = this.fontGeometry.boundingBox;
        this.fontMesh.position.x = (box.max.x - box.min.x) * -0.5;
        this.fontMesh.position.y = (box.max.y - box.min.y) * -0.5;
        this.fontMesh.position.x *= this.fontMesh.scale.x;
        this.fontMesh.position.y *= this.fontMesh.scale.y;

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

        let endState = new EndState();
        let outroState = new TimedState(3.0, endState);
        let breatheState = new TimedState(10.0*6, outroState);
        let breatheOutState = new TimedState(5.0, breatheState);
        let breatheInState = new TimedState(5.0, breatheOutState);
        let introFocusObjectState = new TimedState(3.0, breatheInState);
        let instructionsState = new TimedState(5.0, introFocusObjectState);
        let introBeatState = new TimedState(3.0, instructionsState);

        introBeatState.onStartCallbacks.push(() => {

        });

        instructionsState.onStartCallbacks.push(() => {
            this.sound.play();
            this.updateText("Clear your mind\nand focus\non your breathing.");
        });
        instructionsState.onEndCallbacks.push(() => {
            this.updateText("");
        });

        introFocusObjectState.onStartCallbacks.push(() => {
            this.sphere.tweenIntro.start(this.accumlatedTime);
        });

        breatheInState.onStartCallbacks.push(() => {
            this.sphere.tweenUp.start(this.accumlatedTime);
            this.updateText("Breathe In");
        });
        breatheOutState.onStartCallbacks.push(() => {
            this.sphere.tweenDown.start(this.accumlatedTime);
            this.updateText("Breathe Out");
        });
        breatheState.onStartCallbacks.push(() => {
            this.updateText("");
            this.sphere.tweenLoop.start(this.accumlatedTime);
        });
        breatheState.onEndCallbacks.push(() => {
            this.sphere.tweenLoop.stop();
        });
        outroState.onStartCallbacks.push(() => {
            this.updateText("Great job!")
            this.sphere.tweenOut.start(this.accumlatedTime);
        });
        outroState.onEndCallbacks.push(() => {
            this.updateText("");
        });

        // let introState = new TimedState(3.0, breatheState);

        // breatheState.onStartCallbacks.push(() => this.onBreatheStart());
        // breatheState.onEndCallbacks.push(() => this.onBreatheEnd());
        // introState.onStartCallbacks.push(() => this.onIntroStart());

        this.startState(introBeatState);
    }

    onEnd()
    {
        super.onEnd();
        this.sound.stop();
    }
}

