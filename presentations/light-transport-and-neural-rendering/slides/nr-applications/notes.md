Transition: NeRF models a photograph. The same approach works for any sensor whose measurement can be written as an integral along rays.

In the order of the slides that follow:

- Lidar (Transient NeRF, Malik et al., NeurIPS 2023): a single-photon lidar records, for each pixel, a histogram of photon arrival times. The histograms are rendered from the learned volume; the figure compares measured and rendered lidar data from a new viewpoint, as time slices and depth.
- Time of flight (TöRF, Attal et al., NeurIPS 2021): a continuous-wave time-of-flight camera records one complex number per pixel, a phasor. TöRF renders the raw phasors rather than a depth map computed from them, and reconstructs the color and depth of a moving scene from new viewpoints.
- Structured light (Shandilya et al., ICCV 2023): the raw images of a structured-light depth camera (an infrared dot pattern), rendered from new viewpoints. From them come depth, normals, and the direct and indirect parts of the light.
- Propagating light (Flying with Photons, Malik et al., ECCV 2024): from transient measurements taken from several viewpoints, videos of a light pulse moving through the scene, rendered from viewpoints that were never captured.

The sentence to remember: each of these is NeRF's recipe with a different measurement model.

The next slide states the recipe. The slides after it derive each measurement model, and the scene and measurement fields slide comes back to propagating light.

Videos and figures from the project pages and papers; the time-of-flight video is cropped to the TöRF color and depth panels, without their titles.
