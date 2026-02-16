"use client";
import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";  



// Custom cursor component
export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorRingRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { damping: 20, stiffness: 300 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);
  
  const ringX = useSpring(mouseX, { ...springConfig, damping: 30, stiffness: 200 });
  const ringY = useSpring(mouseY, { ...springConfig, damping: 30, stiffness: 200 });

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      mouseX.set(e.clientX - 8);
      mouseY.set(e.clientY - 8);
    };
    
    window.addEventListener("mousemove", moveCursor);
    
    return () => {
      window.removeEventListener("mousemove", moveCursor);
    };
  }, [mouseX, mouseY]);
  
  return (
    <>
      <motion.div
        ref={cursorRef}
        className="fixed w-4 h-4 bg-white rounded-full pointer-events-none mix-blend-difference z-50 hidden md:block"
        style={{
          left: cursorX,
          top: cursorY
        }}
      />
      <motion.div
        ref={cursorRingRef}
        className="fixed w-8 h-8 border-2 border-white rounded-full pointer-events-none mix-blend-difference z-50 hidden md:block"
        style={{
          left: ringX,
          top: ringY,
          translateX: "-50%",
          translateY: "-50%"
        }}
      />
    </>
  );
}