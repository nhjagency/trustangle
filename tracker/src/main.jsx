import React from 'react';
import { createRoot } from 'react-dom/client';

import './styles.css';
// Registers the <image-slot> custom element used for client logos and the
// NHJ mark; must load before the first render.
import './components/image-slot.js';
// Populates window.CLIENTS / REAL_TASKS / TEAM_LEADERS / CLIENT_DETAILS.
import './data/portfolio.js';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App/>
  </React.StrictMode>
);
