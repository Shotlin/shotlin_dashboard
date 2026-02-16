"use client";

import React, { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { motion, stagger, useAnimate, useInView } from "framer-motion";

export const BackgroundGradient = ({
  children,
  className,
  containerClassName,
  animate = true,
}: {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  animate?: boolean;
}) => {
  const [animationEnabled, setAnimationEnabled] = useState(animate);

  useEffect(() => {
    // Disable animation after initial render if specified
    if (!animate) {
      const timeout = setTimeout(() => {
        setAnimationEnabled(false);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [animate]);

  return (
    <div
      className={cn(
        "relative p-[1px] bg-slate-950 overflow-hidden rounded-lg",
        containerClassName
      )}
    >
      {/* Gradient border effect */}
      <motion.div
        initial={{ opacity: 0.5, rotate: 0 }}
        animate={
          animationEnabled
            ? {
                opacity: 1,
                rotate: 360,
              }
            : {}
        }
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute inset-[-50px] h-[calc(100%+100px)] w-[calc(100%+100px)]"
        style={{
          background:
            "conic-gradient(from 0deg, transparent 0deg, #8b5cf6 60deg, #3b82f6 120deg, #8b5cf6 180deg, #3b82f6 240deg, transparent 360deg)",
        }}
      />
      <div className={cn("relative z-10", className)}>{children}</div>
    </div>
  );
};

export const TextGenerateEffect = ({
  words,
  className,
}: {
  words: string;
  className?: string;
}) => {
  const [scope, animate] = useAnimate();
  const isInView = useInView(scope);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (isInView && !hasAnimated) {
      const wordsArray = words.split(" ");
      const textToAnimate = wordsArray.map((word) => `<span>${word}</span>`).join(" ");
      
      animate(
        "span",
        {
          opacity: 1,
          y: 0,
        },
        {
          duration: 0.1,
          delay: stagger(0.05),
        }
      );
      
      setHasAnimated(true);
    }
  }, [isInView, animate, words, hasAnimated]);

  const renderWords = () => {
    const wordsArray = words.split(" ");
    return (
      <motion.div ref={scope}>
        {wordsArray.map((word, i) => (
          <motion.span
            key={`${word}-${i}`}
            className="inline-block opacity-0 translate-y-2"
            style={{ marginRight: "0.25em" }}
          >
            {word}
          </motion.span>
        ))}
      </motion.div>
    );
  };

  return <div className={cn(className)}>{renderWords()}</div>;
};

export const SparklesCore = ({
  id,
  background,
  minSize,
  maxSize,
  speed,
  particleDensity,
  className,
  particleColor,
  opacity,
}: {
  id: string;
  background?: string;
  minSize?: number;
  maxSize?: number;
  speed?: number;
  particleDensity?: number;
  className?: string;
  particleColor?: string;
  opacity?: number;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    };

    // Initial resize
    resizeCanvas();

    // Create particles
    const particleCount = Math.floor(
      ((canvas.width * canvas.height) / 1000) * (particleDensity || 1)
    );
    const newParticles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * (maxSize || 2) + (minSize || 1),
      speedX: (Math.random() - 0.5) * (speed || 0.2),
      speedY: (Math.random() - 0.5) * (speed || 0.2),
    }));

    setParticles(newParticles);

    const animate = () => {
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (background) {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      particles.forEach((particle) => {
        ctx.fillStyle = particleColor || "#ffffff";
        ctx.globalAlpha = opacity !== undefined ? opacity : 0.8;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();

        // Update particle position
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) {
          particle.speedX = -particle.speedX;
        }

        if (particle.y < 0 || particle.y > canvas.height) {
          particle.speedY = -particle.speedY;
        }
      });

      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, [
    background, 
    maxSize, 
    minSize, 
    particleColor, 
    particleDensity, 
    speed,
    opacity
  ]);

  return (
    <canvas
      ref={canvasRef}
      id={id}
      className={cn("absolute inset-0", className)}
    />
  );
};