import * as THREE from 'three';

export class MultiInstanceSound extends THREE.Group
{
    constructor(audioListener, numInstances, soundFiles)
    {
        super();
        this.name = "MultiBufferSound";

        this.soundInstances = [];
        let i;
        for(i = 0; i < numInstances; i++)
        {
            let sound = new THREE.PositionalAudio(audioListener);
            sound.setRefDistance(40.0);
            sound.setVolume(1.0);
            this.soundInstances.push(sound);
        }
        this.nextInstanceIndex = 0;

        var audioLoader = new THREE.AudioLoader();
               
        this.soundBuffers = [];
        let soundFile;
        for(soundFile of soundFiles)
        {
            audioLoader.load(soundFile, (buffer) => {
                this.soundBuffers.push(buffer);
            });
        }
    }

    play(position, volume)
    {
        let instance = this.soundInstances[this.nextInstanceIndex];
        this.nextInstanceIndex = (this.nextInstanceIndex + 1) % this.soundInstances.length;

        if (instance.isPlaying)
            instance.stop();

        instance.position.copy(position);
        instance.setVolume(volume);
        
        // select the actual sound audio to play
        if(this.soundBuffers.length == 1)
        {
            instance.buffer = this.soundBuffers[0];
        }
        else
        {
            let whichSound = Math.floor(Math.random() * this.soundBuffers.length);

            // Don't play the same sound back to back
            if (whichSound == this.lastSoundPlayed)
            {
                whichSound = (whichSound + 1) % this.soundBuffers.length;
            }
            
            instance.buffer = this.soundBuffers[whichSound];
            this.lastSoundPlayed = whichSound;
        }

        instance.play();
    }
}