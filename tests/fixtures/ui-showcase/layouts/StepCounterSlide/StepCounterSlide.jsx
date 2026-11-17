/** Shows its build step: "Step <k> of <n>". */
export default function StepCounterSlide({ slide, buildStep }) {
  return <h2 className="step-counter">Step {buildStep + 1} of {slide.buildSteps.length}</h2>;
}
