export class MovingAverageEventsPerMinute
{
    constructor(size, timeWindow)
    {
        this.data = new Array(size);
        for(let i = 0; i < size; i++)
        {
            this.data[i] = -1;
        }
        this.size = size;
        this.timeWindow = timeWindow;
        this.numSamples = 0;
        this.indexOfNextSample = 0;
        this.indexOfOldestSample = 0;
    }
    recordEntry(timestamp)
    {
        //if full, remove the old one -- descrement sum
        if (this.numSamples == this.size)
        {
            this.remove(this.indexOfOldestSample);
        }

        //write the new one
        this.numSamples++;
        this.data[this.indexOfNextSample] = timestamp;

        // update index -- I don't think I need to update the "oldest" index because it
        // should already be correct
        this.indexOfNextSample = (this.indexOfNextSample + 1) % this.size;
    }

    remove(index)
    {
        let entry = this.data[index];
        this.numSamples--;

        if (index == this.indexOfOldestSample)
        {
            this.indexOfOldestSample = (this.indexOfOldestSample + 1) % this.size;
        }
    }
    update(accumulatedTime)
    {
        let result = false;
        while(this.numSamples > 0)
        {
            let lifetime = accumulatedTime - this.data[this.indexOfOldestSample];
            if (lifetime > this.timeWindow)
            {
                this.indexOfOldestSample = (this.indexOfOldestSample + 1) % this.size;
                this.numSamples--;
                result = true;
            }
            else
            {
                break;
            }
        }
        return result;
    }

    getAverageEPM(timestamp)
    {
        if (this.numSamples == 0) 
            return 0;


        let totalTime = timestamp - this.data[this.indexOfOldestSample];

        if (totalTime < 0.3)
            return 0;

        // Calculate events per minute. We need to compute events as "elapsed time between events", so N - 1 vs. N.
        let rate = (this.numSamples - 1) / totalTime * 60.0;
        return rate; 
    }
}

export class MovingAverageDirectionVector
{
    constructor(size)
    {
        this.data = new Array(size);
        for(let i = 0; i < size; i++)
        {
            this.data[i] = new THREE.Vector3();
        }
        this.size = size;
        this.summedDirection = new THREE.Vector3();
        this.numSamples = 0;
        this.indexOfNextSample = 0;
        this.indexOfOldestSample = 0;
    }

    recordEntry(direction)
    {
        //if full, remove the old one -- descrement sum
        if (this.numSamples == this.size)
        {
            this._remove(this.indexOfOldestSample);
        }

        //write the new one
        this.numSamples++;
        this.data[this.indexOfNextSample].copy(direction);

        this.summedDirection.add(direction);

        // update index -- I don't think I need to update the "oldest" index because it
        // should already be correct
        this.indexOfNextSample = (this.indexOfNextSample + 1) % this.size;
    }

    getAverageDirection(result)
    {
        result.copy(this.summedDirection);
        if (this.numSamples > 0)
        {
            result.divideScalar(this.numSamples);
        }
    }

    _remove(index)
    {
        let entry = this.data[index];
        this.summedDirection.sub(entry);
        this.numSamples--;

        if (index == this.indexOfOldestSample)
        {
            this.indexOfOldestSample = (this.indexOfOldestSample + 1) % this.size;
        }
    }
}

// export class CircularArray
// {
//     constructor(length)
//     {
//         this.data = Array.size(length);
//         this.curLength = 0;
//         this.maxLength = length;
//         this.startElement = 0;
//     }
//     add(value)
//     {

//     }

// }