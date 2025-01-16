# Write Up

## Load an object

The aim of this section is to load the various objects we've created in blender and display them in a web interface using WebGPU. To achieve this, we followed a number of steps.

### Get the .obj file

- To obtain it, we used blender, which allows us to export our objects in .obj format. This contains all the information needed to create an object's mesh, i.e. vertices, normals, texture coordinates, faces and the materials/textures used for each face. 

- When we export, we also obtain an .mtl file containing all the information linked to the texture description, such as the ambient light or the link to the texture used. 

- Before exporting, we need to parameterize our object. In our scene, we need to select only our object and apply Set **Origin>Origin to Geometry** to recenter the origin.

![Origin to geometry parameter](./screenshots/readme/1-originToGeometryParam.png)

- Next we need to snap the object to the 3D cursor.

![Snap parameter](./screenshots/readme/2-snapParam.png)

- Finally, to obtain the correct normals, we recalculated the outer normals.

![Normals parameter](./screenshots/readme/3-recalculateNormalsParam.png)

- We can now proceed with the export. We've activated a number of parameters for a successful export. The most important is to activate the **Triangulated mesh**”** option, which transforms faces into multiple faces of 3 vertices only. 

- The question arises as to **why triangulation is necessary**. To begin with, a triangle is the simplest geometric shape, so the GPU needs to do less calculation than, say, a rectangle. Rendering will therefore **be faster and more optimized**. What's more, most modeling and processing tools, as well as 3D libraries, require triangulated faces. It is therefore with a view to **standardization** that we need to activate this option.

![Export Blender](./screenshots/readme/4-export.png)

### Loading in the code
- All objects are located in **src/static/objects**. Here you'll find the .obj, the .mtl and a .png with the object's texture. All object components, at file level, are collected in a .json. Here's an example:

![json .obj](./screenshots/readme/5-jsonObj.png)

- The .json files for each object are loaded into **config.json**. 

![json config](./screenshots/readme/6-config.png)

Now to the code level:

- in the **startup** function of **code.js**, we execute the parseconfig function, which contains the path to config.json as a parameter. This function is present in **parse_config.js**. It is used to configure light, camera and object parameters. In this section, only the objects are described. 

- Using a parse of this json file, we'll retrieve the path to each object in order to launch the **parseObject** function. This function, present in the **parse_obj.js** file, will parse the json file relative to the object to retrieve its position, angle, rotation angle and name. It will also execute the **parseObj** function, which is used to retrieve key information from the .obj file, with a first loop that traverses the entire .obj file and a second that arranges the various parameters in order.

- Once all the information has been retrieved, we can feed the buffers and then the bindings that will display the various objects on the screen.

![result loading](./screenshots/readme/7-objects.png)

### How to improve this feature
- There's one area for improvement in object loading, and it has to do with textures. Currently, we load a texture and apply it to the object. This wasn't our initial idea. We wanted to render in the same way as on Blender. We didn't have time to realize it, but we'll describe it to explain it to the examiner.

- Overall, our aim was to **create sub-objects for each object**, so as to apply the right textures to them.

- When we parse an object, at the very beginning of the function, we also wanted to parse the .mtl file. It contains information that can greatly enhance the realism of rendering with lights and the type of texture used (diffuse, for example). 

- Next, we define an object in **several groups**, each representing a texture.

- Then, in the startup function, we create buffers and bindgroups **for each material group**. Finally, in the render function, we go through all the objects and all their groups to display on screen the parts of the object with the right textures.

- This was a complex set-up that required a great deal of research and testing. We've already spent too much time trying to implement it. A bug-free implementation of this feature would have required more development time than the imposed limit. We therefore decided to propose a simplified feature for texture loading.

## Reflection

- I'm personally disappointed that I wasn't able to load several textures on the same object. I spent a lot of time for a result not identical to the one on Blender.

- The code could be more optimized perhaps, but I think the organization is very coherent.
