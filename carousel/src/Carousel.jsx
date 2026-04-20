import { useEffect, useState } from "react";

const Carousel = ({ images }) => {
  const [active, setActive] = useState(Math.floor((0 + images.length) / 2));
  const [isPaused, setIsPaused] = useState(false);

  const rotateImage = (step) => {
    const n = images.length;
    if (!n) return;

    // (prev + step) % n - Basic modulo, but negative for backward navigation
    // + n - Shifts negative values to positive range
    // % n - Ensures final index is within [0, n-1]
    setActive((prev) => (((prev + step) % n) + n) % n);
  };

  useEffect(() => {
    // auto pause on hover or on focus
    if (isPaused) return;

    const intervalId = setInterval(() => {
      setActive((prev) => {
        const n = images.length;
        return (((prev + 1) % n) + n) % n;
      });
    }, 2000);

    // clean up function gets called on unmount and on every re-running the effect
    return () => clearInterval(intervalId);
  }, [isPaused, images.length]);

  useEffect(() => {
    // keyboard navigation
    const handleKeyDown = (e) => {
      if (e.key == "ArrowLeft") {
        rotateImage(-1);
      } else if (e.key == "ArrowRight") {
        rotateImage(1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // clean up
    return () => {
      window.removeEventListener("keydown", handleKeyDown); // runs ONCE on unmount of component
    };
  }, []); // Empty array -> runs once on mount of component

  const renderDots = () => {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
        role="group"
        aria-label="Slide navigation"
      >
        {images.map((_, i) => (
          <button
            key={i}
            className={active === i ? "active" : ""}
            onClick={() => setActive(i)}
            style={{
              cursor: "pointer",
              margin: "0 4px",
              background: "none",
              border: "none",
              fontSize: "20px",
            }}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={active === i ? "true" : "false"}
          >
            *
          </button>
        ))}
      </div>
    );
  };

  return (
    <div
      role="region"
      aria-label="Image carousel"
      aria-roledescription="carousel"
    >
      <div
        style={{ display: "flex", alignItems: "center" }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocus={() => setIsPaused(true)}
        onBlur={() => setIsPaused(false)}
      >
        <button
          style={{
            cursor: "pointer",
            fontSize: 20,
            fontWeight: "bold",
            background: "none",
            border: "none",
            padding: "10px",
          }}
          onClick={() => rotateImage(-1)}
          aria-label="Previous slide"
        >
          {"<"}
        </button>
        <div style={{ flex: 1 }}>
          {/* image */}
          <div
            role="group"
            aria-roledescription="slide"
            aria-label={`Slide ${active + 1} of ${images.length}`}
            aria-live="polite"
          >
            <img
              src={images[active]}
              style={{ width: "100%", height: 400 }}
              alt={`Product image ${active + 1}`}
              loading="eager"
              decoding="async"
            />
          </div>

          <div>
            {/* clickable dots */}
            {renderDots()}
          </div>
        </div>
        <button
          style={{
            cursor: "pointer",
            fontSize: 20,
            fontWeight: "bold",
            background: "none",
            border: "none",
            padding: "10px",
          }}
          onClick={() => rotateImage(1)}
          aria-label="Next slide"
        >
          {">"}
        </button>
      </div>
    </div>
  );
};

export default Carousel;
