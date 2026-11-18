Transition: NeRF models a photograph. The same approach works for any sensor whose measurement we can write as an integral along rays.

In the order of the derivations that follow:

- Lidar (Transient NeRF, Malik et al., NeurIPS 2023): a single-photon lidar measures a histogram of photon arrival times per pixel. Those histograms are rendered from the learned volume; the figure compares measured and rendered lidar data from a new viewpoint, as time slices and depth.
- Time of flight (TöRF, Attal et al., NeurIPS 2021): a continuous-wave time-of-flight camera measures a phasor per pixel. TöRF renders the raw phasors, not derived depth, and reconstructs color and depth of a dynamic scene from new viewpoints.
- Structured light (Shandilya et al., ICCV 2023): the raw images of a structured-light depth camera (an infrared dot pattern), rendered from new viewpoints; from them come depth, normals, and the direct and indirect components of the light.
- Propagating light (Flying with Photons, Malik et al., ECCV 2024): from multi-view transient measurements, it renders videos of a light pulse moving through the scene, from viewpoints that were never captured.

The sentence to remember: each of these is NeRF's recipe with a different measurement model.

The next slide states the recipe; the slides after it derive each measurement model, and the last of them (scene and measurement fields) comes back to propagating light.

Videos and figures from the project pages and papers; the time-of-flight video is cropped to the TöRF color and depth panels, without their titles.
