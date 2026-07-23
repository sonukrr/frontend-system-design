import { useEffect, useRef } from "react";
import { useState } from "react";

// During an interview, you can mention a couple of refinements:

// Use performance.now() instead of Date.now(): It provides a monotonic, high-resolution clock that's not affected by system clock changes, making it ideal for measuring elapsed time.
// Use requestAnimationFrame for smoother UI updates: Instead of updating every 10ms with setInterval, use requestAnimationFrame and compute elapsed time each frame. This synchronizes updates with the browser's paint cycle and avoids unnecessary work when the tab isn't visible.

const StopWatch = () => {
  const [elapsedTime, setElapsedTime] = useState(0); // milliseconds
  const [isRunning, setIsRunning] = useState(false);

  const startTimeRef = useRef(0);
  const pausedTimeRef = useRef(0);

  const intervalRef = useRef(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedTime(Date.now() - startTimeRef.current);
      }, 10);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const formatTime = () => {
    const ms = elapsedTime % 1000;
    const mins = Math.floor(elapsedTime / 60000);
    const secs = Math.floor((elapsedTime % 60000) / 1000);

    return (
      String(mins).padStart(2, "0") +
      ":" +
      String(secs).padStart(2, "0") +
      ":" +
      String(ms).padStart(3, "0")
    );
  };

  const executeTimer = (action) => {
    switch (action) {
      case "start":
        setIsRunning(true);
        startTimeRef.current = Date.now() - pausedTimeRef.current;

        break;

      case "stop":
        setIsRunning(false);
        pausedTimeRef.current = elapsedTime;
        clearInterval(intervalRef.current);
        break;

      case "reset":
        clearInterval(intervalRef.current);
        setElapsedTime(0);
        pausedTimeRef.current = 0;
        startTimeRef.current = Date.now();
        setIsRunning(false);

        break;
      default:
        break;
    }
  };

  return (
    <div>
      <div>{formatTime()}</div>

      <div>
        <button disabled={isRunning} onClick={() => executeTimer("start")}>
          START
        </button>
        <button disabled={!isRunning} onClick={() => executeTimer("stop")}>
          STOP
        </button>
        <button
          disabled={isRunning && elapsedTime != 0}
          onClick={() => executeTimer("reset")}
        >
          RESET
        </button>
      </div>
    </div>
  );
};

export default StopWatch;
