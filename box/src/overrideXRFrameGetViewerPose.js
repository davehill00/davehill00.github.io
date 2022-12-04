
let ipd = 0.0062; //62mm
let overridePose = [];
let defaultXrFrame_GetViewerPose;

export function OverrideXRFrameGetViewerPose(viewerPoseMatrixAsArray)
{
    console.assert(viewerPoseMatrixAsArray.length == 16);
    for(let i = 0; i < 16; i++)
    {
        overridePose[i] = viewerPoseMatrixAsArray[i];
    }
  
    defaultXrFrame_GetViewerPose = XRFrame.prototype.getViewerPose;
    
    XRFrame.prototype.getViewerPose = 
    function(ref) {
        let result = defaultXrFrame_GetViewerPose.bind(this)(ref);

        for (let i = 0; i < result.views.length; i++)
        {
            let view = result.views[i];
            for(let i = 0; i < 16; i++)
            {
                view.transform.matrix[i] = overridePose[i];
            }
            if (result.views.length === 2)
            {

                // @TODO - only works with a default orientation -- need to do better
                if (i === 0)
                {
                    view.transform.matrix[12] -= ipd;
                }
                else
                {
                    view.transform.matrix[12] += ipd;
                }
            }
        }
        return result;
    }
};
