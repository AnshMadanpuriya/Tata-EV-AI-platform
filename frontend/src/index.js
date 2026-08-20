import React from 'react';
import ReactDOM from 'react-dom/client';

import './index.css';

import App from './App';
import EVChatbot from './components/EVChatbot';
import EVVoiceAgent from './components/EVVoiceAgent';

const root = ReactDOM.createRoot(
  document.getElementById('root')
);

root.render(
  <React.StrictMode>
    <App />
    <EVChatbot />
    <EVVoiceAgent />
  </React.StrictMode>
);
