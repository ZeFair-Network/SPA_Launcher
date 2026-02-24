import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Minecraft fonts (must load first)
import './styles/minecraft-fonts.css';

// Global styles
import './styles/global.css';

// Biome theme system
import './styles/themes/biome-base.css';
import './styles/themes/biomes/ice-spikes.css';

// Minecraft style overrides
import './styles/minecraft-overrides.css';

// Force Minecraft styles (absolute last - highest priority)
import './styles/minecraft-force.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
