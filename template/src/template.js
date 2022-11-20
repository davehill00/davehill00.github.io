import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {CSM} from 'three/examples/jsm/csm/CSM.js';
import { CSMHelper } from 'three/examples/jsm/csm/CSMHelper.js';
import { LightProbeGenerator } from 'three/examples/jsm/lights/LightProbeGenerator.js';
import { Mesh, PlaneBufferGeometry, SphereBufferGeometry, TextureLoader } from 'three';
import {OverrideXRFrameGetViewerPose} from "./overrideXRFrameGetViewerPose.js";
import { OculusHandModel } from 'three/examples/jsm/webxr/OculusHandModel.js';

let scene;
let camera;
let renderer;
let clock;
let controllers = [];
let pmremGenerator;

let controls;
let csm;
let csmHelper;

let handModel0;
let handModel1;
let handMaterial0;
let handMaterial1;

initialize();

function initialize()
{
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 200);
    camera.position.z = 9.0; //60.0
    camera.position.y = 2.0; //7.0;
    camera.position.x = 2.0; //7.0;
    
    // add camera to scene so that objects attached to the camera get rendered
    scene.add(camera);

    //stencil:false doesn't appear to do anything by itself... if both stencil and depth are false, you get neither depth nor stencil
    renderer = new THREE.WebGLRenderer( {antialias: true}); //, stencil:false, depth:false}); 
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    // renderer.setClearColor(new THREE.Color(0.7, 0.83, 1.0));
    // renderer.xr.setFramebufferScaleFactor(0.1);

    renderer.physicallyCorrectLights = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0; // 0.285;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    let color = new THREE.Color(1.0, 0.93, 0.852);
    color.convertSRGBToLinear();


    let matrixOverridePose = new THREE.Matrix4().compose(
        camera.position, new THREE.Quaternion().identity(), new THREE.Vector3(1,1,1));
    
    OverrideXRFrameGetViewerPose(matrixOverridePose.toArray());

    if (false)
    {
        csm = new CSM({
            maxFar: 200.0, //camera.far,
            mode: 'practical',
            cascades:2,
            shadowMapSize: 512,
            lightColor: color,
            lightDirection: new THREE.Vector3(-1, -1, 1.0).normalize(),
            lightIntensity: 4.0,
            lightNear: 1,
            lightFar: 1000,
            // lightMargin: 10,
            shadowBias: -0.0001,
            camera: camera,
            parent: scene,
        });


        csmHelper = new CSMHelper(csm);
        // scene.add(csmHelper);
    }
    else
    {
        let sun = new THREE.DirectionalLight(color, 1.0); //2.0);
        sun.position.set(0.0, 50.0, 100.0);
        scene.add(sun);
    }
    
    // scene.add(new THREE.AmbientLight(0x303030));
    let sky = new THREE.Mesh( new SphereBufferGeometry(150.0, 16, 12), new THREE.MeshBasicMaterial({color:0x4080ff, side:THREE.DoubleSide}));
    sky.name = "SKY";
    sky.renderOrder = 100;
    scene.add(sky);


    // var texture = new THREE.TextureLoader().load('./content/test.png');
    // let quad = new THREE.Mesh(
    //     new PlaneBufferGeometry(1,1,1,1), new THREE.MeshBasicMaterial({color:0xffffff, map:texture})
    // );
    // quad.position.z = -3.0;  

    // scene.add(quad);

    controls = new OrbitControls( camera, renderer.domElement );
    controls.update();

    clock = new THREE.Clock();

    // let sun = new THREE.DirectionalLight(color, 3.0); //2.0);
    // sun.position.set(200.0, 400.0, 100.0);

    // sun.castShadow = true;
    // sun.shadow.mapSize.width = 2048; // default
    // sun.shadow.mapSize.height = 2048; // default
    // sun.shadow.camera.near = 0.05; // default
    // sun.shadow.camera.far = 1500.0; // default

    // const kSize = 64;
    // sun.shadow.camera.left = -64;
    // sun.shadow.camera.right = sun.shadow.camera.left + 128;
    // sun.shadow.camera.bottom = 64;
    // sun.shadow.camera.top = sun.shadow.camera.bottom - 128

    // sun.shadow.bias = -0.00055;


    // scene.add(sun);

    // let antisun = new THREE.DirectionalLight(0xffffff, 0.4);
    // antisun.position.set(-1.0, -2.0, 0.0);
    // scene.add(antisun);

    let fog = new THREE.FogExp2(0xffffff, 0.008); //ccaa, 0.005);
    // fog = new THREE.Fog(0xffffff, 0.1, 200.0);
    // scene.fog = fog;

    let ambientColor = new THREE.Color(1.0, 0.88, 0.87);
    ambientColor.convertSRGBToLinear();
    let ambient = new THREE.AmbientLight(ambientColor, 0.6); //1.25); //1.85);
    // scene.add(ambient);

    let hemi = new THREE.HemisphereLight(
        new THREE.Color(0.5, 0.5, 0.7), //new THREE.Color(0.9, 0.9, 0.95),
        new THREE.Color(0.5, 0.5, 0.5), //new THREE.Color(0.6, 0.9, 0.6),
        2.0
    );
    // scene.add(hemi);

    // let blocker = new THREE.Mesh(
    //     new THREE.PlaneGeometry(128.0, 128.0, 1, 1),
    //     new THREE.MeshBasicMaterial( {color: 0xff00ff, shadowSide: THREE.DoubleSide, side: THREE.DoubleSide})
    // );
    // blocker.position.set(0.0, 30.0, 0.0);
    // blocker.rotation.set(-1.57, 0.0, 0.0);
    // blocker.castShadow = true;
    // scene.add(blocker);


    
    let water = new THREE.Mesh(
        new THREE.PlaneGeometry(115.0, 115.0, 3, 3),
        new THREE.MeshPhongMaterial({
            color:0x3070ff,
            opacity: 0.25, 
            transparent: true,
            // depthTest: false,
            // depthWrite: false,
            // blending: THREE.AdditiveBlending
        })); 

    setupWaterMaterial(water.material);
    water.position.z = -30;
    water.position.y = 2.0;
    water.rotation.x = -1.57;
    scene.add( water );

    let envMapPromise = LoadEnvMapPromise('./content/environment_map.exr');
    // let envMapPromise = LoadEnvMapPromise('./content/gym_v8_envmap_2.png');

    let loaderPromise = new Promise( (resolve) => {
        // resolve();
        let loader = new GLTFLoader();
        // loader.load('./content/sakura.gltf', resolve);
        // loader.load('./content/foliage_ball.gltf', resolve);
        // loader.load('./content/single_tree.gltf', resolve);
        loader.load('./content/multi_tree.gltf', resolve);
    });

    envMapPromise.then(()=>{return loaderPromise}).then(
            (gltf) => {
                /*
                for (let i = 0; i < gltf.scene.children.length; i++)
                {                
                     let obj = gltf.scene.children[i];       
                    //  if (obj.name == "Suzanne")
                    //  {
                    //      obj.material.envMap = scene.envMap;

                    //      for (let j = 0; j < gltf.scene.children.length; j++)
                    //      {
                    //          let otherObj = gltf.scene.children[j];
                    //          otherObj.traverse(
                    //              function (node) {
                    //                  if (node.material) // && 'envmap' in node.material)
                    //                  {
                    //                      //console.log("Setting EnvMap on " + node.name + " with intensity " + node.material.envMapIntensity);
                    //                      node.material = obj.material; //.envMap = scene.envMap;
                    //                  }
                    //              });

                    //      }
                    //  }
                    obj.traverse(
                        function (node)
                        {
                            if (node.material)
                            {
                                
                                console.log(node.material.name)
                                if (node.material.name == "sungai")
                                {
                                    node.material.transparent = true;
                                    node.material.opacity = 0.8;
                                }
                                else if (node.material.name == "sakura")
                                {
                                    node.castShadow = true;
                                    // node.receiveShadow = true;
                                }
                                else if (node.material.name == "kayu sakura")
                                {
                                    node.castShadow = true;
                                    node.receiveShadow = true;
                                }
                                else
                                {
                                    // node.castShadow = true;
                                    node.receiveShadow = true;
                                }

                                const bSimpleMaterial = false;
                                if (bSimpleMaterial)
                                {
                                    let simpleMat = new THREE.MeshPhongMaterial({color: node.material.color});
                                    let origMat = node.material;
                                    simpleMat.map = origMat.map;
                                    
                                    node.material = simpleMat;
                                    
                                    node.material.shininess = Math.max(1.0 - origMat.roughness, 0.0) * 30.0;
                                    node.material.reflectivity = Math.max(1.0 - origMat.roughness, 0.0);

                                    csm.setupMaterial(node.material);

                                }
                                else
                                {
                                    csm.setupMaterial(node.material);
                                }

                                if (false && scene.envMap) // && 'envmap' in node.material)
                                {
                                    // console.log("Setting EnvMap on " + node.name + " with intensity " + node.material.envMapIntensity);
                                    
                                    node.material.envMap = scene.envMap;
                                    node.material.envMapIntensity = 0.1; //1.0;
                                    // node.material.envMapIntensity = 0.5;
                                    
                                }
                            }
                        });
                }*/


                gltf.scene.traverse( (obj) => 
                    {        
                        console.log(obj.name);

                        if (obj.material)
                        {
                            if (csm)
                            {
                                csm.setupMaterial(obj.material);    
                            }
                        
                            // obj.material.envMap = scene.envMap;
                            // obj.material.envMapIntensity = 0.2;
                            
                            if (obj.material.name == "Dirt")
                            {
                                let cheap = new THREE.MeshPhongMaterial( {color: 0xeeaa44});
                                // cheap.color = obj.material.color;
                                
                                cheap.shininess = 0.0;
                                cheap.side = THREE.FrontSide;
                                obj.material = cheap;

                                obj.renderOrder = 50;

                                // obj.visible = false;

                                obj.receiveShadow = true;
                                // obj.material.precision = 'mediump'; 
                                // setupGrassMaterial(obj.material);
                                setupUnderwaterMaterial(obj.material);

                            }
                            else if (obj.material.name == "Stone")
                            {
                                obj.receiveShadow = true;
                            }
                            else if (obj.material.name == "Trunk")
                            {
                                obj.castShadow = true;
                                obj.receiveShadow = true;

                                // obj.visible = false;

                                obj.material.envMap = scene.envMap;
                                obj.material.envMapIntensity = 0.2;
                            }
                            else
                            {
                                obj.castShadow = true;
                                obj.receiveShadow = true;
                            }

                            
                            if (false && obj.material && obj.material.name == "Foliage")
                            {
                                // let cheap = new THREE.MeshPhongMaterial();
                                // cheap.color = obj.material.color;
                                // cheap.shininess = 0.0;
                                // obj.material = cheap;

                                obj.material.envMap = scene.envMap;
                                obj.material.envMapIntensity = 0.1;
                                obj.material.emissiveIntensity = 0.6;
                                obj.material.emissive = new THREE.Color(0x0F5716);
                                obj.material.emissive.convertSRGBToLinear();
                                obj.material.roughness = 0.9
                                obj.material.side = THREE.FrontSide;
                                obj.material.precision = 'mediump';


                                // obj.visible = false;

                                let prevOBC = obj.material.onBeforeCompile;
                                obj.material.onBeforeCompile = (shader) => 
                                {
                                    prevOBC(shader);

                                    let customVertPreamble = `
                                        varying vec3 vSphereNormal;
                                    `;

                                    let customVert = `
                                        #include <worldpos_vertex>

                                        vSphereNormal = normalMatrix * position; // normalize(normalMatrix * position).xyz;
                                    `;


                                    let customFragPreamble = `
                                        varying vec3 vSphereNormal;
                                    `;
                                    let customFrag = `
                                    #include <tonemapping_fragment>
                                    

                                    DirectionalLight dirLight = directionalLights[0];
                                    vec3 sphereNormal = normalize(vSphereNormal + 0.5 * geometry.normal);
                                    float dotNL = dot( geometry.normal, dirLight.direction );
                                    float dotSNL = dot( sphereNormal, dirLight.direction );

                                    float dotVL = dot( geometry.viewDir, dirLight.direction );
                                    float dotVN = dot( geometry.normal, geometry.viewDir);

                                    // if (dotNL < 0.0 && dotVN < 0.707)
                                    // {
                                    //     float amount = saturate( 0.707 - dotVN ) * -dotNL;
                                    //     gl_FragColor.rgb += vec3(0.6, 0.8, 0.1) * amount;
                                    // }

                                    
                                    // GOOD COMBO FOR TREE OUTLINE
                                    float val = dot (geometry.viewDir, -(dirLight.direction + /*geometry.normal*/ sphereNormal * 1.0));

                                    // gl_FragColor.rgb += vec3(0.6, 0.9, 0.0) * 1.0 * pow(saturate(val), 2.0);
                                    gl_FragColor.rgb += vec3(0.1, 0.15, 0.0) * 1.0 * pow(saturate(val), 2.0);
                                    

                                    // float edgeMask = pow(1.0 - abs(dotNL), 2.0);
                                    // if (dotVL < -0.707) //edgeMask > 0.0) //dotNL < 0.0) // && dotVL < 0.0)
                                    // {
                                        
                                    //     float mask = (1.0 - ((dotNL - 0.1)/-1.1));
                                    //     mask = pow(mask, 3.0);
                                    //     gl_FragColor.rgb += vec3(0.6, 0.9, 0.0) * mask;
                                    // }

                                    // gl_FragColor.rgb = vec3(pow(1.0 - abs(dotNL), 3.0)); //saturate(vec3( 1.0 - dotNL ));

                                    // float delta = length(sphereNormal - normalize(geometry.normal));

                                    // gl_FragColor.rgb = vec3(delta);
                                    // gl_FragColor.rgb = (sphereNormal + vec3(1.0, 1.0, 1.0)) * 0.5;
                                    // gl_FragColor.rgb = (geometry.normal + vec3(1.0, 1.0, 1.0)) * 0.5;


                                    `;

                                    shader.vertexShader = customVertPreamble + shader.vertexShader.replace(
                                        "#include <worldpos_vertex>",
                                        customVert
                                    )

                                    shader.fragmentShader = customFragPreamble + shader.fragmentShader.replace(
                                        "#include <tonemapping_fragment>",
                                        customFrag
                                    );
                    
                                    // obj.material.userData.shader = shader;

                                    // console.log(shader.fragmentShader);
                                }

                                obj.material.customProgramCacheKey = function() { return 12345678; }
                            }
                            console.log(obj.name);
                        }
                    });
                scene.add(gltf.scene);
            });

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

    const hand0 = renderer.xr.getHand(0);
    handModel0 = new OculusHandModel(hand0);

    hand0.add(handModel0);
    scene.add(hand0);
    // camera.add(hand0);

    const hand1 = renderer.xr.getHand(1);
    handModel1 = new OculusHandModel(hand1);
    hand1.add(handModel1);
    scene.add(hand1);
    // camera.add(hand1);

    renderer.xr.addEventListener( 'sessionstart', onSessionStart);
    renderer.xr.addEventListener( 'sessionend', onSessionEnd);

    renderer.setAnimationLoop(render);
}

function render() {
    let dt = Math.min(clock.getDelta(), 0.0333);


    if (handModel0 && handModel0.children.length > 0 && !handMaterial0)
    {
            handModel0.traverse( (obj)=> 
            {
                if (obj)
                {
                    console.log(obj.name);
                }
                if (obj && obj.material)
                {
                    handMaterial0 = obj.material;
                    // obj.material.color.setRGB(1,0,1);
                }
        });
        
        handMaterial0.emissive.setRGB(0.15,0.14,0.13);
    }

    if (handModel1 && handModel1.children.length > 0 && !handMaterial1)
    {
            handModel1.traverse( (obj)=> 
            {
                if (obj)
                {
                    console.log(obj.name);
                }
                if (obj && obj.material)
                {
                    handMaterial1 = obj.material;
                    // obj.material.color.setRGB(1,0,1);
                }
        });
        
        handMaterial1.emissive.setRGB(0.1,0.1,0.1);
    }

    if (csm)
    {
        csm.update();
        csmHelper.update();
    }
    renderer.render(scene, camera);
}

let cameraFrame = new THREE.Group();

function onSessionStart()
{
    // for (let i = 0; i < controllers.length; i++)
    // {
    //     let con = controllers[i].children[0];
    //     con.setEnvironmentMap(scene.envMap);
    // }

    let session = renderer.xr.getSession();
    session.updateTargetFrameRate(72.0);

    console.log("SET CAMERA POSITION");
    cameraFrame.position.copy(camera.position);
    cameraFrame.add(camera);
    scene.remove(camera);
    scene.add(cameraFrame);


    // if (handModel0 && handModel0.mesh)

    //     handModel0.mesh.material.color.setRGB(1, 0.5, 1);

    // camera.position.set(0.0, 50.0, 50.0);
}
function onSessionEnd()
{
    scene.remove(cameraFrame);
    scene.add(camera);
    camera.position.copy(cameraFrame.position);

}

function LoadEnvMapPromise(pathname)
{
    pmremGenerator = new THREE.PMREMGenerator( renderer );
    pmremGenerator.compileEquirectangularShader();

    return new Promise( (resolve, reject) => {
        new EXRLoader()
            .setDataType( THREE.HalfFloatType )
            .load( pathname,  ( texture ) => {

                let exrCubeRenderTarget = pmremGenerator.fromEquirectangular( texture );
                scene.envMap = exrCubeRenderTarget.texture;

                // const rt = new THREE.WebGLCubeRenderTarget(2048);
                // rt.fromEquirectangularTexture(renderer, texture);
                // scene.background = rt.texture;
                // scene.envMap = rt.texture;

                // let lightprobe = LightProbeGenerator.fromCubeRenderTarget(renderer, rt);
                // scene.add(lightprobe);

                resolve();

            }); 


    //    new TextureLoader()
    //         .load(pathname, (texture) => {
    //             let cubeRenderTarget = pmremGenerator.fromEquirectangular( texture );
    //             scene.envMap = cubeRenderTarget.texture;

    //             const rt = new THREE.WebGLCubeRenderTarget(2048);
    //             rt.fromEquirectangularTexture(renderer, texture);
    //             scene.background = rt.texture;

    //             let lightprobe = LightProbeGenerator.fromCubeRenderTarget(renderer, rt);
    //             scene.add(lightprobe);

    //             resolve();
    //         });
    //     }
        });
}

function setupGrassMaterial(material)
{
    let prevOBC = material.onBeforeCompile;
    material.onBeforeCompile = (shader) => 
    {
        prevOBC(shader);


        let customVertPreamble = `
            varying vec3 vWorldPosition;
        `;

        let customVert = `
            #include <worldpos_vertex>

            // vec4 pos(position, 1.0);
            vWorldPosition = worldPosition.xyz;
        `;

        shader.vertexShader = customVertPreamble + shader.vertexShader.replace(
            "#include <worldpos_vertex>",
            customVert
        );


        let customFragPreamble = `
            varying vec3 vWorldPosition;
        `;

        let customFrag = `
        #include <tonemapping_fragment>

        // vViewPosition = position of vertex in view space...
        vec3 eyeVector = normalize(vViewPosition); //normalize(vWorldPosition - vViewPosition);
        float val = dot(normalize(eyeVector), normalize(geometry.normal)); //dot (geometry.viewDir, -(dirLight.direction + /*geometry.normal*/ sphereNormal * 1.0));
        val = pow(saturate(1.0 - val), 3.0);
        gl_FragColor.rgb += vec3(0.25, 0.3, 0.25) * val * 0.2;
        // val = saturate(1.0 - val);
        // if (val > 0.87)
        // {
        //     // val -= 0.707;
        //     gl_FragColor.rgb += vec3(1.0, 0.0, 1.0); // * pow(val, 1.0);
        // }
        // gl_FragColor.rgb = vec3(1.0, 0.0, 1.0);

        `;


        shader.fragmentShader = customFragPreamble + shader.fragmentShader.replace(
            "#include <tonemapping_fragment>",

            customFrag
        );
        
        // console.log(shader.vertexShader);
        
        material.customProgramCacheKey = function() { return 78978978979; }

    }
}

function setupWaterMaterial(material)
{
    let prevOBC = material.onBeforeCompile;
    material.onBeforeCompile = (shader) => 
    {
        prevOBC(shader);


        let customVertPreamble = `
            varying vec3 vWorldPosition;
        `;

        let customVert = `
            // #include <worldpos_vertex>

            vec4 worldPosition = vec4( transformed, 1.0 );

            #ifdef USE_INSTANCING
        
                worldPosition = instanceMatrix * worldPosition;
        
            #endif
        
            worldPosition = modelMatrix * worldPosition;

            // vec4 pos(position, 1.0);
            vWorldPosition = worldPosition.xyz;
        `;

        shader.vertexShader = customVertPreamble + shader.vertexShader.replace(
            "#include <worldpos_vertex>",
            customVert
        );


        let customFragPreamble = `
            varying vec3 vWorldPosition;
        `;

        let customFrag = `
        #include <tonemapping_fragment>

        // vViewPosition = position of vertex in view space...
        vec3 eyeVector = normalize(vViewPosition); //normalize(vWorldPosition - vViewPosition);
        float val = dot(normalize(eyeVector), normalize(geometry.normal)); //dot (geometry.viewDir, -(dirLight.direction + /*geometry.normal*/ sphereNormal * 1.0));
        val = pow(saturate(1.0 - val), 2.0);

        gl_FragColor.a = val;

        //gl_FragColor.rgb += vec3(0.25, 0.3, 0.25) * val * 0.2;
        // val = saturate(1.0 - val);
        // if (val > 0.87)
        // {
        //     // val -= 0.707;
        //     gl_FragColor.rgb += vec3(1.0, 0.0, 1.0); // * pow(val, 1.0);
        // }
        // gl_FragColor.rgb = vec3(1.0, 0.0, 1.0);

        `;


        shader.fragmentShader = customFragPreamble + shader.fragmentShader.replace(
            "#include <tonemapping_fragment>",

            customFrag
        );
        
        // console.log(shader.vertexShader);
        
        material.customProgramCacheKey = function() { return 78978978979; }

    }
}

function setupUnderwaterMaterial(material)
{
    let prevOBC = material.onBeforeCompile;
    material.onBeforeCompile = (shader) => 
    {
        prevOBC(shader);


        let customVertPreamble = `
            varying vec3 vWorldPosition;
        `;

        let customVert = `
            // #include <worldpos_vertex>

            vec4 worldPosition = vec4( transformed, 1.0 );

            #ifdef USE_INSTANCING
        
                worldPosition = instanceMatrix * worldPosition;
        
            #endif
        
            worldPosition = modelMatrix * worldPosition;

            // vec4 pos(position, 1.0);
            vWorldPosition = worldPosition.xyz;
        `;

        shader.vertexShader = customVertPreamble + shader.vertexShader.replace(
            "#include <worldpos_vertex>",
            customVert
        );


        let customFragPreamble = `
            varying vec3 vWorldPosition;
        `;

        let customFrag = `
        #include <tonemapping_fragment>

        // vViewPosition = position of vertex in view space...

        // vec3 eyeVector = normalize(vViewPosition); //normalize(vWorldPosition - vViewPosition);
        // float val = dot(normalize(eyeVector), normalize(geometry.normal)); //dot (geometry.viewDir, -(dirLight.direction + /*geometry.normal*/ sphereNormal * 1.0));
        // val = pow(saturate(1.0 - val), 3.0);
        // gl_FragColor.rgb += vec3(0.25, 0.3, 0.25) * val * 0.2;


        // Depth-based extinction
        if (false && vWorldPosition.y < 2.0)
        {
            float extinctionT = pow(saturate((vWorldPosition.y - 2.0) / -7.0), 1.0);

            float v = max(max(gl_FragColor.r, gl_FragColor.g), gl_FragColor.b);
            gl_FragColor.rgb = mix( gl_FragColor.rgb, vec3(0.2, 0.3, 0.4) * v, extinctionT);
            // gl_FragColor.rgb = vec3(extinctionT);
        }


        // Distance-through-water extinction
        float dist = 0.0;
        if (vWorldPosition.y < 2.0)
        {
            if (cameraPosition.y > 2.0)
            {
                //
                // camera is above the water
                //
                
                // compute intersection of ray from camera to fragment with plane of water
                // Water Plane: Normal = (0,1,0), P0 = (0,2,0), D = -Normal dot P0 = -2
                // Intersection T with Ray = A + tV: t = -(N dot A + D)/(N dot V)

                // Since Plane Normal N = 0,1,0 -- "N dot M" is just M.y

                vec3 camRayToFragV = normalize(vWorldPosition - cameraPosition);
                vec3 camRayToFragP = cameraPosition;

                float determinant = camRayToFragV.y;
                if (abs(determinant) > 0.001f)
                {
                    float t = -(camRayToFragP.y - 2.0)/determinant;
                    vec3 intersection = camRayToFragP + (t * camRayToFragV);

                    // compute distance from intersection with water to fragment
                    dist = length(intersection - vWorldPosition);
                }
            }
            else
            {
                dist = length(vWorldPosition - cameraPosition);
            }

            float extinctionT = min(dist,15.0) / 15.0;
            float v = max(max(gl_FragColor.r, gl_FragColor.g), gl_FragColor.b);

            // @TODO -- ramp v up to 1.0 based on extinction, so that shading gets less extreme in the distance.
            v = mix(v, 1.0, extinctionT);
            gl_FragColor.rgb = mix( gl_FragColor.rgb, vec3(0.03, 0.075, 0.1) * v, min(extinctionT, 0.975));

        }
        else
        {
            // Geometry is above the waterline
        }



        // val = saturate(1.0 - val);
        // if (val > 0.87)
        // {
        //     // val -= 0.707;
        //     gl_FragColor.rgb += vec3(1.0, 0.0, 1.0); // * pow(val, 1.0);
        // }
        // gl_FragColor.rgb = vec3(1.0, 0.0, 1.0);

        `;


        shader.fragmentShader = customFragPreamble + shader.fragmentShader.replace(
            "#include <tonemapping_fragment>",

            customFrag
        );
        
        console.log("UNDERWATER VERTEX SHADER");
        console.log(shader.vertexShader);
        
        material.customProgramCacheKey = function() { return 78978978979; }

    }
}