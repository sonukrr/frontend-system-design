import { useEffect, useState } from "react";

const images = [
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30", // watch
  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9", // smartphone
  "https://images.unsplash.com/photo-1585386959984-a4155224a1ad", // shoes
];

const Carousel = () => {
  const [active, setActive] = useState(Math.floor((0 + images.length) / 2));


  useEffect(() => {
    // auto rotate image every 2 sec
    const intervalId = setInterval(() => {
      setActive((prev) => {
        const n = images.length;
        return (((prev + 1) % n) + n) % n;
      });
    }, 2000);
    
    return () => clearInterval(intervalId);
  }, [])

  const renderDots = () => {
    return (
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
        {images.map((_, i) => (
          <span
            key={i}
            className={active === i ? "active" : ""}
            onClick={() => setActive(i)}
            style={{ cursor: "pointer", margin: "0 4px" }}
          >
            *
          </span>
        ))}
      </div>
    );
  };


    const rotateImage = (step) => {
    const n = images.length;
    if (!n) return;

    // Normalize index for circular array traversal
    // Step 1: (prev + step) % n → may be negative in JS
    // Step 2: + n → shifts value to non-negative range
    // Step 3: % n → ensures index stays within [0, n-1]
    setActive((prev) => (((prev + step) % n) + n) % n);
    };


  return (
    <>
      <div style={{display: 'flex', alignItems: 'center'}}>
        <div style={{cursor: 'pointer', fontSize: 20, fontWeight: 'bold'}} onClick={() => rotateImage(-1)}> {"<"}</div>
        <div style={{ flex: 1 }}>
          {/* image */}
          <div>
            <img
              src={images[active]}
              fetchPriority="high"
              style={{ width: "100%", height: 400 }}
              alt={images[active]}
            />
          </div>

          <div>
            {/* clickable dots */}
            {renderDots()}
          </div>
        </div>
        <div style={{cursor: 'pointer', fontSize: 20, fontWeight: 'bold'}} onClick={() => rotateImage(1)}> {">"} </div>
      </div>
    </>
  );
};

export default Carousel;
