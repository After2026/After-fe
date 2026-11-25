import { useEffect, useRef, useState } from "react";
import bandiWave from "./assets/bandi-wave.svg";

export default function WelcomeBandi() {
  const canvas = useRef(null);
  const scene = useRef(null);
  const [ready, setReady] = useState(false);
  const [hops, setHops] = useState(0);

  useEffect(() => {
    let active = true;
    import("./lib/welcomeBandi")
      .then(({ mountWelcomeBandi }) => {
        if (!active) return;
        scene.current = mountWelcomeBandi(canvas.current);
        setReady(true);
      })
      .catch(() => {
        // Retain the source SVG fallback if WebGL cannot initialize.
      });
    return () => {
      active = false;
      scene.current?.dispose();
      scene.current = null;
    };
  }, []);

  return (
    <div className="welcome-bandi">
      <canvas
        className={ready ? "bandi-canvas ready" : "bandi-canvas"}
        ref={canvas}
        aria-hidden="true"
      />
      <button
        type="button"
        aria-label="반디를 눌러 점프시키기"
        onClick={() => {
          scene.current?.hop();
          setHops((value) => value + 1);
        }}
      >
        {!ready && (
          <img
            key={hops}
            className={hops ? "bandi-jump" : ""}
            src={bandiWave}
            alt=""
          />
        )}
      </button>
      <span className="bandi-hint" aria-live="polite">
        {hops === 0
          ? "반디를 눌러 보세요"
          : hops < 3
            ? "한 번 더!"
            : "반디가 신났어요"}
      </span>
    </div>
  );
}
