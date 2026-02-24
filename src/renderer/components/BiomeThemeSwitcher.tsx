/**
 * BiomeThemeSwitcher - Theme switcher with portal animations
 * Switches between Minecraft biome themes
 */

import React, { useState, useEffect } from 'react';
import MCCard from './minecraft/MCCard';
import './BiomeThemeSwitcher.css';

export type BiomeType = 'ice-spikes';

interface Biome {
  id: BiomeType;
  name: string;
  icon: string;
  color: string;
  description: string;
}

const BIOMES: Biome[] = [
  {
    id: 'ice-spikes',
    name: 'Ice Spikes',
    icon: '❄️',
    color: '#0ea5e9',
    description: 'Frozen tundra',
  },
];

const BiomeThemeSwitcher: React.FC = () => {
  const [currentBiome, setCurrentBiome] = useState<BiomeType>('ice-spikes');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Load saved biome from localStorage on mount
  useEffect(() => {
    const savedBiome = localStorage.getItem('spa-launcher-biome') as BiomeType;
    if (savedBiome && BIOMES.some(b => b.id === savedBiome)) {
      setCurrentBiome(savedBiome);
      document.documentElement.setAttribute('data-biome', savedBiome);
    } else {
      // Set default biome
      document.documentElement.setAttribute('data-biome', 'ice-spikes');
    }
  }, []);

  const switchBiome = async (newBiome: BiomeType) => {
    if (newBiome === currentBiome || isTransitioning) return;

    setIsTransitioning(true);

    // 1. Trigger portal animation
    document.body.classList.add('biome-portal-transition');

    // 2. Play portal sound (optional - you'll need to add sound files)
    try {
      // const audio = new Audio('/sounds/portal-travel.ogg');
      // audio.volume = 0.3;
      // audio.play();
    } catch (err) {
      console.warn('Sound not available:', err);
    }

    // 3. Wait for portal animation to start
    await new Promise(resolve => setTimeout(resolve, 500));

    // 4. Change biome
    document.documentElement.setAttribute('data-biome', newBiome);

    // 5. Wait for transition to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 6. Remove transition class
    document.body.classList.remove('biome-portal-transition');

    // 7. Update state and save to localStorage
    setCurrentBiome(newBiome);
    localStorage.setItem('spa-launcher-biome', newBiome);

    setIsTransitioning(false);
  };

  return (
    <div className="biome-switcher">
      <h3 className="biome-switcher__title">Biome Theme</h3>
      <p className="biome-switcher__subtitle">
        Choose your launcher's visual theme
      </p>

      <div className="biome-grid">
        {BIOMES.map(biome => (
          <button
            key={biome.id}
            className={`
              biome-option
              ${currentBiome === biome.id ? 'biome-option--active' : ''}
              ${isTransitioning ? 'biome-option--disabled' : ''}
            `.trim().replace(/\s+/g, ' ')}
            onClick={() => switchBiome(biome.id)}
            disabled={isTransitioning}
            style={{ '--biome-color': biome.color } as React.CSSProperties}
            title={biome.description}
          >
            <span className="biome-option__icon">{biome.icon}</span>
            <span className="biome-option__name">{biome.name}</span>

            {currentBiome === biome.id && (
              <span className="biome-option__indicator">✓</span>
            )}

            {/* Hover glow effect */}
            <span className="biome-option__glow" aria-hidden="true"></span>
          </button>
        ))}
      </div>

      {isTransitioning && (
        <div className="biome-transition-overlay">
          <div className="biome-transition-portal"></div>
          <p className="biome-transition-text">Traveling to {BIOMES.find(b => b.id === currentBiome)?.name}...</p>
        </div>
      )}
    </div>
  );
};

export default BiomeThemeSwitcher;
