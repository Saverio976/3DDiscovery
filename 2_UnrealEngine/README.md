# Unreal Engine Animation

![render_video](./Video.mp4)

- external assets:
    - [Pirate cave](https://www.fab.com/listings/9ae9d657-9035-41c3-a8f5-38e10de5d16b)

---

We imagined the animation sketch together, then:

- [Benjamin BOURGE](https://github.com/BenjosBourge) did the majority if the animation.

- [Romain LOYER](https://github.com/Hikoro) found the cave assets and created the scene

- [Xavier MITAULT](https://github.com/Saverio976) tweaked the output parameters for the video and fixed the Skull object issue.

---

Each objects were exported to .FBX format. We exported only the main object of each blender project. And imported into UnrealEgine.

The skull ad some problems during the FBX export: UnrealEngine crashed each time we tried to import it. We merged all the parts of the skull together (blender -> join) and convert it to mesh (blender -> convert to -> mesh). This fixed the import issue.

For the output, we used a plugin called "Movie Render Queue". The config is available [our MoviePipelineConfig](./Unreal_Project/Content/MoviePipelineConfig.uasset): We Added the "Command Line Encoder" (`Epic` Quality). With some basic anti-aliasing (`Spatial Sample Count` 2, `Temporal Sample Count` 2, FXAA (lightweight performence)). And the output is 1920x1080 with 60fps.
