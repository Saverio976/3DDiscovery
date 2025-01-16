async function parseConfig(configPath, vec3, vec4)
{
    const json = await (await fetch(configPath)).json();
    const dirName = configPath.substring(0, configPath.lastIndexOf('/')) + "/";

    const objectsList = json["objects"];
    let objects = [];
    for (let i = 0; i < objectsList.length; i++) {
        let objFilePath = objectsList[i];
        if (!objFilePath.startsWith("http") && !objFilePath.startsWith("/")) {
            objFilePath = dirName + objFilePath;
        }
        const obj = await parseObject(objFilePath, vec3);
        objects.push(obj);
    }
    const lights = [];
    for (let i = 0; i < json["lights"].length; i++) {
        const light_ka = json["lights"][i]["ambient"];
        const light_ia = json["lights"][i]["ambient_color"];
        const light_kd = json["lights"][i]["diffuse"];
        const light_id = json["lights"][i]["diffuse_color"];
        const light_ks = json["lights"][i]["specular"];
        const light_is = json["lights"][i]["specular_color"];
        const light_shininess = json["lights"][i]["shininess"];
        const light_position = json["lights"][i]["position"];
        const light = {
            ia: vec4.create(light_ia[0], light_ia[1], light_ia[2], light_ka),
            id: vec4.create(light_id[0], light_id[1], light_id[2], light_kd),
            is: vec4.create(light_is[0], light_is[1], light_is[2], light_ks),
            shininess: vec4.create(light_shininess, 0.0, 0.0, 0.0),
            position: vec4.create(light_position[0], light_position[1], light_position[2], 0.0),
        };
        lights.push(light);
    }
    const light = lights[0];
    const camera_position = json["camera"]["position"];
    const camera_front = json["camera"]["front"];
    const camera_up = json["camera"]["front"];
    const camera_speed = json["camera"]["speed"];
    const camera_horizontal = json["camera"]["horizontalAngle"];
    const camera_vertical = json["camera"]["verticalAngle"];
    const camera_front_scale = json["camera"]["fov"];
    const camera = {
        position: vec3.create(camera_position[0], camera_position[1], camera_position[2]),
        front: vec3.create(camera_front[0], camera_front[1], camera_front[2]),
        fov: camera_front_scale,
        up: vec3.create(camera_up[0], camera_up[1], camera_up[2]),
        speed: camera_speed,
        speed_next: camera_speed,
        horizontalAngle: camera_horizontal,
        verticalAngle: camera_vertical,
    };
    return {
        objects,
        lights,
        camera,
        light
    }
}
