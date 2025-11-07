import { useEffect, useState } from "react";
import pikachuImg from "@/assets/pikachu.png";

interface Pikachu {
  id: number;
  x: number;
  y: number;
}

export const FloatingPikachu = () => {
  const [pikachus, setPikachus] = useState<Pikachu[]>([]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const newPikachu = {
        id: Date.now() + Math.random(),
        x: e.clientX,
        y: e.clientY,
      };
      
      setPikachus((prev) => [...prev, newPikachu]);
      
      // Remove after animation completes
      setTimeout(() => {
        setPikachus((prev) => prev.filter((p) => p.id !== newPikachu.id));
      }, 2000);
    };

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      {pikachus.map((pikachu) => (
        <img
          key={pikachu.id}
          src={pikachuImg}
          alt="Pikachu"
          className="absolute w-12 h-12 animate-float"
          style={{
            left: pikachu.x - 24,
            top: pikachu.y - 24,
            animation: "float 2s ease-out forwards",
          }}
        />
      ))}
    </div>
  );
};
