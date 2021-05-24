import * as THREE from 'three';
import {LevelGridRaycast} from './levelGrid.js';
import {gInputManager} from './inputManager.js';

let _forwardVector = new THREE.Vector3();
let _sidewaysVector = new THREE.Vector3();
let _translation = new THREE.Vector3();
let hr = {t: 1.0};

let _vector0 = new THREE.Vector3();
let _vector1 = new THREE.Vector3();

const bAllowFalling = true;

export class PlayerController
{
    constructor(scene, camera)
    {
        this.scene = scene;
        this.camera = camera;

        this.velocity = new THREE.Vector3();

        this.translationGroup = new THREE.Group();
        this.translationGroup.position.copy(camera.position);
        this.translationGroup.position.set(150, 10.5, 75);
        // this.translationGroup.position.y = 10.5;
        this.translationGroup.add(camera);
        this.bIsFalling = false;

        camera.position.y = 1.5;
        scene.add(this.translationGroup);
    }

    update(dt)
    {
        //LevelGridRaycast(from, to, hr);

        let sideways, forward, turn;
        if (gInputManager.hasXrInput())
        {
            sideways = -gInputManager.readAxis(1, 2);
            forward = gInputManager.readAxis(1, 3);
            turn = gInputManager.readAxis(0, 2);
        }
        else
        {
            let keyboardEmu = gInputManager.getKeyboardEmulationInput();
            sideways = keyboardEmu.sideways;
            forward = keyboardEmu.forward;
            turn = keyboardEmu.turn;
        }

        let sign = Math.sign(turn);
        let turnAmount = Math.min(Math.abs(turn) * 4.0, 1.0) * sign; // make turn all-or-nothing, so you don't have much angular acceleration
        this.translationGroup.rotateOnWorldAxis(THREE.Object3D.DefaultUp, turnAmount * dt * -1.57);

        this.translationGroup.getWorldDirection(_forwardVector);
        _forwardVector.y = 0.0;
        _forwardVector.normalize();

        _sidewaysVector.crossVectors(_forwardVector, THREE.Object3D.DefaultUp);
        _sidewaysVector.normalize();


        
        const kStepUp = 0.3;
        // Move up
        _translation.copy(this.translationGroup.position);
        _translation.y += kStepUp;
        if (LevelGridRaycast(this.translationGroup.position, _translation, hr))
        {
            this.translationGroup.position.lerpVectors(
                this.translationGroup.position,
                _translation,
                hr.t
            );
        }
        else
        {
            this.translationGroup.position.copy(_translation);
        }


        // Move forward
        let movementScale = 8.0 * dt;
        _translation.set(0,0,0);
        if (bAllowFalling && this.bIsFalling)
        {
            _vector0.copy(this.velocity);
            _vector0.y = 0.0;
            _translation.addScaledVector(_vector0, dt);
        }
        else
        {
            _translation.addScaledVector(_forwardVector, forward * movementScale);
            _translation.addScaledVector(_sidewaysVector, sideways * movementScale);    
        }

        _translation.add(this.translationGroup.position);

        if (LevelGridRaycast(this.translationGroup.position, _translation, hr))
        {
            this.translationGroup.position.lerpVectors(
                this.translationGroup.position,
                _translation,
                hr.t
            );
        }
        else
        {
            this.translationGroup.position.copy(_translation);
        }

        // Move down
        _translation.copy(this.translationGroup.position);
        _translation.y += -kStepUp + this.velocity.y * dt; //step down plus falling velocity (if any)
        if (LevelGridRaycast( this.translationGroup.position, _translation, hr))
        {
            // hit
            this.translationGroup.position.y = this.translationGroup.position.y + (_translation.y - this.translationGroup.position.y) * hr.t;

            this.bIsFalling = false;
            this.velocity.set(0,0,0); //standing on something, so not falling or maintaining any velocity
        }
        else
        {
            //falling
            this.translationGroup.position.y = _translation.y; // _vector0.y;
            
            if (bAllowFalling)
            {
                if (!this.bIsFalling)
                {
                    this.bIsFalling = true;

                    // start falling -- retain the XZ velocity from this frame
                    this.velocity.addScaledVector(_forwardVector, forward * 8.0);
                    this.velocity.addScaledVector(_sidewaysVector, sideways * 8.0);
                }

                // increase falling velocity every frame -- @TODO - add a terminal velocity?
                this.velocity.y += -8.0 * dt;
            }
        }

    }

    getPosition(result)
    {
        result.copy(this.translationGroup.position);
    }
    getHeading(result)
    {
        this.translationGroup.getWorldDirection(result);
    }
    getTranslationGroup()
    {
        return this.translationGroup;
    }

}