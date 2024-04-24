

/*

What kind of interface to I want?

There are some sections of music I can plan -- intro, pre-round, during-round, between-rounds, outro
I can also set intensity of action and music manager can react accordingly

Music manager can listen to blur/focus events to determine what to do with music in response to that.

*/
export const MM_INTRO = 0;
export const MM_INTRO_UPBEAT = 1;
export const MM_ROUND_INTENSITY_0 = 2;
export const MM_ROUND_INTENSITY_1 = 3;
export const MM_ROUND_INTENSITY_2 = 4;
export const MM_ROUND_INTENSITY_3 = 5;
export const MM_INTRAROUND = 6;
export const MM_OUTRO = 7;

const kRegularVolume = 0.7 ;
const kPausedVolume = 0.15;

const labels = [
    "MM_INTRO",
    "MM_INTRO_UPBEAT",
    "MM_ROUND_INTENSITY_0",
    "MM_ROUND_INTENSITY_1",
    "MM_ROUND_INTENSITY_2",
    "MM_ROUND_INTENSITY_3",
    "MM_INTRAROUND",
    "MM_OUTRO"
];

export class MusicManager
{
    constructor(audioListener)
    {
        // load some music tracks
        
        this.audioListener = audioListener;
        this.startTime = -1;
        this.currentLoop = null;
        this.userVolumeAdjustment = 0.7;

        this.loops = [];

        this._loadLoop(MM_INTRO, "./content/HBT_Intro.ogg");
        this._loadLoop(MM_INTRO_UPBEAT, "./content/HBT_Upbeat_Intro.ogg");
        this._loadLoop(MM_ROUND_INTENSITY_0, "./content/HBT_Main_Intensity0.ogg");
        this._loadLoop(MM_ROUND_INTENSITY_1, "./content/HBT_Main_Intensity1.ogg");
        this._loadLoop(MM_ROUND_INTENSITY_2, "./content/HBT_Main_Intensity2.ogg");
        this._loadLoop(MM_ROUND_INTENSITY_3, "./content/HBT_Main_Intensity3.ogg");
        this._loadLoop(MM_INTRAROUND, "./content/HBT_Between_Rounds.ogg");
        this._loadLoop(MM_OUTRO, "./content/HBT_Outro.ogg")            
    }
    _loadLoop(which, path)
    {
        let sound = new THREE.Audio(this.audioListener);
        this.loops[which] = sound;

        new THREE.AudioLoader().load(
            path,
            (buffer) => 
            {
                sound.setBuffer(buffer);
                sound.setLoop(true);
                sound.setVolume(kRegularVolume * this.userVolumeAdjustment);
                
            }
        )
        
    }

    start()
    {
        this.startTime = this.audioListener.context.currentTime;
        this.bpm = 96.0;
        this.bps = this.bpm / 60.0;
        this.secondsPerBeat = 60.0 / this.bpm;
        this.secondsPerBar = this.secondsPerBeat * 4.0; // assume 4 beats per bar
    }

    play(which)
    {
        if (this.startTime === -1)
        {
            this.start();
        }

        if (which !== this.currentLoopId)
        {

            let transitionTime = this.timeToNextBar();

            console.log("Audio Transition to " + labels[which] + " in " + transitionTime + " seconds.");
            if (this.currentLoop !== null)
            {
                console.log("\tStop " + labels[this.currentLoopId]);
                this.currentLoop.stop(transitionTime)
            }

            this.currentLoop = this.loops[which];
            this.currentLoopId = which;

            // @TODO - do we want to offset into the new loop based on which bar we're on?
            if (this.currentLoop !== null)
            {
                console.log("\tPlay " + labels[this.currentLoopId] + " at volume: " + this.userVolumeAdjustment);
                this.currentLoop.setVolume(kRegularVolume * this.userVolumeAdjustment, 0.0001);
                console.log("Current Loop Volume: " + this.currentLoop.gain.gain.value)
                this.currentLoop.play(transitionTime);
            }
        }
    }

    setMusicVolume( newVolume )
    {
        console.assert(0 <= newVolume && newVolume <= 1);
        this.userVolumeAdjustment = newVolume;
        if (this.currentLoop !== null)
        {
            this.currentLoop.setVolume(kRegularVolume * this.userVolumeAdjustment );
        }

    }

    getMusicVolume()
    {
        return this.userVolumeAdjustment;
    }

    // timeToNextBeat()
    // {
    //     let elapsed = this.audioListener.context.currentTime - this.startTime;
    //     let nextBeatNumber = Math.ceil(elapsed / this.bps);
    //     let nextBeatTime = (nextBeatNumber * this.bps);
    //     return nextBeatTime;
    // }

    timeToNextBar()
    {

        let elapsed = this.audioListener.context.currentTime - this.startTime;
        //assume 4 beats per bar
        // seconds * beats/second / 4 beats/bar
        // let nextBarNumber = Math.ceil(elapsed / this.bps / 4);
        // seconds * 1.6 beats/second = 17.6 beats / 4 = 4.25 bars = bar #5
        let nextBarNumber = Math.ceil(elapsed / this.secondsPerBar); // Math.ceil(elapsed * this.bps / 4);
        let nextBarTime = nextBarNumber * this.secondsPerBar - elapsed;

        console.log("AUDIO TRANSITION");
        console.log("Elapsed: " + elapsed);
        console.log("Next Bar Number: " + nextBarNumber);
        console.log("Next Bar Time: " + nextBarTime);

        // Elapsed: 13.728
        // Next Bar Number: 6
        // Next Bar Time: 15

        // 13.7 * 1.6 / 4 = 5.48 --> 6

        // 96bpm --> 1.6bps --> 4 / 1.6 = 2.5 seconds per bar

        return nextBarTime;
    }

    onBlur()
    {
        this.currentLoop.setVolume(kPausedVolume * this.userVolumeAdjustment, 1.0); //0.1);
    }

    onFocus()
    {
        this.currentLoop.setVolume(kRegularVolume * this.userVolumeAdjustment, 0.1);
    }
}