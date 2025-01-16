// Variables
const { vec2, vec3, vec4, mat4 } = wgpuMatrix;

let adapter;
let device;
let context;
let canvasFormat;
let shaders = {
    vsModule: null,
    fsModule: null,
};
let bindGroupLayout;
let pipelineLayout;
let uniformBuffers = {
    projection: null,
    view: null,
    lights: null,
    renderParamBuffer: null,
    cameraPosition: null,
};

let matrices = {
    view: null,
    projection: null,
};
let pipeline;
let renderPassDescriptor;
let time = {
    then: Date.now(),
    now: 0,
    fpsAverage: [],
    fpsTotal: 0,
};
let depthStencilTexture;
let depthStencilState;
let depthStencilView;
let depthStencilAttachment;
let noCubes = 10;
let keys = {};
let mouses = {
    lastX: null,
    lastY: null,
    updatesX_camera: [],
    updatesY_camera: [],
    updatesX_move: [],
    updatesY_move: [],
    clicked_camera: false,
    clicked_move: false,
    selected_object: "",
    wheel: [],

}
let multisampleTexture;

let light;

let config = {};

let effec_select = vec2.create(0.0, 0.0);

async function setup(canvas)
{
    console.log("WEBGPU:SETUP: check for hardware/software support..");
    if (!navigator.gpu) {
        throw new Error("WEBGPU:SETUP: not supported by your browser.");
    }
    console.log("WEBGPU:SETUP: supported by your browser.");

    adapter = await navigator.gpu.requestAdapter();
    if (!adapter){
        throw new Error("WEBGPU:SETUP: no appropriate hardware.");
    }
    console.log("WEBGPU:SETUP: appropriate hardware.");

    device = await adapter.requestDevice();
    if (!device) {
        throw new Error("WEBGPU:SETUP: error supporting WebGPU in your browser");
    }
    console.log("WEBGPU:SETUP: webgpu available!");

    console.log("WEBGPU:SETUP: get canvas context + get preferred format.");
    context = canvas.getContext('webgpu');
    canvasFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
        device,
        format: canvasFormat,
        alphaMode: 'premultiplied',
    });
    console.log("WEBGPU:SETUP: finished");
}

// separate function to create the pipeline as it needs to be redone is screen is resized.
function create_pipeline(canvas)
{
    console.log("CREATE_PIPELINE: Create structures for depth comparison...");
    depthStencilState = {
        format: 'depth24plus-stencil8',
        depthWriteEnabled: true,
        depthCompare: 'less-equal',
    };

    depthStencilTexture = device.createTexture({
        label: "depthStencilTexture",
        size: { width: canvas.width, height: canvas.height, depthOrArrayLayers: 1 },
        format: 'depth24plus-stencil8',
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
        sampleCount: 4,
    });

    depthStencilView = depthStencilTexture.createView({
        format: 'depth24plus-stencil8',
        dimension: '2d',
        aspect: 'all',
    });

    depthStencilAttachment = {
        view: depthStencilView,
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
        stencilLoadOp: 'clear',
        stencilStoreOp: 'discard',
    };

    console.log('CREATE_PIPELINE: Creating pipeline ...');
    pipeline = device.createRenderPipeline({
        label: 'Hardcoded pipeline',
        layout: pipelineLayout,
        vertex: {
            module: shaders.vsModule,
            entryPoint: 'vs',
            buffers: [
                {                       // define  vbo
                    arrayStride: 3 * 4, //3x4bytes
                    attributes: [
                        {shaderLocation: 0, offset:0 , format: 'float32x3'},
                    ],
                },
                {                       // define colors
                    arrayStride: 4 * 4, //4x4bytes
                    attributes: [
                        {shaderLocation: 1, offset:0 , format: 'float32x4'},
                    ],
                },
                {                       // define texture coordinates
                    arrayStride: 2 * 4, //2x4bytes
                    attributes: [
                        {shaderLocation: 2, offset:0 , format: 'float32x2'},
                    ],
                } ,
                {                       // define normals
                    arrayStride: 3 * 4, //3x4bytes
                    attributes: [
                        {shaderLocation: 3, offset:0 , format: 'float32x3'},
                    ],
                }
            ],
        },
        fragment: {
            module: shaders.fsModule,
            entryPoint: 'fs',
            targets: [
                {
                    format: canvasFormat,
                    blend: {
                        color: {
                            operation: 'add',
                            srcFactor: 'one',
                            dstFactor: 'one-minus-src-alpha',

                        },
                        alpha: {
                            operation: 'add',
                            srcFactor: 'one',
                            dstFactor: 'one-minus-src-alpha',

                        },
                    },
                }
            ],
        },

        primitive: {
            topology : 'triangle-list',
        },

        cullMode: 'none',

        depthStencil: depthStencilState,

        multisample: {
            count: 4,
        },
    });

    console.log('CREATE_PIPELINE: Creating Render Pass Descriptor...');
    renderPassDescriptor = {
        label: 'Basic canvas render pass',
        colorAttachments: [{
            // view: <- to be filled out when we render
            clearValue: [0.1, 0.1, 0.2, 1.0],
            loadOp: 'clear',  // clear or store (draw on top)
            storeOp: 'store', // store or clear (throw away - e.g. multisampling)
        }],
        depthStencilAttachment: depthStencilAttachment,
    };
}

async function set_shaders()
{
    console.log("SET_SHADERS: Loading Shader text files...")
    let vsShaderFile = await (await fetch("./static/shader/phong_vs.wgsl")).text();
    let fsShaderFile = await (await fetch("./static/shader/phong_fs.wgsl")).text();

    shaders.vsModule = device.createShaderModule({
        label: 'Phong vs',
        code: vsShaderFile,
    });
    shaders.fsModule = device.createShaderModule({
        label: 'Phong fs',
        code: fsShaderFile,
    });
}

async function startup(canvas)
{
    config = await parseConfig("static/config.json", vec3, vec4);

    console.log("STARTUP: Doing all the loading...")

    await set_shaders();

    console.log('STARTUP: Creating layout for Group...');
    bindGroupLayout = device.createBindGroupLayout({
        entries: [{
            binding: 0,      // modelMatrix @binding(0)
            visibility: GPUShaderStage.VERTEX,
            buffer: {},
        }, {
            binding: 1,      // projectionMatrix @binding(1)
            visibility: GPUShaderStage.VERTEX,
            buffer: {},
        }, {
            binding: 2,      // viewMatrix @binding(2)
            visibility: GPUShaderStage.VERTEX,
            buffer: {},
        }, {
            binding: 3,     // sampler @binding(3)
            visibility: GPUShaderStage.FRAGMENT,
            sampler: {},
        }, {
            binding: 4,     // texture @binding(4)
            visibility: GPUShaderStage.FRAGMENT,
            texture: {sampleType: 'float', viewDimension: '2d', multisampled: false,}
        }, {
            binding: 5,    // light @binding(5)
            visibility: GPUShaderStage.FRAGMENT,
            buffer: {},
        }, {
            binding: 6,    // normalMatrices @binding(6)
            visibility: GPUShaderStage.VERTEX,
            buffer: {},
        }, {
            binding: 7,    // CameraPosition @binding(7)
            visibility: GPUShaderStage.VERTEX,
            buffer: {},
        }, {
            binding: 8,    // render params @binding(8)
            visibility: GPUShaderStage.FRAGMENT,
            buffer: {},
        }]
    });

    console.log('STARTUP: Creating pipeline layout...');
    pipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [
            bindGroupLayout, // @group(0)
        ]
    });

    // Create Pipeline...
    create_pipeline(canvas);

    // Projections
    //
    matrices.projection = mat4.perspective(60.0 * Math.PI / 180.0, canvas.width / canvas.height, 0.1, 1000.0);
    const uniformData1 = matrices.projection;
    //
    uniformBuffers.projection = device.createBuffer({
        label: 'uniform buffer projection',
        size: matrices.projection.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    device.queue.writeBuffer(uniformBuffers.projection, 0, matrices.projection);

    // View
    //
    matrices.view = mat4.lookAt(
        config.camera.position,
        vec3.add(config.camera.position, config.camera.front),
        config.camera.up);
    //
    uniformBuffers.view = device.createBuffer({
        label: 'uniform buffer view',
        size: matrices.view.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    device.queue.writeBuffer(uniformBuffers.view, 0, matrices.view);

    // lights
    //
    const lightCount = 16;
    const lightStructSize = 20;
    const lightDataSize = lightCount * lightStructSize;
    
    const lightArray = new Float32Array(lightDataSize);
    
    for (let i = 0; i < Math.min(lightCount, config.lights.length); i++) {
        const baseOffset = i * (lightStructSize);
    
        lightArray.set(config.lights[i].ia, baseOffset + 0);
        lightArray.set(config.lights[i].id, baseOffset + 4);
        lightArray.set(config.lights[i].is, baseOffset + 8);
        lightArray.set([config.lights[i].shininess], baseOffset + 12);
        lightArray.set(config.lights[i].position, baseOffset + 16);
    }

    uniformBuffers.lights = device.createBuffer({
        label: 'uniform buffer lights',
        size: lightArray.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    
    device.queue.writeBuffer(uniformBuffers.lights, 0, lightArray.buffer);

    // render parameters 
    //
    uniformBuffers.renderParamBuffer = device.createBuffer({
        size: effec_select.byteLength, // vec2f = 2 floats
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(uniformBuffers.renderParamBuffer, 0, effec_select);

    // Create a buffer for camera position
    //
    uniformBuffers.cameraPosition = device.createBuffer({
        label: 'uniform buffer camera position',
        size: config.camera.position.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    device.queue.writeBuffer(uniformBuffers.cameraPosition, 0, config.camera.position);

    // Create a sampler
    //
    const sampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
    });

    console.log("STARTUP: Charging all the objects");

    const colorData = new Float32Array([]);

    for (let i = 0; i < config.objects.length; i++) {
        const cur_obj = config.objects[i];
        console.log("STARTUP: Processing ...", cur_obj.name, "...");
        // transformation
        //
        let modelMatrix = mat4.create();
        mat4.identity(modelMatrix);
        modelMatrix = mat4.translate(modelMatrix, cur_obj.position);
        modelMatrix = mat4.rotate(modelMatrix, cur_obj.angle, cur_obj.angleMoveIter * (Math.PI/180.0) );
        cur_obj.model = modelMatrix;
        const normalMatrix = mat4.transpose(mat4.inverse(modelMatrix));
        cur_obj.modelNormal = normalMatrix;

        // buffers from obj
        //
        const verticesBuffer = device.createBuffer({
            label: 'vertex buffer object' + cur_obj.name,
            size: cur_obj.obj.vertices.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        cur_obj.verticesBuffer = verticesBuffer;
        device.queue.writeBuffer(cur_obj.verticesBuffer, 0, cur_obj.obj.vertices);
        const colorBuffer = device.createBuffer({
            label: 'color attribute object' + cur_obj.name,
            size: colorData.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        cur_obj.colorBuffer = colorBuffer;
        device.queue.writeBuffer(cur_obj.colorBuffer, 0, colorData);
        const textureBuffer = device.createBuffer({
            label: 'texture buffer' + cur_obj.name,
            size: cur_obj.obj.textures.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        cur_obj.textureBuffer = textureBuffer;
        device.queue.writeBuffer(cur_obj.textureBuffer, 0, cur_obj.obj.textures);
        const normalBuffer = device.createBuffer({
            label: 'normal buffer' + cur_obj.name,
            size: cur_obj.obj.normals.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        cur_obj.normalBuffer = normalBuffer;
        device.queue.writeBuffer(cur_obj.normalBuffer, 0, cur_obj.obj.normals);
        const indexBuffer = device.createBuffer({
            label: 'index buffer' + cur_obj.name,
            size: cur_obj.obj.indexes.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });
        cur_obj.indexBuffer = indexBuffer;
        device.queue.writeBuffer(cur_obj.indexBuffer, 0, cur_obj.obj.indexes);

        // buffer from custom
        //
        let uniformBuffer = device.createBuffer({
            label: 'uniform buffer model' + cur_obj.name,
            size: cur_obj.model.byteLength,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        cur_obj.modelBuffer = uniformBuffer;
        device.queue.writeBuffer(cur_obj.modelBuffer, 0, cur_obj.model);
        let uniformBufferNormalMatrix = device.createBuffer({
            label: 'uniform buffer normal matrix' + cur_obj.name,
            size: cur_obj.modelNormal.byteLength,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        cur_obj.modelNormalBuffer = uniformBufferNormalMatrix;
        device.queue.writeBuffer(cur_obj.modelNormalBuffer, 0, cur_obj.modelNormal);

        // Create a texture
        //
        const texture = device.createTexture({
            label: "texture obj" + cur_obj.name,
            size: [cur_obj.textureBitmap.width, cur_obj.textureBitmap.height],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
        });
        device.queue.copyExternalImageToTexture(            // Similar to writeBuffer but for textures
            { source: cur_obj.textureBitmap },
            { texture: texture },
            [cur_obj.textureBitmap.width, cur_obj.textureBitmap.height]
        );
        cur_obj.texture = texture;

        // create bind group with the resources
        //
        console.log('STARTUP: Creating bind groups...' + cur_obj.name);
        let bindGroup = device.createBindGroup({
            layout: bindGroupLayout,
            entries: [{
                    binding: 0,
                    resource: { buffer: cur_obj.modelBuffer }
                }, {
                    binding: 1,
                    resource: { buffer: uniformBuffers.projection }
                }, {
                    binding: 2,
                    resource: { buffer: uniformBuffers.view }
                },{
                    binding: 3,
                    resource: sampler
                },{
                    binding: 4,
                    resource: cur_obj.texture.createView({
                        dimension: '2d',
                    })
                }, {
                    binding: 5,
                    resource: { buffer: uniformBuffers.lights}
                }, {
                    binding: 6,
                    resource: { buffer: cur_obj.modelNormalBuffer }
                }, {
                    binding: 7,
                    resource: { buffer: uniformBuffers.cameraPosition }
                }, {
                    binding: 8,
                    resource: { buffer: uniformBuffers.renderParamBuffer }
                },
            ]
        });
        cur_obj.bindGroup = bindGroup;
    }

    console.log('STARTUP: Finish all loading at startup...');
}

function find_index_object(name)
{
    for (let i = 0; i < config.objects.length; i++) {
        if (config.objects[i].name == name) {
            return i;
        }
    }
    return -1;
}

function react_events()
{
    for (const key in keys) {
        console.log(key);
        // ZQSD / WASD / Arrows
        if (key == 38 || key == 90 || key == 87) {
            config.camera.position = vec3.add(config.camera.position, vec3.mulScalar(config.camera.front, config.camera.speed));
        }
        if (key == 40 || key == 83) {
            config.camera.position = vec3.subtract(config.camera.position, vec3.mulScalar(config.camera.front, config.camera.speed));
        }
        if (key == 37 || key == 81 || key == 65) {
            config.camera.position = vec3.subtract(config.camera.position, vec3.mulScalar(vec3.normalize(vec3.cross(config.camera.front, config.camera.up)), config.camera.speed));
        }
        if (key == 39 || key == 68) {
            config.camera.position = vec3.add(config.camera.position, vec3.mulScalar(vec3.normalize(vec3.cross(config.camera.front, config.camera.up)), config.camera.speed));
        }
        // SPACE
        if (key == 32) {
            config.camera.position = vec3.add(config.camera.position, vec3.mulScalar(config.camera.up, config.camera.speed));
        }
        // SHIFT
        if (key == 16) {
            config.camera.position = vec3.subtract(config.camera.position, vec3.mulScalar(config.camera.up, config.camera.speed));
        }
    }
    mouses.updatesX_camera.forEach((element, index) => {
        // https://www.opengl-tutorial.org/beginners-tutorials/tutorial-6-keyboard-and-mouse/
        if (index >= mouses.updatesY_camera.length) {
            return;
        }
        let x = mouses.updatesX_camera[index]
        if (isNaN(x)) {
            x = 0;
        }
        let y = mouses.updatesY_camera[index]
        if (isNaN(y)) {
            y = 0;
        }
        config.camera.horizontalAngle += config.camera.speed * x * 0.002;
        config.camera.verticalAngle += config.camera.speed * y * 0.002;
    });
    mouses.updatesX_camera = [];
    mouses.updatesY_camera = [];
    const index_object = find_index_object(mouses.selected_object);
    if (index_object >= 0) {
        let position = config.objects[index_object].position;
        mouses.updatesX_move.forEach((element, index) => {
            if (index >= mouses.updatesY_move.length) {
                return;
            }
            let x = mouses.updatesX_move[index]
            if (isNaN(x)) {
                x = 0;
            }
            let y = mouses.updatesY_move[index]
            if (isNaN(y)) {
                y = 0;
            }
            position = vec3.add(position, vec3.mulScalar(config.camera.up, y * -0.02 * config.camera.speed));
            position = vec3.add(position, vec3.mulScalar(vec3.normalize(vec3.cross(config.camera.front, config.camera.up)), x * 0.02 * config.camera.speed))
        });
        config.objects[index_object].position = position;
    }
    mouses.updatesX_move = [];
    mouses.updatesY_move = [];
    mouses.wheel.forEach(element => {
        config.camera.fov += element * config.camera.speed * 0.02;
    });
    mouses.wheel = [];
}

// https://webgpufundamentals.org/webgpu/lessons/webgpu-multisampling.html
function update_multisample()
{
    // Get the current texture from the canvas context
    const canvasTexture = context.getCurrentTexture();

    // If the multisample texture doesn't exist or
    // is the wrong size then make a new one.
    if (!multisampleTexture ||
        multisampleTexture.width !== canvasTexture.width ||
        multisampleTexture.height !== canvasTexture.height) {

        // If we have an existing multisample texture destroy it.
        if (multisampleTexture) {
            multisampleTexture.destroy();
        }

        // Create a new multisample texture that matches our
        // canvas's size
        multisampleTexture = device.createTexture({
            label: "multisampleTexture",
            format: canvasTexture.format,
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
            size: [canvasTexture.width, canvasTexture.height],
            sampleCount: 4,
        });
    }
}

function update_fpsInfos(fpsInfos, fps)
{
    time.fpsAverage.push(fps);
    time.fpsTotal += fps;
    const fpsCalc = time.fpsTotal / (time.fpsAverage.length * 1.0);
    fpsInfos.innerText = "- " + fpsCalc.toFixed(2);
    if (time.fpsAverage.length >= 60*5) {
        time.fpsTotal -= time.fpsAverage[0];
        time.fpsAverage.shift();
    }
}

function update_objectInfos(objectInfos)
{
    const index_object = find_index_object(mouses.selected_object);
    if (index_object < 0) {
        return;
    }
    const obj = config.objects[index_object];
    let text = "";
    text += "-> " + obj.name + "\n";
    text += "- Position{"
    text += "x: " + obj.position[0].toFixed(2);
    text += ", y: " + obj.position[1].toFixed(2);
    text += ", z: " + obj.position[2].toFixed(2);
    text += "}\n";
    objectInfos.innerText = text;
}

function update_cameraInfos(cameraInfos)
{
    let text = "";
    text += "- Position{"
    text += "x: " + config.camera.position[0].toFixed(2);
    text += ", y: " + config.camera.position[1].toFixed(2);
    text += ", z: " + config.camera.position[2].toFixed(2);
    text += "}\n";
    text += "- Front{"
    text += "x: " + config.camera.front[0].toFixed(2);
    text += ", y: " + config.camera.front[1].toFixed(2);
    text += ", z: " + config.camera.front[2].toFixed(2);
    text += "}\n";
    text += "- Up{"
    text += "x: " + config.camera.up[0].toFixed(2);
    text += ", y: " + config.camera.up[1].toFixed(2);
    text += ", z: " + config.camera.up[2].toFixed(2);
    text += "}\n";
    text += "- FOV: " + config.camera.fov.toFixed(2) + "\n";
    cameraInfos.innerText = text;
}

function render(canvas, fpsInfos, cameraInfos, objectInfos)
{
    // Calculate FPS
    time.now = Date.now();
    const deltaTime = time.now - time.then;
    let fps = (1000.0 / (deltaTime)); time.then = time.now;

    update_multisample();

    // -------- Update render variables --------
    matrices.projection = mat4.perspective(config.camera.fov * Math.PI / 180.0, canvas.width / canvas.height, 0.1, 1000.0);
    device.queue.writeBuffer(uniformBuffers.projection, 0, matrices.projection);

    // Update key presses
    config.camera.speed = config.camera.speed_next * deltaTime * 0.01;
    react_events();

    const direction = vec3.create(
        Math.cos(config.camera.verticalAngle) * Math.sin(config.camera.horizontalAngle),
        Math.sin(config.camera.verticalAngle),
        Math.cos(config.camera.verticalAngle) * Math.cos(config.camera.horizontalAngle),
    );
    const right = vec3.create(
        Math.sin(config.camera.horizontalAngle - Math.PI / 2.0),
        0,
        Math.cos(config.camera.horizontalAngle - Math.PI / 2.0),
    );
    const up = vec3.cross(right, direction);
    config.camera.front = direction;
    config.camera.up = up;

    matrices.view = mat4.lookAt(
            config.camera.position,
            vec3.add(config.camera.position, config.camera.front),
            config.camera.up);
    device.queue.writeBuffer(uniformBuffers.view, 0, matrices.view);

    // update uniform camera and light position
    device.queue.writeBuffer(uniformBuffers.cameraPosition, 0, config.camera.position);

    // Get the current texture from the canvas context and set it as the texture to render.
    renderPassDescriptor.colorAttachments[0].view =
        multisampleTexture.createView();
    renderPassDescriptor.colorAttachments[0].resolveTarget =
        context.getCurrentTexture().createView();

    // -------- rendering  --------
    const encoder = device.createCommandEncoder({ label: 'the encoder' });
    const pass = encoder.beginRenderPass(renderPassDescriptor);
    pass.setViewport(0, 0, canvas.width, canvas.height, 0, 1);
    pass.setPipeline(pipeline);

    //light
    const lightCount = 16;
    const lightStructSize = 20;
    const lightDataSize = lightCount * lightStructSize;
    let lightArray = new Float32Array(lightDataSize);
    
    for (let i = 0; i < Math.min(lightCount, config.lights.length); i++) {
        const baseOffset = i * (lightStructSize);

        lightArray.set(config.lights[i].ia, baseOffset + 0);
        lightArray.set(config.lights[i].id, baseOffset + 4);
        lightArray.set(config.lights[i].is, baseOffset + 8);
        lightArray.set(config.lights[i].shininess, baseOffset + 12);
        lightArray.set(config.lights[i].position, baseOffset + 16);
    }
    device.queue.writeBuffer(uniformBuffers.lights, 0, lightArray);

    device.queue.writeBuffer(uniformBuffers.renderParamBuffer, 0, effec_select);

    for (let i = 0; i < config.objects.length; i++){
        let cur_obj = config.objects[i];
        cur_obj = cur_obj.codeFunc(cur_obj, deltaTime);
        config.objects[i] = cur_obj;
        pass.setBindGroup(0, cur_obj.bindGroup);

        let modelMatrix = mat4.create();
        mat4.identity(modelMatrix);
        modelMatrix = mat4.translate(modelMatrix, cur_obj.position);
        cur_obj.angleMoveIter += cur_obj.angleMove;
        modelMatrix = mat4.rotate(modelMatrix, cur_obj.angle, cur_obj.angleMoveIter * (Math.PI/180.0));
        cur_obj.model = modelMatrix;
        device.queue.writeBuffer(cur_obj.modelBuffer, 0, cur_obj.model);

        cur_obj.normal = mat4.transpose(mat4.inverse(modelMatrix));        // new
        device.queue.writeBuffer(cur_obj.normalBuffer, 0, cur_obj.normal);

        pass.setVertexBuffer(0, cur_obj.verticesBuffer);      // Set WebGPU using VBO
        pass.setVertexBuffer(1, cur_obj.colorBuffer);       // Set WebGPU using colors
        pass.setVertexBuffer(2, cur_obj.textureBuffer);     // Set WebGPU using texture coordinates
        pass.setVertexBuffer(3, cur_obj.normalBuffer);     // Set WebGPU using normals
        pass.setIndexBuffer(cur_obj.indexBuffer, 'uint32'); // Set WebGPU using index data
        pass.drawIndexed(cur_obj.obj.indexes.length);           // draw with indices
    }

    pass.end();

    const commandBuffer = encoder.finish();
    device.queue.submit([commandBuffer]);

    update_fpsInfos(fpsInfos, fps);
    update_cameraInfos(cameraInfos);
    update_objectInfos(objectInfos);
}

async function create_selectable(moveObject, document)
{
    for (let i = 0; i < config.objects.length; i++) {
        const opt = document.createElement("option");
        opt.value = config.objects[i].name;
        opt.text = config.objects[i].name;
        moveObject.add(opt, null);
    }
}

async function main(document)
{
    console.log("Starting WebGPU code (" + Date().toLocaleString() + ").");

    canvas = document.querySelector('canvas');
    const cameraSpeed = document.getElementById("cameraSpeed");
    const fpsInfos = document.getElementById("fpsInfos");
    const moveObject = document.getElementById("moveObject");
    const effect = document.getElementById("effect");
    const cameraInfos = document.getElementById("cameraInfos");
    const objectInfos = document.getElementById("objectInfos");

    // start code
    await setup(canvas);
    await startup(canvas);
    await create_selectable(moveObject, document);

    cameraSpeed.value = config.camera.speed * 1000;

    // Option 1 loop: define FPS
    const UPDATE_INTERVAL = 1000.0 / 30.0;
    setInterval(render, UPDATE_INTERVAL, canvas, fpsInfos, cameraInfos, objectInfos);

    // Check for resize
    const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
            const canvas = entry.target;
            const width = entry.contentBoxSize[0].inlineSize;
            const height = entry.contentBoxSize[0].blockSize;
            canvas.width = Math.max(1, Math.min(width, device.limits.maxTextureDimension2D));
            canvas.height = Math.max(1, Math.min(height, device.limits.maxTextureDimension2D));

            // need to recreate pipeline as depth texture will not match size
            create_pipeline(canvas);
        }
    });
    resizeObserver.observe(canvas);
    cameraSpeed.addEventListener("input", (e) => {
        config.camera.speed_next = e.target.value / 1000;
    });
    moveObject.addEventListener("change", (e) => {
        mouses.selected_object = e.target.value;
    });
    effect.addEventListener("change", (e) => {
        switch (e.target.value) {
            case "None":
                effec_select[0] = 0.0;
                break;
            case "uv":
                effec_select[0] = 1.0;
                break;
            case "toons":
                effec_select[0] = 2.0;
                break;
            case "normal":
                effec_select[0] = 3.0;
                break;
            default:
                effec_select[0] = 0.0;
                break;
        }
    });
    document.addEventListener("keydown", (e) => {
        if (mouses.clicked_camera) {
            keys[e.keyCode] = true;
        }
    });
    document.addEventListener("keyup", (e) => {
        delete keys[e.keyCode];
    });
    canvas.addEventListener("mousedown", (e) => {
        mouses.lastX = e.clientX;
        mouses.lastY = e.clientY;
        switch (e.button) {
            // RIGHT BUTTON
            case 2:
                mouses.clicked_camera = true;
                break;
            // RIGHT LEFT
            case 0:
                mouses.clicked_move = true;
                break;
            default:
                break;
        }
    })
    canvas.addEventListener("mouseup", (e) => {
        switch (e.button) {
            // RIGHT BUTTON
            case 2:
                mouses.clicked_camera = false;
                break;
            // RIGHT LEFT
            case 0:
                mouses.clicked_move = false;
                break;
            default:
                break;
        }
    })
    canvas.addEventListener("mousemove", (e) => {
        let x = e.clientX - mouses.lastX;
        mouses.lastX = e.clientX;
        if (isNaN(x)) {
            x = 0;
        }
        let y = e.clientY - mouses.lastY;
        mouses.lastY = e.clientY;
        if (isNaN(y)) {
            y = 0;
        }
        if (mouses.clicked_camera) {
            mouses.updatesX_camera.push(x);
            mouses.updatesY_camera.push(y);
        }
        if (mouses.clicked_move) {
            mouses.updatesX_move.push(x);
            mouses.updatesY_move.push(y);
        }
    });
    document.addEventListener("wheel", (e) => {
        mouses.wheel.push(e.deltaY);
    });
}
