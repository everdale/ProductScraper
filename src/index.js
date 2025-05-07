/**
 * Application Entry Point
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';  // You'll need to create this file
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 