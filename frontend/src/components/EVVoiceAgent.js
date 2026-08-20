import React, { useEffect, useRef, useState } from 'react';

import './EVVoiceAgent.css';

const AGENT_ID = 'agent_6701knpzdtj4fjy85jkrc0kbqye9';
const ELEMENT_NAME = 'elevenlabs-convai';
const SCRIPT_URL = 'https://unpkg.com/@elevenlabs/convai-widget-embed';

let loaderPromise;

function loadElevenLabsWidget() {
  if (window.customElements?.get(ELEMENT_NAME)) {
    return Promise.resolve();
  }

  if (loaderPromise) {
    return loaderPromise;
  }

  loaderPromise = new Promise((resolve, reject) => {
    const waitForWidget = () => {
      if (window.customElements?.get(ELEMENT_NAME)) {
        resolve();
        return;
      }

      if (!window.customElements) {
        reject(new Error('Custom elements are not supported in this browser.'));
        return;
      }

      window.customElements.whenDefined(ELEMENT_NAME).then(resolve).catch(reject);
    };

    const handleError = (event) => {
      const failedScript = event.currentTarget;
      if (failedScript?.dataset.elevenlabsWidget === 'true') {
        failedScript.remove();
      }
      reject(new Error('ElevenLabs voice widget could not be loaded.'));
    };

    const existingScript =
      document.querySelector('script[data-elevenlabs-widget="true"]') ||
      Array.from(document.scripts).find((script) => script.src === SCRIPT_URL);

    if (existingScript) {
      existingScript.addEventListener('error', handleError, { once: true });
      waitForWidget();
      return;
    }

    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.type = 'text/javascript';
    script.dataset.elevenlabsWidget = 'true';
    script.addEventListener('load', waitForWidget, { once: true });
    script.addEventListener('error', handleError, { once: true });
    document.head.appendChild(script);
  });

  loaderPromise = loaderPromise.catch((error) => {
    loaderPromise = undefined;
    throw error;
  });

  return loaderPromise;
}

export default function EVVoiceAgent() {
  const hostRef = useRef(null);
  const widgetRef = useRef(null);
  const [status, setStatus] = useState('loading');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    setStatus('loading');

    loadElevenLabsWidget()
      .then(() => {
        if (cancelled || !hostRef.current || widgetRef.current) {
          return;
        }

        const widget = document.createElement(ELEMENT_NAME);
        widget.setAttribute('agent-id', AGENT_ID);
        widget.setAttribute('aria-label', 'Start a call with the TataEV Voice Agent');
        hostRef.current.appendChild(widget);
        widgetRef.current = widget;
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) {
          setStatus('error');
        }
      });

    return () => {
      cancelled = true;

      if (widgetRef.current?.parentNode) {
        widgetRef.current.parentNode.removeChild(widgetRef.current);
      }

      widgetRef.current = null;
    };
  }, [retryCount]);

  return (
    <aside className="ev-voice-agent-root" aria-label="TataEV voice assistant">
      <div ref={hostRef} className="ev-voice-agent-host" />

      {status === 'loading' && (
        <div className="ev-voice-agent-status" role="status">
          <span className="ev-voice-agent-spinner" />
          Loading Voice AI
        </div>
      )}

      {status === 'error' && (
        <button
          type="button"
          className="ev-voice-agent-status ev-voice-agent-retry"
          onClick={() => setRetryCount((count) => count + 1)}
        >
          Voice unavailable · Retry
        </button>
      )}
    </aside>
  );
}
