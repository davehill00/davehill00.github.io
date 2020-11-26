import * as TWEEN from "@tweenjs/tween.js";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';


export class Zone
{
    constructor(inScene, inRenderer, inListener)
    {
        this.scene = inScene;
        this.listener = inListener;
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
        console.assert(object.tween != null);
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

        const loader = new GLTFLoader();
        loader.load('./content/intro_environment.gltf', 
            gltf => this.addSceneObject(gltf.scene));
        

    }

    onStart(accumulatedTime)
    {
        super.onStart(accumulatedTime);
        this.logo.tween.start(accumulatedTime);
    }

}

export class ZoneDefault extends Zone
{
    initialize()
    {
        super.initialize();

        const geometry = new THREE.SphereGeometry( 0.15, 32, 32 );
        const material = new THREE.MeshPhysicalMaterial( {color: 0xfac3b9} );
        let sphere = new THREE.Mesh( geometry, material );
    
        // create the PositionalAudio object (passing in the listener)
        const sound = new THREE.PositionalAudio(this.listener);

        // load a sound and set it as the PositionalAudio object's buffer
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load('content/Joyful-Flutterbee.mp3', function (buffer) {
            sound.setBuffer(buffer);
            sound.setRefDistance(20);
        });
        sphere.add(sound);
        sphere.sound = sound;

        this.sound = sound;
        this.sphere = sphere;

        sphere.position.z = -3.0;
        sphere.position.y = 0.75;
        sphere.initialPosition = sphere.position;
        var tweenIntro = new TWEEN.Tween(sphere.position).to({ z: -2.0 }, 5.0).easing(TWEEN.Easing.Cubic.InOut);
        var tweenUp = new TWEEN.Tween(sphere.position).delay(0.75).to({ y: 1.25 }, 5.0).easing(TWEEN.Easing.Cubic.InOut);
        var tweenDown = new TWEEN.Tween(sphere.position).delay(0.75).to({ y: 0.75 }, 5.0).easing(TWEEN.Easing.Cubic.InOut);

        tweenUp.chain(tweenDown);
        tweenDown.chain(tweenUp);

        sphere.tweenIntro = tweenIntro;
        sphere.tween = tweenUp;

        this.addFocusObject(sphere);

        let fog = new THREE.FogExp2(0xfff4ed, 0.005);
        this.scene.fog = fog;
    
        const loader = new GLTFLoader();
        loader.load('./content/environment1.gltf', 
            gltf => this.addSceneObject(gltf.scene)
        );

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
        if (this.sound.isPlaying)
            this.sound.stop();
    }

    onStart(accumulatedTime)
    {
        super.onStart(accumulatedTime);

        let endState = new EndState();
        let breatheState = new TimedState(30.0, endState);
        let introState = new TimedState(3.0, breatheState);

        breatheState.onStartCallbacks.push(() => this.onBreatheStart());
        breatheState.onEndCallbacks.push(() => this.onBreatheEnd());
        introState.onStartCallbacks.push(() => this.onIntroStart());

        this.startState(introState);
    }

    onEnd()
    {
        super.onEnd();
        this.sound.stop();
    }
}


class State 
{
    constructor()
    {
        this.initialize();
        this.onStartCallbacks = [];
        this.onEndCallbacks = [];
    }

    initialize()
    {
    }

    update(dt)
    {
        return null;
    }

    onStart()
    {
        this.onStartCallbacks.forEach( function(cb) {
            cb();
        });
    }

    onEnd()
    {
        this.onEndCallbacks.forEach( function(cb) {
            cb();
        });
    }
}

class TimedState extends State
{
    constructor(duration, nextState)
    {
        super();
        this.timeRemaining = duration;
        this.nextState = nextState;
    }

    update(dt)
    {
        let result = super.update(dt);
        if (result != null)
            return result;

        this.timeRemaining -= dt;
        if (this.timeRemaining <= 0.0)
        {
            this.nextState.initialize();
            return this.nextState;
        }

        return null;
    }
}

class EndState extends State
{
    initialize()
    {
        super.initialize();
    }

    update(dt)
    {
        let result = super.update(dt);
        if (result != null)
            return result;

        return null;
    }
}
