import React, { useEffect, useState } from 'react';
import { supabase, testConnection } from './lib/supabase';

function TestPage() {
  const [connectionStatus, setConnectionStatus] = useState('Loading...');
  const [envVariables, setEnvVariables] = useState({});

  useEffect(() => {
    // Check Supabase connection
    const checkConnection = async () => {
      try {
        const result = await testConnection();
        if (result.error) {
          setConnectionStatus(`Error: ${result.error}`);
        } else {
          setConnectionStatus('Connected to Supabase successfully!');
        }
      } catch (err) {
        setConnectionStatus(`Exception: ${err.message}`);
      }
    };

    // Get environment variables (only public ones)
    setEnvVariables({
      REACT_APP_SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL ? 'Set' : 'Not set',
      REACT_APP_SUPABASE_ANON_KEY: process.env.REACT_APP_SUPABASE_ANON_KEY ? 'Set' : 'Not set',
      NODE_ENV: process.env.NODE_ENV
    });

    checkConnection();
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Supabase Connection Test</h1>
      
      <h2>Environment Variables</h2>
      <pre>{JSON.stringify(envVariables, null, 2)}</pre>
      
      <h2>Supabase Connection Status</h2>
      <p>{connectionStatus}</p>
      
      <h2>Debug Info</h2>
      <p>URL: {window.location.href}</p>
      <p>Timestamp: {new Date().toISOString()}</p>
      
      <h2>Quick Links</h2>
      <ul>
        <li><a href="/login">Login Page</a></li>
        <li><a href="/signup">Signup Page</a></li>
        <li><a href="/dashboard">Dashboard (Protected)</a></li>
      </ul>
    </div>
  );
}

export default TestPage; 