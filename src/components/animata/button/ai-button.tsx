import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import { loadFull } from "tsparticles";
import type { ISourceOptions } from "@tsparticles/engine";
import Particles, { initParticlesEngine } from "@tsparticles/react";

const options: ISourceOptions = {
  key: "star",
  name: "Star",
  particles: {
    number: {
      value: 10,
      density: {
        enable: false,
      },
    },
    color: {
      value: "#ffffff",
    },
    shape: {
      type: "star",
      options: {
        star: {
          sides: 5,
        },
      },
    },
    opacity: {
      value: { min: 0.3, max: 0.8 },
      animation: {
        enable: true,
        speed: 0.5,
        sync: false,
      },
    },
    size: {
      value: { min: 2, max: 4 },
    },
    rotate: {
      value: {
        min: 0,
        max: 360,
      },
      direction: "random",
      animation: {
        enable: true,
        speed: 5,
        sync: false,
      },
    },
    move: {
      enable: true,
      speed: 3,
      direction: "none",
      random: true,
      straight: false,
      outModes: "out",
      // radius: 100,
      trail: {
        enable: true,
        length: 4,
      },
    },
  },
  background: {
    color: "transparent",
  },
  fullScreen: {
    enable: false,
    zIndex: 0,
  },
  detectRetina: true,
};

interface AiButtonProps {
  onClick?: (e: React.MouseEvent) => void;
  children?: React.ReactNode;
  isLoading?: boolean;
}

export default function AiButton({
  onClick,
  children = "Optimize",
  isLoading,
}: AiButtonProps) {
  const [particleState, setParticlesReady] = useState<"loaded" | "ready">();
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadFull(engine);
    }).then(() => {
      setParticlesReady("loaded");
    });
  }, []);

  const modifiedOptions = useMemo(() => {
    return {
      ...options,
      autoPlay: isHovering,
    };
  }, [isHovering]);

  return (
    <button
      onClick={onClick}
      className="group relative rounded-full bg-gradient-to-r from-blue-400 to-violet-500 p-[1px] transition-all duration-300 hover:scale-105"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      disabled={isLoading}
    >
      <div className="relative flex items-center justify-center gap-2 rounded-full bg-white bg-opacity-5 backdrop-blur-sm px-6 py-2.5">
        <Star className="size-4 text-white" />
        <span className="font-medium text-white">{children}</span>
      </div>
      {!!particleState && (
        <Particles
          id="tsparticles"
          className="pointer-events-none absolute inset-0 -z-10 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          particlesLoaded={async () => {
            setParticlesReady("ready");
          }}
          options={modifiedOptions}
        />
      )}
    </button>
  );
}
