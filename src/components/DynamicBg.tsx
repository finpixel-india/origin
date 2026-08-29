"use client";

import { useEffect, useState } from "react";

export function DynamicBg() {
  const [hour, setHour] = useState(12);

  useEffect(() => {
    const updateHour = () => setHour(new Date().getHours());
    updateHour();
    const interval = setInterval(updateHour, 60000);
    return () => clearInterval(interval);
  }, []);

  let bg = "radial-gradient(ellipse at 50% 0%, #0c0c14 0%, #060608 50%, #040406 100%)"; // Default Day
  if (hour >= 21 || hour <= 4) {
    bg = "radial-gradient(ellipse at 50% 0%, #0a0a18 0%, #030308 50%, #020206 100%)"; // Night
  } else if (hour >= 5 && hour <= 7) {
    bg = "radial-gradient(ellipse at 50% 0%, #120a0e 0%, #0a0808 50%, #060608 100%)"; // Sunrise
  } else if (hour >= 8 && hour <= 16) {
    bg = "radial-gradient(ellipse at 50% 0%, #0c0c14 0%, #060608 50%, #040406 100%)"; // Day
  } else if (hour >= 17 && hour <= 20) {
    bg = "radial-gradient(ellipse at 50% 0%, #100a10 0%, #08060a 50%, #040406 100%)"; // Evening
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        pointerEvents: "none",
        background: bg,
        transition: "background 3s ease",
      }}
    />
  );
}
