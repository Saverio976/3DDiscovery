struct VSOutputStruct {
    @builtin(position) position: vec4f,
    @location(0) color: vec4f,
    @location(1) uv: vec2f,
    @location(2) normal : vec4f,
    @location(3) fragPos : vec4f,
    @location(4) viewPos : vec4f,
};

struct Light{
    ia : vec4f,
    id : vec4f,
    is : vec4f,
    shin : vec4f,
    lightPosition: vec4f,
}

struct ArrLights{
    lights : array<Light, 16>,
}

@group(0) @binding(3) var sam : sampler;
@group(0) @binding(4) var tex : texture_2d<f32>;
@group(0) @binding(5) var<uniform> lights: ArrLights;
@group(0) @binding(8) var<uniform> render_params: vec2f;


@fragment fn fs(fsInput : VSOutputStruct) -> @location(0) vec4f
{
    let colorTexture = textureSample(tex, sam, fsInput.uv); // reading texture samples
    let color = fsInput.color;                              // reading previous colours

    var result = vec4f(0.0, 0.0, 0.0, 1.0);

    // vectors
    let normal = normalize(fsInput.normal.xyz);
    let position = fsInput.fragPos.xyz;

    if (render_params.x > 0.5 && render_params.x < 1.5) {
        return vec4f(fsInput.uv.xy, 0., 1.);
    }

    if (render_params.x > 2.5 && render_params.x < 3.5) {
        return vec4f(normal.xy, normal.z / 2.0 + 0.5, 1.);
    }

    for (var i = 0; i < 16; i += 1) {
        let light = lights.lights[i];

        // light characteristics
        let ka = f32(light.ia.a);
        let ia = vec3f(light.ia.rgb);
        let kd = f32(light.id.a);
        let id = vec3f(light.id.rgb);
        let ks = f32(light.is.a);
        let is = vec3f(light.is.rgb);
        let shininess = f32(light.shin.x);

        let lightPosition = light.lightPosition.xyz;

        // Ambient
        let ambient = ka * ia;

        // Diffuse
        let lightDir = normalize(lightPosition - position);
        let lightMagnitude = dot(normal, lightDir);
        let diff = max(lightMagnitude, 0);
        let diffuse = kd * id * diff;

        // Specular
        let viewDir = normalize(fsInput.viewPos.xyz - position);
        let reflectDir = reflect(-lightDir, normal);

        let halwayDir = normalize(lightDir + viewDir);
        let spec = pow(max(dot(normal, halwayDir), 0.0), shininess);

        //let spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
        let specular = ks * is * spec;

        // Full Phong light calculation
        var output = vec4f(ambient + diffuse + specular , 1.0);
        output.x = clamp(output.x, 0.0, 1.0);
        output.y = clamp(output.y, 0.0, 1.0);
        output.z = clamp(output.z, 0.0, 1.0);
        result += output;
    }

    result.x = clamp(result.x, 0.0, 1.0);
    result.y = clamp(result.y, 0.0, 1.0);
    result.z = clamp(result.z, 0.0, 1.0);

    if (render_params.x > 1.5 && render_params.x < 2.5) {
        if ((result.x + result.y + result.z) / 3 < 0.55) {
            result = vec4f(0.3, 0.3, 0.3, 1.0);
        } else {
            result = vec4f(0.8, 0.8, 0.8, 1.0);
        }
    }

    result *= colorTexture;

    return result;
}
