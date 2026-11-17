import CoreTitleSlide from '@core/layouts/TitleSlide/TitleSlide.jsx';
import DiffusionCycleBackground from '../../components/DiffusionCycleBackground.jsx';

export default function TitleSlide(props) {
  return (
    <CoreTitleSlide
      {...props}
      renderBackground={(slide) =>
        slide.diffusionBackground ? <DiffusionCycleBackground /> :
        slide.background ? (
          <div
            className="title-bg"
            style={{ backgroundImage: `url(${slide.background})` }}
          />
        ) : null
      }
    />
  );
}
