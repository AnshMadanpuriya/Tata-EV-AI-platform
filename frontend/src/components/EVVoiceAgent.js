import React from 'react';

import './EVVoiceAgent.css';

const AGENT_ID = 'agent_6701knpzdtj4fjy85jkrc0kbqye9';

export default function EVVoiceAgent() {
  return React.createElement('elevenlabs-convai', {
    id: 'tataev-voice-agent',
    'agent-id': AGENT_ID,
    'aria-label': 'Start a call with the TataEV Voice Agent',
  });
}
