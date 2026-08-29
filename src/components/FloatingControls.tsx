"use client";

import { useEffect, useRef, useState } from "react";
import { useLocalStorage } from "@/lib/store/useLocalStorage";

function SnowEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const flakes: { x: number; y: number; r: number; d: number }[] = [];
    for (let i = 0; i < 100; i++) {
      flakes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 2 + 0.5,
        d: Math.random() * 1 + 0.5,
      });
    }

    let animationId: number;
    let angle = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.beginPath();
      
      angle += 0.01;
      for (let i = 0; i < flakes.length; i++) {
        const f = flakes[i];
        ctx.moveTo(f.x, f.y);
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2, true);
        
        f.y += Math.pow(f.d, 2) + 0.5;
        f.x += Math.sin(angle) * 1.5;
        
        if (f.y > height) {
          flakes[i] = { x: Math.random() * width, y: 0, r: f.r, d: f.d };
        }
      }
      ctx.fill();
      animationId = requestAnimationFrame(render);
    };

    render();

    const onResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[9999]"
      style={{ opacity: 0.8 }}
    />
  );
}

const MusicIcon = ({ playing, loading }: { playing: boolean; loading?: boolean }) => {
  if (loading) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin text-amethyst-300">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
      {playing && (
        <>
          <path d="M4 8l1.5-2 1.5 2" className="animate-pulse" />
          <path d="M16 6l1.5-2 1.5 2" className="animate-pulse" />
        </>
      )}
    </svg>
  );
};

const SnowIcon = ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v20M22 12H2M19.07 4.93l-14.14 14.14M19.07 19.07L4.93 4.93" />
  </svg>
);

const API_BASES = [
  "https://saavn.dev/api/search/songs?query=",
  "https://jiosavan-azure.vercel.app/api/search/songs?query=",
  "https://nepotuneapi.vercel.app/api/search/songs?query=",
];

async function fetchSongUrl(query: string) {
  for (const base of API_BASES) {
    try {
      const res = await fetch(`${base}${encodeURIComponent(query)}`);
      if (!res.ok) continue;
      const json = await res.json();
      const track = json?.data?.results?.[0];
      if (!track) continue;
      
      const downloadUrl = Array.isArray(track.downloadUrl) ? track.downloadUrl : [];
      const highestBitrate = downloadUrl[downloadUrl.length - 1];
      const url = typeof highestBitrate === "string" ? highestBitrate : highestBitrate?.link || highestBitrate?.url;
      if (url) return url;
    } catch (e) {
      // try next mirror
    }
  }
  return null;
}

export function FloatingControls() {
  const [snowOn, setSnowOn] = useLocalStorage("origin.snow", false);
  const [musicOn, setMusicOn] = useLocalStorage("origin.music", false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [loadingMusic, setLoadingMusic] = useState(false);

  useEffect(() => {
    if (!musicOn) {
      audioRef.current?.pause();
      return;
    }

    if (audioUrl && audioRef.current) {
      audioRef.current.play().catch(() => setMusicOn(false));
      return;
    }

    let active = true;
    setLoadingMusic(true);
    fetchSongUrl("All stars closer").then((url) => {
      if (!active) return;
      setLoadingMusic(false);
      if (url) {
        setAudioUrl(url);
        setTimeout(() => {
          audioRef.current?.play().catch(() => setMusicOn(false));
        }, 100);
      } else {
        console.error("Could not load music");
        setMusicOn(false);
      }
    });

    return () => { active = false; };
  }, [musicOn, audioUrl, setMusicOn]);

  return (
    <>
      {snowOn && <SnowEffect />}
      
      <audio ref={audioRef} src={audioUrl || undefined} loop preload="none" />

      <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+70px)] right-4 z-50 flex flex-col gap-2 lg:bottom-6 lg:right-6">
        <button
          onClick={() => setMusicOn(!musicOn)}
          title="Toggle Music"
          className={"grid h-11 w-11 place-items-center rounded-full border shadow-lg transition-all duration-300 active:scale-90 " + (musicOn ? "border-amethyst-500/50 bg-amethyst-500/20 text-amethyst-100 shadow-amethyst-500/20" : "border-white/10 bg-black/50 text-silver-400 hover:border-white/20 hover:text-silver-200 backdrop-blur-md")}
        >
          <MusicIcon playing={musicOn} loading={loadingMusic} />
        </button>
        
        <button
          onClick={() => setSnowOn(!snowOn)}
          title="Toggle Snow"
          className={"grid h-11 w-11 place-items-center rounded-full border shadow-lg transition-all duration-300 active:scale-90 " + (snowOn ? "border-blue-300/50 bg-blue-300/20 text-blue-100 shadow-blue-300/20" : "border-white/10 bg-black/50 text-silver-400 hover:border-white/20 hover:text-silver-200 backdrop-blur-md")}
        >
          <SnowIcon active={snowOn} />
        </button>
      </div>
    </>
  );
}
