/**
 * BiomeThemeSwitcher - Theme switcher with portal animations
 * Switches between Minecraft biome themes
 */

import React, { useState, useEffect } from 'react';
import './BiomeThemeSwitcher.css';

export type BiomeType = 'ice-spikes' | 'cherry-blossom';

interface Biome {
  id: BiomeType;
  name: string;
  label: string;
  icon: string;
  color: string;
  description: string;
}

export const BIOMES: Biome[] = [
  {
    id: 'cherry-blossom',
    name: 'Cherry Blossom',
    label: 'Spring',
    icon: '🌸',
    color: '#f43f5e',
    description: 'Sakura spring dawn',
  },
  {
    id: 'ice-spikes',
    name: 'Ice Spikes',
    label: 'Default',
    icon: '❄️',
    color: '#0ea5e9',
    description: 'Frozen tundra night',
  },
];

export const BIOME_META: Record<BiomeType, { biome: string; time: string; temp: string; icon: string }> = {
  'cherry-blossom': { biome: 'Cherry Blossom', time: 'Рассвет', temp: '+18°C', icon: '🌸' },
  'ice-spikes':     { biome: 'Ice Spikes',     time: 'Ночь',    temp: '−12°C', icon: '❄️' },
};

interface Props {
  currentBiome: BiomeType;
  onBiomeChange: (biome: BiomeType) => void;
}

const BiomeThemeSwitcher: React.FC<Props> = ({ currentBiome, onBiomeChange }) => {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const switchBiome = async (newBiome: BiomeType) => {
    if (newBiome === currentBiome || isTransitioning) return;

    setIsTransitioning(true);

    document.body.classList.add('biome-portal-transition');

    await new Promise(resolve => setTimeout(resolve, 400));

    document.documentElement.setAttribute('data-biome', newBiome);
    localStorage.setItem('spa-launcher-biome', newBiome);
    onBiomeChange(newBiome);

    await new Promise(resolve => setTimeout(resolve, 800));

    document.body.classList.remove('biome-portal-transition');
    setIsTransitioning(false);
  };

  return (
    <div className="biome-switcher-inline">
      {BIOMES.map(biome => (
        <button
          key={biome.id}
          className={`biome-tab ${currentBiome === biome.id ? 'biome-tab--active' : ''} ${isTransitioning ? 'biome-tab--disabled' : ''}`}
          onClick={() => switchBiome(biome.id)}
          disabled={isTransitioning}
          style={{ '--biome-color': biome.color } as React.CSSProperties}
          title={biome.description}
        >
          <span className="biome-tab__icon">{biome.icon}</span>
          <span className="biome-tab__label">{biome.label}</span>
        </button>
      ))}
    </div>
  );
};

export default BiomeThemeSwitcher;
