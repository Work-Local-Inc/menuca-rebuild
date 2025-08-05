import React, { useState, useEffect } from 'react';

export default function HealthCheck() {
  const [backendStatus, setBackendStatus] = useState('checking...');
  const [apiData, setApiData] = useState<any>(null);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch('/api/v1/analytics/dashboard/summary');
        if (response.ok) {
          const data = await response.json();
          setBackendStatus('✅ Connected');
          setApiData(data);
        } else {
          setBackendStatus(`❌ Error: ${response.status}`);
        }
      } catch (error) {
        setBackendStatus(`❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    checkBackend();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🔧 MenuCA Health Check</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Frontend Status:</h2>
        <p>✅ Next.js running on port 3001</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Backend API Status:</h2>
        <p>{backendStatus}</p>
      </div>

      {apiData && (
        <div>
          <h2>Sample API Response:</h2>
          <pre style={{ 
            background: '#f4f4f4', 
            padding: '10px', 
            overflow: 'auto',
            fontSize: '12px'
          }}>
            {JSON.stringify(apiData, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        <h2>Quick Links:</h2>
        <ul>
          <li><a href="/dashboard">📊 Analytics Dashboard</a></li>
          <li><a href="http://localhost:8000/health" target="_blank">🏥 Backend Health</a></li>
          <li><a href="http://localhost:8000/api/v1/analytics/dashboard/summary" target="_blank">📡 API Direct</a></li>
        </ul>
      </div>
    </div>
  );
}