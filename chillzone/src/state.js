
export class State 
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

export class TimedState extends State
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

export class EndState extends State
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
