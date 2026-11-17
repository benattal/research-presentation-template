# Light transport and neural rendering

[Latest status and resume point](../tracking/light-transport-and-neural-rendering.md) ·
[Presentation format](../implementation/presentations.md) ·
[Slide style](../style/slides.md) ·
[Visual validation](../implementation/visual-validation.md)

Build the lecture "Light transport and neural rendering" as the presentation
`presentations/light-transport-and-neural-rendering/` on the `guest-lecture`
branch. The lecture runs from one linear algebra identity,
$x = (I - A)^{-1} e$, through surface light transport, light transport
matrices and how O'Toole and colleagues probe them optically, volume
rendering, neural rendering with time of flight and structured light, and
the adjoint method that differentiates light transport. Each idea has an
interactive visual that renders real light transport, and every borrowed
slide, figure, and video is credited. Done means every slide below exists with notes, every
borrowed visual is credited on its slide and on a credits slide, every
interactive slide can be driven with the clicker alone, the deck captures
cleanly at every step, and it presents offline from a static build.

**Status:** todos 1 and 2 are done. On this branch, three framework
additions have landed (math in text, citations, and an audience view whose
stage fits beside the navigation bar), as have the flatland engine, the
operator explorer (forward and adjoint), the adjoint views, and the shared
slide layouts (`lectureTitle`, `sectionTitle`, `figures`, `derivation`).
At the user's request the sections are being built in parallel rather than
in order (todos 5 and 7–11). Next: finish the sections, then the review
cycles of todo 12.

## Immediate todos

Work these in order, one at a time. The user reviews the look at todo 4 and
each section's draft as it lands; slide wording stays the user's to change.

### Done

1. **Plan and tracker.** This file and its tracker exist.
2. **Rename and scaffold.** `presentations/guest-lecture/` is now
   `presentations/light-transport-and-neural-rendering/`. `presentation.json`
   lists every section and slide of [the lecture](#the-lecture); a slide not
   yet built is a `content` placeholder holding its title, subtitle, and
   planned visual, regenerated from the tables when they change. "This
   branch" in both agent files names the presentation. Gate: `npm run check`
   and `npm test`.

### Open

3. **Framework additions, on `main`.** Changes every research talk needs,
   each landing on `main` with fixture slides and browser tests:
   - *Math in text* (landed on this branch; goes to `main` with the rest):
     `$…$` and `$$…$$` in text fields through KaTeX, term colors through
     `\htmlClass`, the `content` layout's `subtitle`, and `SlideTitle` for
     custom layouts ([presentation format](../implementation/presentations.md#math-in-text)).
   - *Citations* (landed on this branch). An optional `sources.json` owns
     citation text; a slide's `credits` field
     (`[{ "source": "<key>", "what": "Fig. 3" }]`) renders a credit line; a
     core `credits` layout lists every cited source in order of first use;
     an unknown key is a load error.
   - *Audience layout* (landed on this branch). The stage fits the space
     beside the navigation bar, and the navigator stays centered for any
     number of slides; browser tests check nine window sizes.
   - *Offline fonts.* Inter, Source Serif 4, and JetBrains Mono bundled
     through `@fontsource` packages, so local mode needs no network.
   - *Still frames.* A core hook tells an animated layout it is being
     captured, so it draws its settled frame.
   - *Presentation tests.* `npm test` also runs
     `presentations/*/tests/*.test.mjs`.
   Gate: `npm test`, `npm run test:ui`, and `npm run check` on `main`, then
   on this branch after the merge.
4. **Visual identity.** `theme.css` (white slides, see
   [visual identity](#visual-identity)) and the layouts that set the look:
   `lectureTitle`, `sectionTitle`, `derivation`, `figures` (credited), and
   the room renders. Gate: the user approves the captured frames.
5. **Sources.** Download the decks, figures, and videos in
   [the source catalogue](#source-catalogue) into
   `assets/sources/<source-key>/`; register each in `sources.json`;
   extract the figures used into `public/slides/<slide-id>/`; push both
   directories to the bucket (`npm run assets -- push
   light-transport-and-neural-rendering`). Gate: every figure planned in
   [the lecture](#the-lecture) has a file and a verified source entry, and
   the user has decided on courtesy requests (see [decisions](#decisions)).
6. **Flatland engine.** *In progress, pulled forward with todo 8's
   `operatorExplorer` at the user's request.* The shared 2D model under
   `layouts/flatland/` ([design](#the-flatland-engine)), with unit tests.
   Gate: the tests pass (with `node --test` until presentation tests join
   `npm test`), and the room renders in under 4 ms a frame on this laptop.
7. **Section 1, linear algebra.** Slides and the `neumannSeries` and
   `randomWalks` visuals. Gate: capture review, then user review.
8. **Section 2, operator light transport.** `operatorExplorer` (forward
   modes, in progress with todo 6), `flatlandPaths`, `transportMatrix`,
   `opticalComputing`, `probingMatrix`. Gate as in 7.
9. **Section 3, volume rendering.** Gate as in 7.
10. **Section 4, neural rendering.** Includes `transientFlatland`. Gate as
    in 7.
11. **Section 5, adjoint light transport, and the closing.** The adjoint
    modes of `operatorExplorer`. Gate as in 7.
12. **Review cycles.** The user (2026-11-17): "Go through a few cycles of
    (a) finalizing content, (b) vetting it to see if it will flow/be
    understandable/be intuitive and visually appealing to a class of
    graduate students (incl. checking flow against slides from other real
    courses), (b) editing again". Each cycle: a reviewer who has not built
    the slides reads every captured frame and its notes, compares the
    order, explanations, rigor, and visuals with the professors' decks in
    the source catalogue, and lists problems by slide; the problems are
    fixed and recaptured. Gate: a cycle that finds nothing substantive.
13. **Rehearsal pass.** Notes for every slide; time a run-through with the
    presenter timer and cut the slides marked *optional* until it fits;
    full capture with no errors or warnings; `npm run build` and present
    from `npm run preview` with the network off; push assets. Gate: the
    [completion criteria](#completion-criteria).

## Decisions

The plan proceeds on the default in bold unless the user says otherwise.
Settled directions are quoted, with their dates, in the tracker.

- **Length:** **75 minutes, 66 slides**, four of them *optional* (those go
  first if a rehearsal runs long).
- **Audience:** **graduate and senior undergraduate students** who know
  calculus, linear algebra, and basic ray tracing, but not the radiative
  transfer equation.
- **Branch:** **keep `guest-lecture`** as the branch name, since the user
  works from it; only the presentation directory is renamed.
- **Courtesy requests:** **ask Matthew O'Toole and Ioannis Gkioulekas**
  before presenting their unpublished slide content; published paper
  figures and project videos are cited without asking.
- **Own decks:** if the user has talk slides for the neural rendering
  papers they co-authored (TöRF, Neural Fields for Structured Lighting,
  Flash Cache), they go in `assets/sources/` and are preferred over
  re-extracting paper figures.
- **Settled: white slides.** A plain white background with near-black
  text; renders of light are dark figures on the slide.
- **Settled: topic titles.** A title names the topic; a subtitle line
  states the slide's point ([slide style](../style/slides.md)).
- **Settled: one adjoint algorithm.** Section 5 presents radiative
  backpropagation as the practical algorithm and no later refinement of it.

## The lecture

Every section uses the equation $x = e + Ax$, whose solution is
$x = (I - A)^{-1} e$, with a different meaning for each symbol. The outline
and summary slides show this table as one line per section, and each
section divider's subtitle is that section's row:

| Section | $x$ | $e$ | $A$ |
|---|---|---|---|
| 1. Linear algebra | a vector | a source vector | a matrix with $\lVert A \rVert < 1$ |
| 2. Operator light transport | radiance leaving surfaces | emitted radiance | one bounce, $A = SG$: propagate, then scatter |
| 3. Volume rendering | radiance in a medium | emission and attenuated surface light | in-scattering, weighted by transmittance |
| 4. Neural rendering | the measurement | unknown | a learned field we invert for |
| 5. Adjoint light transport ⚡ | importance $y$ | the sensor $q$ | $A^\top$ |

Each table below lists a slide's id, its title, its subtitle, and its
visual. The title names the topic; the subtitle states the slide's one point
in one short line ([slide style](../style/slides.md)). The visual column
describes the visual for the builder; on the slide it carries short labels
only. **Interactive** names a visual from
[interactive visuals](#interactive-visuals); **borrowed** names keys in
[the source catalogue](#source-catalogue); **equation** is an
`equationBuild` derivation whose steps reveal one term each. Every slide has
a visual, and none is a heatmap of a matrix: an operator is shown by what it
does to light in the room.

### Opening

| Slide | Title | Subtitle | Visual |
|---|---|---|---|
| `title` | Light transport and neural rendering | Benjamin Attal, Postdoc. with David Lindell | interactive: `flatlandTitle`, light filling the room as paths accumulate; short labels only |
| `hook` | Light paths | A photograph sums light over every path to the camera | borrowed: direct and indirect light (`cmu15468-rendering` pp. 5–6) and direct/global separation (`nayar2006` Fig. 6) |
| `roadmap` | Outline | Each section uses $x = e + Ax$ with its own $x$, $e$, and $A$ | one line per section, one per build step, from the table above: "Linear algebra: $x = e + Ax$ for a matrix $A$", "Operator light transport: $x$ is the light leaving surfaces and $A = SG$ is one bounce", "Volume rendering: $x$ is the light in a medium and $A$ is in-scattering", "Neural rendering: $x$ is the measurement and the scene is learned from it", "Adjoint light transport: importance $y = (I - A^\top)^{-1} q$ gives gradients"; short labels only |

### 1. Linear algebra

Plain linear algebra, before any light: the scalar series, then the matrix
series and why it converges, seen through the eigenvectors of $A$. The user
(2026-11-17): "i think something more like a taylor series expansion could
be useful. perhaps also doing some intuitive spectral analysis of the
operator (and the effect of the neumann series/inverse applied to different
vectors) would be helpful".

| Slide | Title | Subtitle | Visual |
|---|---|---|---|
| `la-divider` | Linear algebra | $x = e + Ax$ for a vector $x$ and a matrix $A$ | `sectionTitle` |
| `la-fixed-point` | Fixed-point equation | The steady state satisfies $x = e + Ax$ | equation and a small example; short labels only |
| `la-geometric` | Geometric series | $1/(1 - a) = 1 + a + a^2 + \cdots$ for $\lvert a \rvert < 1$ | interactive: partial sums against $1/(1-a)$, slider for $a$; slow as $a \to 1$, divergent for $\lvert a \rvert \ge 1$ |
| `la-neumann` | Neumann series | $(I - A)^{-1} = I + A + A^2 + \cdots$ when $\rho(A) < 1$ | equation: with $A = V \Lambda V^{-1}$, $(I - A)^{-1} = V (I - \Lambda)^{-1} V^{-1}$: the scalar series on each eigenvector |
| `la-spectral` | Spectral view | Each eigen-direction of $e$ is scaled by $1/(1 - \lambda)$ | interactive 2D: eigenvectors of a 2×2 $A$, a draggable $e$, the partial sums as a tip-to-tail chain converging to $x$; steps: $e$ along the large and the small eigenvalue, a general $e$, an eigenvalue near 1 |
| `la-paths` | Path sums | Entries of $A^k$ sum the weights of $k$-step paths | interactive; short labels only |
| `la-apply` | Matrix-free solves | Iterative solvers need only products $Av$ | the size of a transport matrix ($10^{12}$ entries for a megapixel camera and projector) against products $Av$ |
| `la-random-walks` | Random walks | Random walks estimate $x$ without storing $A$ | interactive: `randomWalks`; cite `forsythe1950` |

### 2. Operator light transport

Light transport and the rendering equation:

| Slide | Title | Subtitle | Visual |
|---|---|---|---|
| `lt-divider` | Operator light transport | $x$ is surface radiance, $e$ emission, and $A = SG$ one bounce | `equationDivider` |
| `lt-transport` | Light transport | Light transport maps light sources to sensor measurements | borrowed: a projector–camera scene with direct, interreflected, subsurface, and volumetric paths, one path type per step (`otoole2016` Figs. 1.2–1.3) |
| `lt-radiance` | Radiance and reflectance | Radiance is constant along a ray until a surface scatters it | interactive: `operatorExplorer` with one beam, unchanged along the ray, then scattered by a diffuse, glossy, or mirror floor; short labels only; *optional* |
| `lt-rendering-equation` | Rendering equation | Outgoing light is emission plus scattered incident light | equation ending in $x = e + Ax$: equation: $L_e$, the integral over the hemisphere, the BRDF, the cosine, and the incident radiance traced to the visible point (`kajiya1986`; labelled as in `cmu15468-rendering` pp. 9–10), colored as on `la-fixed-point` |
| `lt-gather` | Scattering integral | A point gathers light from everything it can see | interactive: `operatorExplorer`, gather mode; short labels only |
| `lt-three-point` | Three-point form | Integrating over surfaces separates propagation from scattering | equation: the three-point form with visibility $V(x \leftrightarrow y)$ and $d\omega = \cos\theta_y \, dA / r$ in flatland ($r^2$ in 3D); $A = SG$, Arvo's $\mathcal{K}\mathcal{G}$ (`arvo1995`, `veach1997`) |
| `lt-operators` | Transport operator | One bounce is propagation followed by scattering: $A = SG$ | interactive: `operatorExplorer`, construct mode: $e$; $Ge$, light travelling from the lamp as a wavefront until it reaches a surface; $SGe$, the lit surfaces taking on their color and re-emitting it; $A = SG$ as one step; short labels only |
| `lt-iterate` | Multiple bounces | Each application of $A$ adds one bounce | interactive: `operatorExplorer`, iterate mode: $e$, $Ae$, …, $A^4 e$; short labels only |
| `lt-neumann-sum` | Global illumination | The bounces add up to the fully lit room | label $x = e + Ae + A^2 e + \cdots$; interactive: `operatorExplorer`, sum mode; beside it the bounce images of `seitz2005` (Fig. 1); short labels only |
| `lt-path-tracing` | Path tracing | Path tracing estimates the same sum with random walks | interactive: `flatlandPaths`, next to a thumbnail of `la-random-walks`; short labels only |

Light transport matrices, what applying them does, and how:

| Slide | Title | Subtitle | Visual |
|---|---|---|---|
| `lt-matrix` | Light transport matrix | Discrete lights and pixels make transport a matrix: $c = Tp$ | interactive: `transportMatrix`: a column of $T$ is the room lit by one light element, a row is the light one pixel collects; short labels only |
| `lt-relighting` | Relighting | Light adds, so any lighting is a sum of columns of $T$ | interactive: `transportMatrix`, painting mode; borrowed: light stage basis images and relit results (`debevec2000`); short labels only |
| `lt-dual` | Dual photography | $T^\top$ swaps the roles of camera and projector | borrowed: the card example of `sen2005` (Fig. 16) |
| `lt-how-to-apply` | Computing $Tp$ | $Tp$ can be stored, simulated, or measured optically | three panels, one image each: precomputed compressed transport (`ng2003`), a path-traced room (`flatlandPaths`), and a projector–camera setup (`cmu15463-transport` p. 25); short labels only |
| `lt-optical-computing` | Optical computing | A projector and a camera compute $Tp$ in one photograph | interactive: `opticalComputing`; borrowed: results of `otoole2010` and the optical power iteration of `cmu15463-transport` pp. 38–53; short labels only |

Sampling, manipulating, and capturing transport matrices:

| Slide | Title | Subtitle | Visual |
|---|---|---|---|
| `lt-direct-global` | Direct and global light | High-frequency patterns separate direct from global light | borrowed: results of `nayar2006` (Fig. 6); interactive: `probingMatrix`, pattern mode; short labels only |
| `lt-probing` | Light transport probing | Probing captures $c = (T \odot \Pi) \mathbf{1}$ without measuring $T$ | interactive: `probingMatrix`: direct-only and indirect-only renders of the room; equation: $\sum_k q_k \odot T p_k = (T \odot \Pi) \mathbf{1}$ with $\Pi = \sum_k q_k p_k^\top$ (`otoole2016` Fig. 3.1, `cmu15463-probing` pp. 2–9); short labels only |
| `lt-primal-dual` | Primal-dual coding | Coded projector and camera masks probe $T$ optically | borrowed: the setup and results of `otoole2012` |
| `lt-structured-light` | Structured light transport | Probing makes 3D scanning robust to indirect light | borrowed: results of `otoole2014` |
| `lt-epipolar` | Epipolar imaging | Epipolar probing works in real time and in sunlight | borrowed: videos of `otoole2015` and `achar2017`; the triptychs of `cmu15463-transport` pp. 76–117 |

### 3. Volume rendering

The radiative transfer equation in operator form, after the user
(2026-11-17): "there should also be a way to write the integro-differential
equation as operator light transport (I - A)x = b. This should also imply a
way to invert it by applying the integro-differential operator (which
requires access to derivatives)" and "The integral equation for volume
rendering just applies integrals/monte carlo to evaluate the operators and
does not require differentiation". Notation: $DL = KL + Q$ with
$D = \omega\cdot\nabla + \sigma_t$, $KL = \sigma_s \int f_p L\, d\omega'$,
$Q = \sigma_a L_e$; $A = D^{-1}K$, $b = D^{-1}Q$.

| Slide | Title | Subtitle | Visual |
|---|---|---|---|
| `vol-divider` | Volume rendering | Light interacts at every point of a medium | `sectionTitle` |
| `vol-media` | Participating media | Fog, skin, and clouds scatter light along each ray | borrowed: scattering media (`cmu15468-media`) |
| `vol-rte` | Radiative transfer equation | Radiance changes along a ray by four processes | interactive: `beamThroughMedium`, one term per step (`novak2018` Fig. 1) |
| `vol-operator` | Operator form | $(D - K)L = Q$ | equation: $D$ streaming and extinction (differential), $K$ in-scattering (integral over directions) |
| `vol-integrating-factor` | Integrating factor | Solving along a ray applies $D^{-1}$ | three steps to $L(0) = \int_0^d T(t) Q(t)\, dt + T(d) L(d)$; transmittance plotted beside it |
| `vol-vre` | Volume rendering equation | $x = b + Ax$ with $A = D^{-1}K$ | equation; labels: evaluated with integrals or Monte Carlo, no derivatives; the Neumann series gives the scattering orders (`novak2018`) |
| `vol-inverse` | Inverse operator | The inverse of the solution operator is local | $Q = (D - K)L$ needs derivatives of $L$ along rays; interactive 1D: sources recovered from $L(t)$, and noise in $L$ |
| `vol-emission-absorption` | Emission–absorption model | Without scattering, the integral is the one NeRF uses | $C = \int T \sigma c\, dt$; `max1995` Figs. 2–8 |
| `vol-quadrature` | Quadrature | Piecewise-constant quadrature gives alpha compositing | interactive: `quadratureExplorer` (`tagliasacchi2022`) |
| `vol-sampling` | Sampling | Sample placement matters more than sample count | interactive: `quadratureExplorer`, sampling mode |

### 4. Neural rendering

Neural radiance fields and the recipe that adapts them:

| Slide | Title | Subtitle | Visual |
|---|---|---|---|
| `nr-divider` | Neural rendering | $x$ is the measurement, and $A$ a learned field | `equationDivider` |
| `nr-nerf` | Neural radiance fields | NeRF fits a volume to photographs through the quadrature | borrowed: the pipeline figure (`mildenhall2020` Fig. 2) |
| `nr-applications` | Applications | The same recipe extends to lidar, time of flight, and relighting | borrowed: a grid of result videos, one per work (`mildenhall2020`, `attal2021`, `malik2023`, `malik2024`, `shandilya2023`) |
| `nr-recipe` | Neural rendering recipe | Model the measurement, discretize it, and differentiate it | NeRF's three equations in order: the integral, its quadrature, its gradient; a small copy heads each adaptation slide; short labels only |

Time of flight:

| Slide | Title | Subtitle | Visual |
|---|---|---|---|
| `nr-transient` | Transient light transport | Light arrives in order of path length | interactive: `transientFlatland`; borrowed: the light-pulse flythrough of `malik2024` and the transient images of `otoole2014tf`; short labels only |
| `nr-nlos` | Non-line-of-sight imaging | Time-resolved light reveals objects around a corner | borrowed: the confocal non-line-of-sight video of `otoole2018`; *optional* |
| `nr-cw-tof` | Continuous-wave time of flight | Each pixel measures a phasor whose phase encodes path length | interactive: `phasorToF`; borrowed: phase wrapping (`attal2021` Fig. 3); short labels only |
| `nr-cw-tof-quadrature` | Phasor quadrature | Each sample's weight carries a phase and a falloff | labels $e^{i 4 \pi f t / c}$ and $1 / t^2$; equation: a collocated source applies transmittance on the way out and back, the falloff, and the phase, derived from the recipe (notation checked against `attal2021` Fig. 2) |
| `nr-transient-quadrature` | Transient quadrature | Each sample's weight goes into its round-trip time bin | label $2t/c$; interactive: `transientQuadrature`; borrowed: time-resolved volume rendering (`malik2023` Fig. 2); short labels only |
| `nr-structured-light` | Structured light | Each sample also needs its transmittance toward the projector | interactive: `flatlandProjector`; borrowed: results of `shandilya2023` (Fig. 1); short labels only |
| `nr-representation` | Scene and measurement fields | A network can represent the scene or the measurement | a comparison: a physical field rendered through the model against a time-resolved radiance field (`malik2024`); whole transients per ray against one sampled time bin per ray; short labels only |

Inverse rendering:

| Slide | Title | Subtitle | Visual |
|---|---|---|---|
| `nr-baked` | Baked illumination | Relighting must separate the bounces that NeRF combines | interactive: `operatorExplorer`, sum mode: the lit room as NeRF stores it, beside its bounce images $e$, $Ae$, $A^2 e$, …; short labels only |
| `nr-radiance-cache` | Radiance caching | A radiance cache truncates the series after one bounce | equation: $x \approx e + A \hat{x}$; interactive: `operatorExplorer`, cache mode, with a NeRF as the cache $\hat{x}$; the bias appears where the cache was never observed; short labels only |
| `nr-flash-cache` | Flash Cache | Flash Cache reduces the bias of radiance caches | borrowed: videos and Fig. 3 of `attal2024` |
| `nr-memory` | Memory | Automatic differentiation stores every sample | interactive: `memoryMeter`; short labels only |

### 5. Adjoint light transport ⚡

The bolt refers to the title of `nimierdavid2020` ("an adjoint method for
lightning-fast differentiable rendering"). It is drawn as an inline SVG in
the adjoint color, not an emoji, so it looks the same on every machine.

The section differentiates $x = (I - A)^{-1} e$ in operator form, shows why
the transpose appears, and computes it the way section 2 computed light: by
successive bounces, now of importance under $A^\top = G^\top S^\top$. The
measurement is $m = q^\top x$; the parameters $\theta$ are albedos and
positions in the room.

| Slide | Title | Subtitle | Visual |
|---|---|---|---|
| `adj-divider` | Adjoint light transport ⚡ | $y$ is importance, emitted by the sensor $q$ | `equationDivider` |
| `adj-measurement` | Measurement | A pixel measures $m = q^\top x$ | interactive: `operatorExplorer`, measurement mode: the lit room $x$, one camera pixel, and the surfaces it sees; short labels only |
| `adj-derivative` | Differential light transport | $\partial_\theta x$ satisfies the transport equation with a new source | equation, three steps: differentiate $x = e + Ax$; collect $\partial_\theta x$; solve, $\partial_\theta x = (I - A)^{-1} (\partial_\theta A \, x + \partial_\theta e)$; interactive: `operatorExplorer`, derivative mode: the source on the wall whose albedo changes, then its transport through the room; short labels only |
| `adj-operator-derivative` | Operator derivative | $\partial_\theta A$ has a material term and a geometry term | equation: $\partial_\theta A = (\partial_\theta S) G + S (\partial_\theta G)$; interactive: `operatorExplorer`, derivative mode: a wall's albedo changes $S$ (the light the wall re-emits); the box's position changes $G$ (the shadows and the light the box intercepts); short labels only |
| `adj-adjoint` | Adjoint method | One transposed solve gives the derivative for every parameter | equation, three steps: $\partial_\theta m = q^\top (I - A)^{-1} \partial_\theta A \, x$; group $y^\top = q^\top (I - A)^{-1}$; so $y = (I - A)^{-\top} q = (I - A^\top)^{-1} q$; beside it, one forward solve per parameter against one adjoint solve per measurement; short labels only |
| `adj-importance` | Importance | Importance is emitted by the pixel and transported by $A^\top$ | interactive: `operatorExplorer`, adjoint construct mode: $q$, importance (cyan) leaving the pixel; $S^\top q$; $G^\top S^\top q$; reciprocity and importance as in `veach1997` and `christensen2003`; short labels only |
| `adj-neumann` | Adjoint Neumann series | Bounces of importance approximate $y$ | equation: $y = q + A^\top q + A^\top A^\top q + \cdots$; interactive: `operatorExplorer`, adjoint iterate and sum modes: $q$, $A^\top q$, $A^\top A^\top q$, … adding up to $y$; short labels only |
| `adj-sensitivity` | Sensitivity | Importance is the derivative of the pixel with respect to added light | interactive: `adjointViews` sensitivity view: $y = \partial m / \partial e$; light $\delta e$ added at a clicked surface, $q^\top \delta x$ against $y^\top \delta e$. The user (2026-11-17): "An interpretation of adjoints as "sensitivity" would also be useful" |
| `adj-gradient` | Gradient | Importance and forward light give the gradient | equation: $\partial_\theta m = y^\top \partial_\theta A \, x$; interactive: `operatorExplorer`, gradient mode: forward light $x$ and importance $y$ in the room; their product on each wall is the pixel's derivative with respect to that wall's albedo; last step: the adjoint gradient against a finite difference; short labels only |
| `adj-radiative-backprop` | Radiative backpropagation | The camera emits the loss gradient as adjoint radiance | label "constant memory"; borrowed: the overview figure (Fig. 2) and the speed-up over automatic differentiation (Fig. 8) of `nimierdavid2020`; interactive: `flatlandPaths`, adjoint mode; short labels only |
| `adj-quadrature` | Volume rendering gradient | The compositing gradient needs the color behind each sample | equation: $\partial C / \partial \sigma_i = \delta_i (T_{i+1} c_i - (C - C_{\le i}))$, computed in a second march from the final color $C$; interactive: `quadratureExplorer`, adjoint mode; short labels only; *optional* |
| `adj-volumes` | Differentiable volumes | Adjoint methods extend to heterogeneous volumes | borrowed: figures of `nimierdavid2022`; *optional* |

### Closing

| Slide | Title | Subtitle | Visual |
|---|---|---|---|
| `summary` | Summary | Every method here solves, inverts, or differentiates $x = e + Ax$ | the outline's five lines, each beside its section divider's render; short labels only |
| `credits` | Credits | Every borrowed figure, slide, and video, by section | core `credits` layout, generated from the slides |
| `questions` | Questions | — | `flatlandTitle`, settled |

## Interactive visuals

Every interactive visual follows these rules; what each one shows is in the
slide tables above and in its layout's docstring.

- **Looks like light.** The user: "I don't know about a heatmap. Things
  should look like real light transport." An operator is shown by what it
  does to the room (light travelling, reaching surfaces, taking on their
  color, filling the space) on a dark render background. No matrix is drawn
  as a heatmap.
- **Short labels only;** the notes hold the explanation. The visual fills
  the space under the title.
- **Clicker first.** Each state the speaker talks about is a build step;
  the mouse adds exploration, never a required state. Controls do not keep
  keyboard focus, so the clicker never presses them.
- **A check.** Each visual shows a number to compare: a partial sum against
  the exact solve, a quadrature against the exact integral, an adjoint
  gradient against a finite difference.
- **Deterministic.** Seeded randomness and fixed sample counts per step;
  the capture view draws each step's settled frame.

### The flatland engine

Section 2's, 4's, and 5's room visuals share one 2D model in
`layouts/flatland/`. 2D light transport has the same equations as 3D, with
$1/r$ falloff in place of $1/r^2$ (`jarosz2012`). `scene.js` builds a
$10 \times 6$ Cornell box (a ceiling lamp or a wall spotlight; a diffuse,
glossy, or mirror floor; a movable box) as patches × 16 direction bins;
`transport.js` holds $G$, $S$, $A = SG$, their adjoints, the solve, and the
fluence tables that render light in the room (with light in flight);
`render.js`, `pictures.js`, and `rooms.js` draw and cache it. Unit tests
(`tests/flatland.test.mjs`) check energy conservation of $G$ and $S$,
convergence of the series, $q^\top x = y^\top e$, and adjoint gradients
against finite differences.

## Visual identity

The user: "I think I would also like you to use a plain white background
for this presentation and black text (mostly)". Slides are white with
near-black text; every picture of light is a dark figure on the slide. A
color means the same thing everywhere (`theme.css`):

| Role | In renders | On the slide | Used for |
|---|---|---|---|
| light, by bounce | `--light-0` … `--light-4` | `--ink-light-0` … `--ink-light-4` | emission, then bounces 1–4+ |
| adjoint | `--adjoint` | `--ink-adjoint` | importance, gradients |
| medium | `--medium` | `--ink-medium` | media, density, transmittance |
| learned | `--learned` | `--ink-learned` | network outputs, measurements |

Equations color terms with `\htmlClass{term-…}{…}`. Titles are Source
Serif 4, text Inter, numbers JetBrains Mono, all bundled. A slide is a
title, one short subtitle, and one visual filling the rest; no cards,
pills, banners, or boxes with text in them. Layouts: `lectureTitle`,
`sectionTitle`, `figures`, `derivation`, and the interactive layouts.

## Sources and attribution

The citation rules of [slide style](../style/slides.md#citations) apply:
credit lines read "Authors et al., Venue Year" (a borrowed slide says
"Slide adapted from …"), nothing is cited from memory, and attribution
chains are kept ("from W. Jarosz, via I. Gkioulekas, CMU 15-468"). Also:

- `sources.json` is the one owner of citation text; slides cite by key, and
  the generated `credits` slide cannot drift.
- Prefer an author's own figure or video over a lecture slide that
  reproduces it. A no-derivatives license means the figure is shown whole.
- Source decks live in `assets/sources/<source-key>/`, extracted figures in
  `public/slides/<slide-id>/`; both go to the bucket, never to git
  ([DATA.md](../../DATA.md)). Each entry records the URL and the page or
  time a figure came from.

### Source catalogue

Every key cited above, grouped as the lecture uses them, with what to take
from each. URLs were checked in the source survey; todo 5 confirms each
entry against the work when its files are downloaded. "No license" means no
stated terms: show with credit and keep the credit chain.

- `cmu15468-rendering`: I. Gkioulekas, CMU 15-468 "Rendering equation and path tracing", adapted from W. Jarosz. https://imaging.cs.cmu.edu/15-468/lectures/lecture_11.pdf. pp. 5–6 direct and indirect light; pp. 9–10 the labelled rendering equation. No license.
- `cmu15468-media`: I. Gkioulekas, CMU 15-468 "Participating media", adapted from W. Jarosz, images courtesy of Kulla and Fajardo. https://imaging.cs.cmu.edu/15-468/lectures/lecture_12.pdf. Media photographs and renders; pp. 24–29 the differential beam. No license.
- `cmu15463-transport`: I. Gkioulekas, CMU 15-463 Fall 2020 lecture 25 "Light transport matrices", adapted from M. O'Toole. https://imaging.cs.cmu.edu/15-463/2020_fall/lectures/lecture25.pdf. p. 25 projector–camera diagram; pp. 38–53 optical power iteration; pp. 76–117 epipolar triptychs. No license.
- `cmu15463-probing`: I. Gkioulekas, CMU 15-463 Fall 2018 lecture 19b "Light transport probing". https://imaging.cs.cmu.edu/15-463/2018_fall/lectures/lecture19b.pdf. pp. 2–9 probing matrices. No license.
- `otoole2016`: M. O'Toole, PhD thesis, University of Toronto 2016. https://www.cs.cmu.edu/~motoole2/files/OToole_Matthew_P_201604_PhD_thesis.pdf. Figs. 1.2–1.3 projector–camera paths; Fig. 3.1 the probing equation.
- `forsythe1950`: Forsythe and Leibler 1950, Monte Carlo matrix inversion. Not in the survey; verify before citing.
- `seitz2005`: Seitz et al., ICCV 2005. https://www.cs.toronto.edu/~kyros/pubs/05.iccv.interreflect.pdf. Fig. 1 n-bounce images.
- `kajiya1986`: Kajiya 1986. https://courses.cs.duke.edu/fall09/cps124/notes/16_rendering/p143-kajiya.pdf. The rendering equation. ACM copyright.
- `arvo1995`: Arvo, PhD thesis, Yale 1995. https://www.cs.cornell.edu/courses/cs667/2005sp/readings/ArvoThesis.pdf. Ch. 6: operators, §6.3 norms, §6.4.1 adjoints.
- `veach1997`: Veach, PhD thesis, Stanford 1997. https://graphics.stanford.edu/papers/veach_thesis/. Chs. 3–4: operators, importance, adjoints.
- `christensen2003`: Christensen, IEEE TVCG 2003. https://research.pixar.com/docs/2003.Others.C.pdf. Adjoints and importance.
- `jarosz2012`: Jarosz et al., ACM TOG 2012. 2D global illumination. Disney-hosted PDF: show with credit, do not repost.
- `debevec2000`: Debevec et al., SIGGRAPH 2000. https://pauldebevec.com/Research/LS/. Light stage basis images and relit results.
- `sen2005`: Sen et al., SIGGRAPH 2005. https://graphics.stanford.edu/papers/dual_photography/. Fig. 2 primal and dual; Fig. 16 the card example.
- `ng2003`: Ng et al., SIGGRAPH 2003. https://graphics.stanford.edu/papers/allfreq/. Precomputed, compressed transport.
- `otoole2010`: O'Toole and Kutulakos, SIGGRAPH Asia 2010. https://www.cs.cmu.edu/~motoole2/opticalcomputing.html. Optical computing results.
- `nayar2006`: Nayar et al., SIGGRAPH 2006. https://www.merl.com/publications/TR2006-087. Fig. 6 separation results.
- `otoole2012`: O'Toole et al., SIGGRAPH 2012. https://www.cs.cmu.edu/~motoole2/primaldualcoding.html. Primal-dual coding setup and results.
- `otoole2014`: O'Toole et al., CVPR 2014. https://www.cs.cmu.edu/~motoole2/slt.html. Structured light transport results.
- `otoole2015`: O'Toole et al., SIGGRAPH 2015. https://www.cs.cmu.edu/~motoole2/energyefficientimaging.html, and the Episcan3D demo http://www.cs.cmu.edu/~ILIM/episcan3d/. Live epipolar videos.
- `achar2017`: Achar et al., SIGGRAPH 2017. https://www.cs.toronto.edu/~kyros/pubs/17.siggraph.epitof.pdf. Epipolar time of flight outdoors.
- `novak2018`: Novák et al., Eurographics 2018 (state of the art report). https://diglib.eg.org/handle/10.1111/cgf13383. Fig. 1 gains and losses; Fig. 2 null collisions. Disney-hosted PDF: show with credit, do not repost.
- `max1995`: Max 1995. https://courses.cs.duke.edu/cps296.8/spring03/papers/max95opticalModelsForDirectVolumeRendering.pdf. Figs. 2–8 one cloud under successive models.
- `tagliasacchi2022`: Tagliasacchi and Mildenhall 2022. https://arxiv.org/abs/2209.02417. Quadrature of the volume rendering integral. CC BY 4.0.
- `mildenhall2020`: Mildenhall et al. 2020. https://www.matthewtancik.com/nerf. Fig. 2 pipeline; result videos.
- `attal2021`: Attal et al., NeurIPS 2021. https://imaging.cs.cmu.edu/torf/. Fig. 2 volume rendering of phasors; Fig. 3 phase wrapping. CC BY 4.0 (arXiv 2109.15271).
- `malik2023`: Malik et al., NeurIPS 2023. https://anaghmalik.com/TransientNeRF/. Fig. 2 time-resolved volume rendering; result videos.
- `malik2024`: Malik et al., ECCV 2024. https://anaghmalik.com/FlyingWithPhotons/. Light-pulse flythrough; direct and global separation video.
- `shandilya2023`: Shandilya et al., ICCV 2023. https://imaging.cs.cmu.edu/nfsl/. Fig. 1 decomposition; Fig. 2 rig.
- `otoole2014tf`: O'Toole et al., SIGGRAPH 2014. https://www.cs.cmu.edu/~motoole2/temporalprobing.html. Transient images from temporal frequency probing.
- `otoole2018`: O'Toole et al., Nature 2018. http://www.computationalimaging.org/publications/confocal-non-line-of-sight-imaging-based-on-the-light-cone-transform/. Confocal non-line-of-sight video.
- `attal2024`: Attal et al., ECCV 2024. https://benattal.github.io/flash-cache/ (arXiv 2409.05867; the page's arXiv button links another paper). Videos of the radiance cache and control variate; Fig. 3 cache designs. CC BY 4.0.
- `nimierdavid2020`: Nimier-David et al., SIGGRAPH 2020. https://rgl.epfl.ch/publications/NimierDavid2020Radiative. Fig. 2 gradients emitted from the camera; Fig. 8 speed-up over automatic differentiation.
- `nimierdavid2022`: Nimier-David et al., SIGGRAPH 2022. https://rgl.epfl.ch/publications/NimierDavid2022Unbiased. Differentiable heterogeneous volumes.

## Rules

- Slide content is the user's: the plan proposes wording; the user decides.
- [Slide style](../style/slides.md): one message per slide, a visual on
  every slide, short labels, equations over explanation, one-line titles.
- Framework changes land on `main` first; this branch's layouts stay here.
- The deck never needs the network or a server.
- Layouts are written for the 1280×720 stage; animated layouts pause when
  the slide is not shown and clean up their animation frames.
- An interactive slide's narrative lives in its build steps; its notes say
  what to click. Derivations show at most three steps on a slide.

## Design as deployed

`presentation.json`, the placeholder slides, and `theme.css` exist; the
flatland engine is in progress. Beside them the presentation gains
`sources.json` (every cited work, by key), `layouts/index.js` registering
one `layouts/<Visual>/` directory per interactive visual and identity layout,
the shared model in `layouts/flatland/`, and its unit tests in `tests/`;
`public/` and `assets/` come from the bucket.

## Completion criteria

- Every slide in [the lecture](#the-lecture) exists, or the user cut it,
  with notes.
- Every borrowed visual has a credit line and a `sources.json` entry, and
  appears on the generated credits slide.
- Every interactive visual reaches each of its states with the clicker,
  and shows its check.
- `npm run check`, `npm test`, and `npm run test:ui` pass;
  `npm run capture -- light-transport-and-neural-rendering` reports no
  errors or warnings, and the frames have been looked at.
- A static build presents from `npm run preview` with the network off.
- `public/` and `assets/` are in the bucket, and a pull into a clean
  checkout reproduces them.
