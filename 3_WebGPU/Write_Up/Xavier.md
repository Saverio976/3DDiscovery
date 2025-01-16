# Write Up

From the lecture, the `example 16` had an example for a full featured webgpu usage.

1. But, the code was in one file, and everything things like "buffer" and "data" was separate. So i tried to create a basic "object" that had all the things required to render it.

This helped us work on the code simultaneously.

2. Following a [tutorial](https://webgpufundamentals.org/webgpu/lessons/webgpu-multisampling.html) I added multisampling.


3. From `example 16`, it was easy to add WASD/ZQSD(*yes we have french keyboard*).

4. I added the camera rotation following a [website](https://www.opengl-tutorial.org/beginners-tutorials/tutorial-6-keyboard-and-mouse/). This rotation is only for horizontal and vertical.

5. The camera was moving too fast for testing so I modified the value in the code. But found that adding a slider on the interface to update the camera speed was better for testing.

6. When trying to debug camera movement, I lost my object. To add more information of the different positions, I added the informations the camera, number of FPS, and the selected object position.


7. The part of the code that loaded the objects were directly in the code. I wanted a way to modify what is visible and which position they were at to be external of the code. So I created a config.json.


8. Soon after, I wanted to implement object movement with the mouse, so I changed the camera movement to only interact with the right click, and object movement with left click.

9. I didn't had much time so opted for the easy way: the use will not be able to click on the rendering to select the object, he will need to select which object to move from a selection menu.


10. When looking at the result, I found the rendering objects to look weird on some angles and thought that having the possibility to change the FOV could be fun.


11. They were too many ways to interact with the interface, so I created a simple help section.


12. The night before the end of the assignment, i tried to add some "code" for each objects that is run just before render. So each objects can modify its property. It worked.


Reflection:
- Doing something simple is fairly easy with webgpu, but once you want to add some complexity, i find that it just don't scale well. The code becomes messy...
- Next time I will try to better understand why in some case we are using a mat4 and sometimes just a vec3 is enough.
- We really wanted the textures to just works, but the mtl define more than one texture, and we didn't have the time to implement it.
- We started this part late, so we lowered our goals.
