export class InputManager
{
    constructor(xrManager)
    {
        this.xrManager = xrManager;

        //initialize controller state
        this.currentState = [{},{}];
        this.lastState = [{},{}];
        this.pressedStart = [{}, {}];
        this.controllers = [
            xrManager.getController(0),
            xrManager.getController(1)];
        
        xrManager.getControllerGrip(0).addEventListener("connected", (event) => {
            this.initControllerGamepad(0, event);
        });
        xrManager.getControllerGrip(1).addEventListener("connected", (event) => {
            this.initControllerGamepad(1, event);
        });

    }

    initControllerGamepad(which, event)
    {
        this.controllers[which].gamepad = event.data.gamepad;
        this.lastState[which].trigger = 0.0; //this.controllers[which].gamepad.trigger;
        this.currentState[which].trigger = this.controllers[which].gamepad.buttons[0].pressed ? 1.0 : 0.0;
        this.pressedStart[which].trigger = Infinity;
    }

    getTriggerPressedDuration(which)
    {
        if (this.currentState[which].trigger)
        {
            return this.accumulatedTime - this.pressedStart[which].trigger;
        }
        return 0.0;
    }
    update(dt, accumulatedTime)
    {
        this.accumulatedTime = accumulatedTime;
        for (let i = 0; i < 2; i++)
        {
            if (this.controllers[i].gamepad)
            {
                this.currentState[i].trigger = this.controllers[i].gamepad.buttons[0].pressed ? 1.0 : 0.0;
                if (this.lastState[i].trigger != this.currentState[i].trigger)
                {
                    if (this.lastState[i].trigger)
                    {
                        //just stopped being pressed

                        //@TODO - trigger a "trigger up" event
                    }
                    else
                    {
                        //just started being pressed
                        this.pressedStart[i].trigger = this.accumulatedTime;

                        //@TODO - trigger a "trigger down" event
                    }

                    this.lastState[i].trigger = this.currentState[i].trigger;
                }
            }
        }
    }
}