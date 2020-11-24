function lerp(start, end, t)
{
    return start + (end - start) * t;
}

export class Segment
{
    constructor(start, end, duration)
    {
        this.startValue = start;
        this.endValue = end;
        this.valueSize = end - start;
        this.duration = duration;
        this.invDuration = 1.0/duration;
        this.startTime = -1.0;
        this.endTime = -1.0;
    }

    valueAt(time)
    {
        let t = (time - this.startTime) * this.invDuration;
        return this.startValue + this.valueSize * t;
        //lerp(this.startValue, this.endValue, t);
    }
}

export class Interval
{
    constructor(segments)
    {
        this.segments = segments;
        let curTime = 0.0;
        for(let i = 0, iMax = this.segments.length; i < iMax; i++)
        {
            this.segments[i].startTime = curTime;
            this.segments[i].endTime = curTime + this.segments[i].duration;
            curTime = this.segments[i].endTime;
        }
        this.minTime = 0.0;
        this.duration = curTime;
    }

    clampTime(time)
    {
        let cleantime = time;
        while (cleantime < 0.0)
        {
            cleantime = cleantime + this.duration;
        }
        while (cleantime > this.duration)
        {
            cleantime = cleantime - this.duration;
        }
        return cleantime;
    }

    valueAt(time)
    {
        console.assert(0.0 <= time && time <= this.duration);
        for(var i = 0, maxI = this.segments.length; i < maxI; i++)
        {
            let seg = this.segments[i];
            if(seg.startTime <= time && time <= seg.endTime)
            {
                return seg.valueAt(time);
            }
        }
        return 0.0;
    }
}