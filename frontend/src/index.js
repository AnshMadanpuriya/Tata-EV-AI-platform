import React from 'react';
import ReactDOM from 'react-dom/client';
import { ReactLenis } from 'lenis/react';

import 'lenis/dist/lenis.css';
import './index.css';

import App from './App';
import EVChatbot from './components/EVChatbot';

const root = ReactDOM.createRoot(
  document.getElementById('root')
);

root.render(
  <React.StrictMode>
    <ReactLenis
      root
      options={{
        lerp: 0.08,
        smoothWheel: true,
        wheelMultiplier: 0.9,
        touchMultiplier: 1.1,
      }}
    >
      <App />
      <EVChatbot />
    </ReactLenis>
  </React.StrictMode>
);