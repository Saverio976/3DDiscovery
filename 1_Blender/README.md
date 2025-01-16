# Blender Creation of Models

![render_image](./Final_Render_01.png)

- background image:
    - <https://johanlagesson.artstation.com/projects/6DEE5> [./johan-lagesson-16.jpg](background image)

---

- [Xavier MITAULT](https://github.com/Saverio976) [Cutlass](./Cutlass)

- [Romain LOYER](https://github.com/Hikoro) [Chest](./Chest)

- [Benjamin BOURGE](https://github.com/BenjosBourge) [Skull](./Skull)

---

For the lights, the process was to add the 3 spot lights that we saw in the lecture: 1 front right, 1 front left, 1 back left. We choose to have a mix between blue and yellow lights to match the atmosphere in the cave

Then we Added some pointlights to match the candle and the kinda window.

---

For the outputs, we were not satisfied on how the image was rendered using only 1920x1080, so we modified it to 3840x2160. We then Added a depth of field with a focus on the chest.
For the render engine, we tried to use the "Cycles" engine even if it took a long times to produce the image, but the results were bad for the blade. We sticked to the "EEVEE" engine. Adding the raytracing parameter. In the sampling category, we used 0 (unlimited) for the viewport, and we put 100 for the render (number of sampling per pixel).
