import React from 'react';
import ReactDOM from 'react-dom/client';
import './style.css';
import App from './app';

const isDev = import.meta.env.DEV;

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  isDev ? (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  ) : (
    <App />
  )
);