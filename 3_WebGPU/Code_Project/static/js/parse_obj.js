// Parsing function for an object
async function parseObj(objPath, scale)
{
    const text = await (await fetch(objPath)).text();
    const lines = text.split('\n');

    let tmpIndexes = [];
    let tmpVertices = [];
    let tmpTextures = [];
    let tmpNormals = [];

    let resultIndexes = [];
    let resultNormals = [];
    let resultTextures = [];
    let resultVertices = [];

    // Browse the lines of the .obj file
    for (const line of lines){
        const fragment = line.split(' ');
        switch(fragment[0]){
            // v: vertices
            case 'v':
                tmpVertices.push(scale * parseFloat(fragment[1]));
                tmpVertices.push(scale * parseFloat(fragment[2]));
                tmpVertices.push(scale * parseFloat(fragment[3]));
                break;
            // vn: normals
            case 'vn':
                tmpNormals.push(parseFloat(fragment[1]));
                tmpNormals.push(parseFloat(fragment[2]));
                tmpNormals.push(parseFloat(fragment[3]));
                break;
            // vt: textures
            case 'vt':
                tmpTextures.push(parseFloat(fragment[1]));
                tmpTextures.push(parseFloat(fragment[2]));
                break;
            // f: faces
            case 'f':
                for (let i = 1; i < fragment.length; i++){
                    tmpIndexes.push(fragment[i]);
                }
                break;
            default:
                break;
        }
    }

    let currentIndex = 0;
    for (let i = 0; i < tmpIndexes.length; i++) {
        const index = tmpIndexes[i].split('/');

        const i_texture = (parseInt(index[1]) - 1) * 2;
        const i_normal = (parseInt(index[2]) - 1) * 3;
        const i_vertice = (parseInt(index[0]) - 1) * 3;

        if (i_texture < 0 || i_normal < 0 || i_vertice < 0) {
            continue;
        }

        resultIndexes.push(currentIndex);

        resultTextures.push(tmpTextures[i_texture]);
        resultTextures.push(tmpTextures[i_texture + 1]);

        resultNormals.push(tmpNormals[i_normal]);
        resultNormals.push(tmpNormals[i_normal + 1]);
        resultNormals.push(tmpNormals[i_normal + 2]);

        resultVertices.push(tmpVertices[i_vertice]);
        resultVertices.push(tmpVertices[i_vertice + 1]);
        resultVertices.push(tmpVertices[i_vertice + 2]);

        currentIndex += 1;
    }

    // Convert the arrays to Float32Array and Uint32Array and return
    return {
        vertices: new Float32Array(resultVertices),
        indexes: new Uint32Array(resultIndexes),
        textures: new Float32Array(resultTextures),
        normals: new Float32Array(resultNormals),
    };
}

async function parseLambdaCode(lambdaCodePath)
{
    try {
        const text = await (await fetch(lambdaCodePath)).text();
        const newFunc = new Function("obj", "deltaTime", text);
        return newFunc;
    } catch (error) {
        return (obj, deltaTime) => {
            return obj;
        };
    }
}

async function parseObject(configPath, vec3)
{
    const json = await (await fetch(configPath)).json();
    const dirName = configPath.substring(0, configPath.lastIndexOf('/')) + "/";

    const name = json["name"];
    console.log("Parsing:{", configPath, "}:[", name, "]: STARTING");
    const position = vec3.create(json["position"][0], json["position"][1], json["position"][2]);
    const angle = vec3.create(json["angle"][0], json["angle"][1], json["angle"][2]);
    const angleMove = ("angleMove" in json) ? json["angleMove"] : 0.0;
    const scale = ("scale" in json) ? json["scale"] : 1.0;
    let objFilePath = json["obj"];
    if (!objFilePath.startsWith("http") && !objFilePath.startsWith("/")) {
        objFilePath = dirName + objFilePath;
    }
    const obj = await parseObj(objFilePath, scale);
    let textureFilePath = json["texture"];
    if (!textureFilePath.startsWith("http") && !textureFilePath.startsWith("/")) {
        textureFilePath = dirName + textureFilePath;
    }
    const textureBlob = await (await fetch(textureFilePath)).blob();
    const textureBitmap = await createImageBitmap(textureBlob);
    let codeFilePath = ("code" in json) ? json["code"] : "";
    if (!codeFilePath.startsWith("http") && !codeFilePath.startsWith("/")) {
        codeFilePath = dirName + codeFilePath;
    }
    const codeFunc = await parseLambdaCode(codeFilePath);
    console.log("Parsing:{", configPath, "}:[", json["name"], "]: OK");
    return {
        name,
        obj,
        textureBitmap,
        position,
        angle,
        angleMove,
        angleMoveIter: 0,
        codeFunc,
    }
}
