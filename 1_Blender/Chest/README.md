# Render

## Romain Loyer

![render_image](Blender/Chest4K.png)

## Chest

### Images

- background image:
    - <https://johanlagesson.artstation.com/projects/6DEE5> [background image](./Blender/johan-lagesson-16.jpg)

- reference image:
    - <https://fr.pinterest.com/pin/406238828903474325/> [reference image](./References/ChestReference.jpg)

### Incremental_Work_Pictures

#### Reference
The first step was to use the reference image. To do this, in each coordinate (x, -x, y, -y, z, -z), I imported the image with the correct face and size.

I used a reference cube, the same size as the trunk, to place my reference images. The result is these different views:

![reference_cube_from_x_axis](<Incremental_Work_Pictures/1-reference_cube_x_axis.png>)

![reference_cube_from_y_axis](<Incremental_Work_Pictures/2-reference_cube_y_axis.png>)


#### General Shape
To create the general shape of the object, I created a cube and added points to create the good shape. I used the loop cut option for that. To create the feet of the trunk, I designed 1 trapezoid that I duplicated into 4 using Blender's “array” option. The aim is to create 4 lateral spaces. I also created a large cube to create a large horizontal space. The result is the general shape of the chest with its feet.

![general_chest_blender_view](<Incremental_Work_Pictures/3-a-general_chest_construction.png>)

![general_chest_x_axis_view](<Incremental_Work_Pictures/3-b-general_chest_construction.png>)

![general_chest_y_axis_view](<Incremental_Work_Pictures/3-c-general_chest_construction.png>)


#### Sides part
For this step, I reduced the middle part of the chest with an “invert extrude” and I added a triangle on the shape. I used a Boolean union condition to link this part to the chest and use the mirror function to the other side. 

![chest_side_part_beginning](<Incremental_Work_Pictures/4-a-side_part.png>)

For the top part, I created a recess using a shape that I applied with the mirror option as well. With the Boolean difference function, I can deform the chest.

![chest_side_part_recess](<Incremental_Work_Pictures/4-b-side_part.png>)

After that, I created a skull for the side part. To do that, I used a plan, I deleted all vertex except one and I started to create the skull shape. When I had finished, I just assembled the chest with the skull. 

![chest_side_y_axis_view](<Incremental_Work_Pictures/4-c-side_part.png>)


#### Front part
For the front part, I created 3 triangles to reduce the size of the chest.

![chest_down_beginning](<Incremental_Work_Pictures/5-a-face_down_part.png>)

![chest_down_end](<Incremental_Work_Pictures/5-b-face_down_part.png>)

I used the same technique to create a new skull. After that I wanted to create lock straps. It consists of two parts: a cylinder with a bevel and a form for closing the chest. And I connected it to the chest. 

![skull_and_lock_straps](<Incremental_Work_Pictures/5-face_middle_part.png>)

To finish this part, I created ornaments of the chest.

![ornaments](<Incremental_Work_Pictures/5-face_up_part.png>)


#### Details
I'll move on more quickly to the rest of the design. The aim is mainly to show evolution.

In this section, I've reworked the sides of the trunk, creating recesses and adding handles. For these, I created a cube, then two others on either side of the first. For the chain, I used a plan and reproduced its layout. I used a bevel and converted it into a curve. Then I added width to the bevel to create the tube shape. Finally, I converted it into a mesh and connected it to the supporting cubes.

![handles](<Incremental_Work_Pictures/6-handles.png>)

I made the ornaments for the back of the trunk and added the hinges. 

![chest_-x_axis_view](<Incremental_Work_Pictures/7-a-back_support.png>)

![chest_back_side](<Incremental_Work_Pictures/7-b-back_support.png>)

To finish this creation, I added some gemstones. The result is here: 

![final_result_without_color](<Incremental_Work_Pictures/8-final_result_without_color.png>)


#### Materials

To color the chest, I created 3 materials:

![colors](<Incremental_Work_Pictures/10-colors.png>)

#### Final result in blender

![final_result_with_color](<Incremental_Work_Pictures/9-final_result_with_color.png>)
