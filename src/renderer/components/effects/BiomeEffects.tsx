/**
 * BiomeEffects - Particle and visual effects for each biome
 * Dynamically renders based on current biome theme
 */

import React, { useEffect, useState } from 'react';
import './BiomeEffects.css';

interface Particle {
  id: number;
  x: number;
  y: number;
  delay: number;
  duration: number;
}

const BiomeEffects: React.FC = () => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [currentBiome, setCurrentBiome] = useState<string>('ice-spikes');

  // Generate particles based on window size
  const generateParticles = () => {
    const generatedParticles: Particle[] = [];
    const windowArea = window.innerWidth * window.innerHeight;
    const baseArea = 1920 * 1080;
    const particleCount = Math.max(20, Math.min(50, Math.floor(30 * (windowArea / baseArea))));

    for (let i = 0; i < particleCount; i++) {
      generatedParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 3 + Math.random() * 4,
      });
    }

    setParticles(generatedParticles);
  };

  // Generate particles on mount and window resize
  useEffect(() => {
    generateParticles();

    const handleResize = () => {
      generateParticles();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Watch for biome changes
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-biome') {
          const newBiome = document.documentElement.getAttribute('data-biome');
          if (newBiome) {
            setCurrentBiome(newBiome);
            generateParticles();
          }
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-biome'],
    });

    // Get initial biome
    const initialBiome = document.documentElement.getAttribute('data-biome');
    if (initialBiome) {
      setCurrentBiome(initialBiome);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="biome-effects-wrapper">
      {/* Ambient glow effect */}
      <div className="biome-ambient-glow" />

      {/* Particle container */}
      <div className="biome-particles-container">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="particle"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Biome-specific vignettes */}
      {currentBiome === 'ice-spikes' && (
        <div className="frost-vignette" />
      )}
      {currentBiome === 'cherry-blossom' && (
        <div className="blossom-vignette" />
      )}
    </div>
  );
};

export default BiomeEffects;
