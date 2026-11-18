Transition: NeRF models a photograph. The same approach works for any sensor whose measurement is an integral along rays.

- Step 1: Lidar: a histogram of photon arrival times per pixel, measured and rendered from a new viewpoint. Time of flight, in our TöRF: one complex number per pixel, from which we recover the color and depth of a moving scene. Structured light: the raw images of a depth camera's dot pattern. And propagating light: videos of a light pulse moving through a scene, from viewpoints never captured.

Remember: each of these is NeRF's recipe with a different measurement model.

If asked:
- Which papers? Transient NeRF, Malik et al., NeurIPS 2023; TöRF, Attal et al., NeurIPS 2021; Shandilya et al., ICCV 2023; Flying with Photons, Malik et al., ECCV 2024.
- What else does structured light give? Depth, normals, and the direct and indirect parts of the light.
