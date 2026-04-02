import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global styles
import './styles/global.css';

// Biome theme system
import './styles/themes/biome-base.css';
import './styles/themes/biomes/ice-spikes.css';
import './styles/themes/biomes/cherry-blossom.css';


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
