import React, { useState, useRef, useEffect } from 'react';
import './MapPage.css';

const MAP_URL = 'http://spa.ado-dokidokihimitsukichi-daigakuimo.ru:30049/';

type WebviewEl = HTMLElement & { reload: () => void };

export default function MapPage() {
  const [loadError, setLoadError] = useState('');
  const webviewRef = useRef<WebviewEl>(null);

  useEffect(() => {
    const wv = webviewRef.current;
    if (!wv) return;

    const onFail = (e: any) => {
      if (e.errorCode !== -3) setLoadError(`Не удалось загрузить карту (${e.errorCode})`);
    };
    const onStart = () => setLoadError('');

    wv.addEventListener('did-start-loading', onStart);
    wv.addEventListener('did-fail-load', onFail);
    return () => {
      wv.removeEventListener('did-start-loading', onStart);
      wv.removeEventListener('did-fail-load', onFail);
    };
  }, []);

  return (
    <div className="map-page">
      {loadError && (
        <div className="map-error-bar">
          {loadError}
          <button className="map-error-retry" onClick={() => webviewRef.current?.reload()}>
            Повторить
          </button>
        </div>
      )}

      <div className="map-webview-wrap">
        <webview
          ref={webviewRef as any}
          src={MAP_URL}
          className="map-webview"
          allowpopups="true"
        />
      </div>
    </div>
  );
}
