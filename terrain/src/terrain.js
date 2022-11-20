import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {EXRLoader} from 'three/examples/jsm/loaders/EXRLoader.js';

import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import { vertexShader } from './terrainShaders';

let scene;
let camera;
let renderer;
let clock;
let controllers = [];
let controls;
let terrain;

initialize();

function initialize()
{
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 1000);
    camera.position.z = 1.0;
    camera.position.y = 2.0;
    
    // add camera to scene so that objects attached to the camera get rendered
    scene.add(camera);

    renderer = new THREE.WebGLRenderer( {antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    renderer.xr.setFramebufferScaleFactor(1.0);
    renderer.debug.checkShaderError = true;

    renderer.physicallyCorrectLights = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;


    controls = new OrbitControls( camera, renderer.domElement );
    controls.update();

    let color = new THREE.Color(0.97, 0.98, 1.0);
    color.convertSRGBToLinear();

    
    clock = new THREE.Clock();

    let hemi = new THREE.HemisphereLight(0x446611, 0x113311, 1.0); //0.8);
    // scene.add(hemi);
    let sun = new THREE.DirectionalLight(0xffffff, 0.7); //2.0);
    sun.position.set(0.0, 1.0, 0.0);
    scene.add(sun);

    // sun = new THREE.DirectionalLight(0x8080a0, 0.5); //2.0);
    // sun.position.set(-1.0, 0.5, -1.0);
    // scene.add(sun);

    // let ambientColor = new THREE.Color(1,0,0); //1.0, 0.88, 0.87);
    // ambientColor.convertSRGBToLinear();
    // let ambient = new THREE.AmbientLight(ambientColor, 0.15); // 0.12525); //1.85);
    // scene.add(ambient);

    document.body.appendChild(renderer.domElement);
    document.body.appendChild(VRButton.createButton(renderer));

    const controllerModelFactory = new XRControllerModelFactory();
    let con = renderer.xr.getControllerGrip(0);
    con.add(controllerModelFactory.createControllerModel(con));
    //scene.add(con);
    controllers.push(con);
    con = renderer.xr.getControllerGrip(1);
    con.add(controllerModelFactory.createControllerModel(con));
    //scene.add(con);
    controllers.push(con);

    renderer.xr.addEventListener( 'sessionstart', onSessionStart);
    renderer.xr.addEventListener( 'sessionend', onSessionEnd);

    initScene();


    renderer.setAnimationLoop(render);
}

function render() {
    let dt = Math.min(clock.getDelta(), 0.0333);

    controls.update();
    if (false && terrain.material.userData.shader)
    {
        terrain.material.userData.shader.uniforms.texOffsetAndScale.value[0] += dt * 0.0815;
        terrain.material.userData.shader.uniforms.texOffsetAndScale.value[1] += dt * 0.0575;
    }

    renderer.render(scene, camera);
}

function onSessionStart()
{
}
function onSessionEnd()
{

}


function initScene()
{
    let mat = new THREE.MeshPhongMaterial(
        {
            color: 0xffffff, 
            shininess: 64.0, 
            vertexColors: false, 
            wireframe: false,
            // map: splat
        });

        mat.onBeforeCompile = (shader) => 
        {

            // shader.vertexUvs = true;
            // shader.uniforms.heightmap = { value: texture };
            // // shader.uniforms.splatmap = {value: splat};
            // // shader.uniforms.texOffsetAndScale = { value: [0.0, 0.0, 0.5, 0.5]}
            

            
            // let preamble = `
            // uniform sampler2D heightmap;
            // // uniform vec4 texOffsetAndScale;

            // float deformedPositionZ(vec2 uv)
            // {
            //     uv *= instanceColor.zz;
            //     uv += instanceColor.xy;

            //     float z = texture2D(heightmap, uv).r * 25.0;
            //     return z;
            // }

            // `;

            // let customBeginVertex = ""; // remote to include at the start of the normal comp

            // let beginNormal = `
            // vec3 transformed = vec3(position);
            // transformed.z = deformedPositionZ(vUv);

            
            // const float gap = 1.0/128.0;

            // #if 1
            //     // CHEAP VERSION
            //     // float r = transformed.z - deformedPositionZ(vUv + vec2(gap,0));
            //     // float l = transformed.z - deformedPositionZ(vUv + vec2(-gap,0));
            //     // float t = transformed.z - deformedPositionZ(vUv + vec2(0,gap));
            //     // float b = transformed.z - deformedPositionZ(vUv + vec2(0,-gap));
            //     float r = deformedPositionZ(vUv + vec2(gap,0));
            //     float l = deformedPositionZ(vUv + vec2(-gap,0));
            //     float t = deformedPositionZ(vUv + vec2(0,gap));
            //     float b = deformedPositionZ(vUv + vec2(0,-gap));
            //     vec3 objectNormal;
            //     objectNormal.x = (l - r);
            //     objectNormal.y = (b - t);
            //     objectNormal.z = 2.0 * gap;
            //     objectNormal = normalize(objectNormal);

            // #else

            //     // EXPENSIVE VERSION -- not working, need to debug
            //     float s11 = deformedPositionZ(vUv);
            //     float s01 = deformedPositionZ(vUv + vec2(-gap,0.0)); // + vec3(-gap, 0,0)); //-X height
            //     float s21 = deformedPositionZ(vUv + vec2(gap,0.0)); //, 0)); // +X height
            //     float s10 = deformedPositionZ(vUv + vec2(0.0,-gap)); //position + vec3(0.0, -gap, 0.0));// -Y height
            //     float s12 = deformedPositionZ(vUv + vec2(0.0,gap)); //position + vec3(0.0, gap, 0.0)); // +Y height

            //     vec3 pxNorm = normalize(cross(vec3(gap, 0.0, s21 - s11), vec3(0.0, 1, 0.0)));
            //     vec3 nxNorm = normalize(cross(vec3(-gap, 0.0, s01 - s11), vec3(0.0, -1, 0.0)));
            //     vec3 pyNorm = normalize(cross(vec3(0.0, gap, s12 - s11), vec3(-1, 0.0, 0.0)));
            //     vec3 nyNorm = normalize(cross(vec3(0.0, -gap, s10 - s11), vec3(1, 0.0, 0.0)));
            //     vec3 objectNormal = normalize(pxNorm + nxNorm + pyNorm + nyNorm);

            //     // vec3 objectNormal;
            // #endif

            // // vColor.xyz = (objectNormal + vec3(1.0,1.0,1.0)) * 0.5;
            // vColor.xyz = vec3(1,1,1);
            // `;

            // shader.vertexShader = preamble + 
            //     shader.vertexShader
            //         .replace("#include <begin_vertex>", customBeginVertex)
            //         .replace("#include <beginnormal_vertex>", beginNormal);


            // let customMapFragment = `
            // vec4 texelColor = texture2D( map, vUv );
            // texelColor = mapTexelToLinear( texelColor );
            // vec3 sand = vec3(1.0, 0.9, 0.7);
            // vec3 rock = vec3(0.5, 0.5, 0.5);
            // vec3 veg = vec3(0.2, 0.6, 0.1);
            // vec3 splatOutput=
            //     sand * texelColor.g +
            //     rock * texelColor.b +
            //     veg * texelColor.r;
            // if (texelColor.g > 0.25)
            //     splatOutput = sand; //vec3(1,1,1);
            // else if (texelColor.b > 0.25)
            //     splatOutput = rock;
            // else if (texelColor.r >= 0.25)
            //     splatOutput = veg;
            // else
            //     splatOutput = vec3(0.2,0,0.2);
            
            // texelColor.rgb = splatOutput;
            // diffuseColor *= texelColor;
            // `;


            // shader.fragmentShader = shader.fragmentShader.replace("#include <map_fragment>",
            //     customMapFragment);

            // mat.userData.shader = shader;

            /*
                Read the map and get the vertex color
                Apply core lighting
                
                Add fake SSS effect -- light shining through, modulated by something
                Add fresnel effect -- try to get view direction from lighting setup (geometric context?) and then use it around the edge

                I think the general idea will be:
                Shade everything normal
                Modulate with fake SSS and/or with fresnel stuff


                ALTERNATIVE: Look at a complete shader example (e.g., Water) and try writing my own simple material.

                What do I want in the material?
                - Lighting
                    - handle a directional light and a hemispherical light
                    - handle an environment probe? Is this better than directional/hemispherical? Or just really expensive?
                - Plant surface hacks
                    - some kind of fake SSS to make it feel organic and luminous
                    - fresnel term to make it seem dusted on the edges
                    - 

                    - plant surface hacks
                      - compute base color from vertex color and/or texture
                      - so -- either we're going to tweak the color before we light it (based on ???), 
                        or we're going to tweak it based on light contributions, or we're going to do something after the lighting is added

                    Do in the lighting pass
                    - make the plant lighter/yellower where the light is shining from behind



                - fog?
                - vertex animation
                - 
                
            */

            let customMapFragment = `

            `;
            shader.fragmentShader = 
                shader.fragmentShader.replace("#include <map_fragment>", customMapFragment);


            console.log(shader.vertexShader);
            console.log(shader.fragmentShader); 
        };
    mat.customProgramCacheKey = function() { return 12345678; }
    // terrain.material = mat;

    let sphere = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 8), mat);
    scene.add(
        sphere
    )

}


function OLDinitScene()
{

    let cube;
    cube = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 0.1), new THREE.MeshBasicMaterial({color:0x800000}));
    cube.position.y = 9.0;
    cube.position.x += 1.0;
    scene.add(cube);
    cube = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.0, 0.1), new THREE.MeshBasicMaterial({color:0x008000}));
    cube.position.y = 9.0;
    cube.position.y += 1.0;
    scene.add(cube);
    cube = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 2.0), new THREE.MeshBasicMaterial({color:0x000080}));
    cube.position.y = 9.0;
    cube.position.z += 1.0;
    scene.add(cube);

    let sphere = new THREE.Mesh(new THREE.SphereGeometry(2.0, 16, 8), new THREE.MeshPhongMaterial({color:0xcccccc}));
    sphere.position.y = 13.0;
    scene.add(sphere);  

    let texture = new EXRLoader()
        .setDataType( THREE.FloatType )
        .load( './content/heightmap2.exr',  ( texture ) => {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            // texture.magFilter = THREE.LinearFilter;
            // texture.minFilter = THREE.LinearMipMapLinearFilter;
            // let exrCubeRenderTarget = pmremGenerator.fromEquirectangular( texture );
            // scene.envMap = exrCubeRenderTarget.texture;
            // resolve();

        } );

    let splat = new THREE.TextureLoader().load('./content/splatmap3.png', (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearMipMapLinearFilter;
    });
    /*
    let texture = new THREE.TextureLoader().load("./content/heightmap.png", (texture) => {
        texture.type = THREE.FloatType;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearMipMapLinearFilter;
    
    });
    */

    const kHeight = -100.0;
    terrain = new THREE.InstancedMesh(new THREE.PlaneGeometry(128.0, 128.0, 127, 127), new THREE.MeshStandardMaterial({color: 0x808080, roughness: 0.0}), 9);

    terrain.setMatrixAt(0, new THREE.Matrix4().compose(new THREE.Vector3( 0 /*-128*/,kHeight,0), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0), -1.57), new THREE.Vector3(1,1,1)));
    terrain.setColorAt(0, new THREE.Color(0.0, 0.0, 1.0)); //0.3333));

    // terrain.setMatrixAt(1, new THREE.Matrix4().compose(new THREE.Vector3(0,kHeight,0), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0), -1.57), new THREE.Vector3(1,1,1)));
    // terrain.setColorAt(1, new THREE.Color(0.3333, 0.0, 0.3333));

    // terrain.setMatrixAt(2, new THREE.Matrix4().compose(new THREE.Vector3(128,kHeight,0), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0), -1.57), new THREE.Vector3(1,1,1)));
    // terrain.setColorAt(2, new THREE.Color(0.6667, 0.0, 0.3333));

    // terrain.setMatrixAt(3, 
    //     new THREE.Matrix4().compose(
    //         new THREE.Vector3(-128,kHeight,-128), 
    //         new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0), -1.57), 
    //         new THREE.Vector3(1,1,1)));
    // terrain.setColorAt(3, 
    //     new THREE.Color(0.0, 1.0/3.0, 0.3333));

    // terrain.setMatrixAt(4, 
    //     new THREE.Matrix4().compose(
    //         new THREE.Vector3(0,kHeight,-128), 
    //         new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0), -1.57), 
    //         new THREE.Vector3(1,1,1)));
    // terrain.setColorAt(4, 
    //     new THREE.Color(0.3333, 1.0/3.0, 0.3333));
    
    // terrain.setMatrixAt(5, 
    //     new THREE.Matrix4().compose(
    //         new THREE.Vector3(128,kHeight,-128), 
    //         new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0), -1.57), 
    //         new THREE.Vector3(1,1,1)));
    // terrain.setColorAt(5, 
    //     new THREE.Color(0.6667, 1.0/3.0, 0.3333));


    // terrain.setMatrixAt(6, 
    //     new THREE.Matrix4().compose(
    //         new THREE.Vector3(-128,kHeight,-256), 
    //         new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0), -1.57), 
    //         new THREE.Vector3(1,1,1)));
    // terrain.setColorAt(6, 
    //     new THREE.Color(0.0, 2.0/3.0, 0.3333));

    // terrain.setMatrixAt(7, 
    //     new THREE.Matrix4().compose(
    //         new THREE.Vector3(0,kHeight,-256), 
    //         new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0), -1.57), 
    //         new THREE.Vector3(1,1,1)));
    // terrain.setColorAt(7, 
    //     new THREE.Color(0.3333, 2.0/3.0, 0.3333));
    
    // terrain.setMatrixAt(8, 
    //     new THREE.Matrix4().compose(
    //         new THREE.Vector3(128,kHeight,-256), 
    //         new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0), -1.57), 
    //         new THREE.Vector3(1,1,1)));
    // terrain.setColorAt(8, 
    //     new THREE.Color(0.6667, 2.0/3.0, 0.3333));
    
    

    terrain.instanceMatrix.needsUpdate = true;
    terrain.instanceColor.needsUpdate = true;

    // terrain.rotation.set(-1.57,0.0,0.0);
    // terrain.position.set(0,-10,0);
    let mat = new THREE.MeshPhongMaterial(
        {
            color: 0xffffff, 
            shininess: 64.0, 
            vertexColors: false, 
            wireframe: false,
            map: splat
        });


    mat.onBeforeCompile = (shader) => 
        {

            shader.vertexUvs = true;
            shader.uniforms.heightmap = { value: texture };
            // shader.uniforms.splatmap = {value: splat};
            // shader.uniforms.texOffsetAndScale = { value: [0.0, 0.0, 0.5, 0.5]}
            

            
            let preamble = `
            uniform sampler2D heightmap;
            // uniform vec4 texOffsetAndScale;

            float deformedPositionZ(vec2 uv)
            {
                uv *= instanceColor.zz;
                uv += instanceColor.xy;

                float z = texture2D(heightmap, uv).r * 25.0;
                return z;
            }

            `;

            let customBeginVertex = ""; // remote to include at the start of the normal comp

            let beginNormal = `
            vec3 transformed = vec3(position);
            transformed.z = deformedPositionZ(vUv);

            
            const float gap = 1.0/128.0;

            #if 1
                // CHEAP VERSION
                // float r = transformed.z - deformedPositionZ(vUv + vec2(gap,0));
                // float l = transformed.z - deformedPositionZ(vUv + vec2(-gap,0));
                // float t = transformed.z - deformedPositionZ(vUv + vec2(0,gap));
                // float b = transformed.z - deformedPositionZ(vUv + vec2(0,-gap));
                float r = deformedPositionZ(vUv + vec2(gap,0));
                float l = deformedPositionZ(vUv + vec2(-gap,0));
                float t = deformedPositionZ(vUv + vec2(0,gap));
                float b = deformedPositionZ(vUv + vec2(0,-gap));
                vec3 objectNormal;
                objectNormal.x = (l - r);
                objectNormal.y = (b - t);
                objectNormal.z = 2.0 * gap;
                objectNormal = normalize(objectNormal);

            #else

                // EXPENSIVE VERSION -- not working, need to debug
                float s11 = deformedPositionZ(vUv);
                float s01 = deformedPositionZ(vUv + vec2(-gap,0.0)); // + vec3(-gap, 0,0)); //-X height
                float s21 = deformedPositionZ(vUv + vec2(gap,0.0)); //, 0)); // +X height
                float s10 = deformedPositionZ(vUv + vec2(0.0,-gap)); //position + vec3(0.0, -gap, 0.0));// -Y height
                float s12 = deformedPositionZ(vUv + vec2(0.0,gap)); //position + vec3(0.0, gap, 0.0)); // +Y height

                vec3 pxNorm = normalize(cross(vec3(gap, 0.0, s21 - s11), vec3(0.0, 1, 0.0)));
                vec3 nxNorm = normalize(cross(vec3(-gap, 0.0, s01 - s11), vec3(0.0, -1, 0.0)));
                vec3 pyNorm = normalize(cross(vec3(0.0, gap, s12 - s11), vec3(-1, 0.0, 0.0)));
                vec3 nyNorm = normalize(cross(vec3(0.0, -gap, s10 - s11), vec3(1, 0.0, 0.0)));
                vec3 objectNormal = normalize(pxNorm + nxNorm + pyNorm + nyNorm);

                // vec3 objectNormal;
            #endif

            // vColor.xyz = (objectNormal + vec3(1.0,1.0,1.0)) * 0.5;
            vColor.xyz = vec3(1,1,1);
            `;

            shader.vertexShader = preamble + 
                shader.vertexShader
                    .replace("#include <begin_vertex>", customBeginVertex)
                    .replace("#include <beginnormal_vertex>", beginNormal);


            let customMapFragment = `
            vec4 texelColor = texture2D( map, vUv );
            texelColor = mapTexelToLinear( texelColor );
            vec3 sand = vec3(1.0, 0.9, 0.7);
            vec3 rock = vec3(0.5, 0.5, 0.5);
            vec3 veg = vec3(0.2, 0.6, 0.1);
            vec3 splatOutput=
                sand * texelColor.g +
                rock * texelColor.b +
                veg * texelColor.r;
            if (texelColor.g > 0.25)
                splatOutput = sand; //vec3(1,1,1);
            else if (texelColor.b > 0.25)
                splatOutput = rock;
            else if (texelColor.r >= 0.25)
                splatOutput = veg;
            else
                splatOutput = vec3(0.2,0,0.2);
            
            texelColor.rgb = splatOutput;
            diffuseColor *= texelColor;
            `;


            shader.fragmentShader = shader.fragmentShader.replace("#include <map_fragment>",
                customMapFragment);

            mat.userData.shader = shader;

            //console.log(shader.vertexShader);
            console.log(shader.fragmentShader); 
        };
    mat.customProgramCacheKey = function() { return 12345678; }
    terrain.material = mat;
    
    // let terrain = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshStandardMaterial({color: 0x808080}));
    scene.add(terrain);
}