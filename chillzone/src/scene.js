import * as INTERVAL from "./interval.js";
import * as TWEEN from "@tweenjs/tween.js";

var sphere = null;
var anim = 0.0;
var listener = null;



export function initialize(inRenderer, inListener, inScene)
{
    listener = inListener;

    // Create a simple focus object
    const geometry = new THREE.SphereGeometry( 3, 32, 32 );
    const material = new THREE.MeshPhysicalMaterial( {color: 0xfac3b9} );
    sphere = new THREE.Mesh( geometry, material );
    inScene.add( sphere );

    // // create the PositionalAudio object (passing in the listener)
    const sound = new THREE.PositionalAudio( listener );

    // load a sound and set it as the PositionalAudio object's buffer
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load( 'content/Joyful-Flutterbee.mp3', function( buffer ) {
        sound.setBuffer( buffer );
        sound.setRefDistance( 20 );
    });
    sphere.add(sound);
    sphere.sound = sound;

    //sphere.scale.set(0.0, 0.0, 0.0);
    sphere.position.z = -500.0;
    sphere.initialPosition = sphere.position;
    var tweenIntro = new TWEEN.Tween(sphere.position).to({z:-10.0}, 5.0).easing(TWEEN.Easing.Cubic.InOut);
    var tweenUp = new TWEEN.Tween(sphere.position).delay(0.75).to({y:3}, 5.0).easing(TWEEN.Easing.Cubic.InOut);
    var tweenDown = new TWEEN.Tween(sphere.position).delay(0.75).to({y:0}, 5.0).easing(TWEEN.Easing.Cubic.InOut);

    tweenIntro.chain(tweenUp);
    tweenUp.chain(tweenDown);
    tweenDown.chain(tweenUp);

    sphere.tween = tweenIntro;
    //tweenIntro.start(0.0);
    

    let fog = new THREE.Fog(0xfff4ed, 15.0, 500.0); //0.1);
    inScene.fog = fog;

    // new TWEEN.Tween(sphere.position.y);
    // sphere
    // sphere.interval = new INTERVAL.Interval([
    //     new INTERVAL.Segment(0.0, 0.0, 1.0), 
    //     new INTERVAL.Segment(0.0, 1.0, 4.0), 
    //     new INTERVAL.Segment(1.0, 1.0, 1.5), 
    //     new INTERVAL.Segment(1.0, 0.0, 3.0)
    // ]);


}


export function update(dt)
{
    
    //TWEEN.update(dt);
    // anim = sphere.interval.clampTime(anim + dt);
    // sphere.position.y = sphere.interval.valueAt(anim) * 3.0; //Math.sin(anim * Math.PI * 0.25);
}

export function onSessionStart(time)
{
    sphere.position.set(sphere.initialPosition.x, sphere.initialPosition.y, sphere.initialPosition.z);
    sphere.sound.play();
    sphere.tween.start(time);
}

export function onSessionEnd(time)
{
    sphere.tween.stop();
    TWEEN.update(0.0);
    sphere.sound.stop();
}

// exports.initialize = initialize;
// exports.update = update;