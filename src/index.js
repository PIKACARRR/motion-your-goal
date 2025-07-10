import React from 'react';
import ReactDOM from 'react-dom/client';
import './style/index.css';
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';
import { GoogleOAuthProvider } from '@react-oauth/google';

// ✅ 你的 Google client ID
const clientId = "164779046247-32plpf686mbgasdick4hhvp5bh8aj3k2.apps.googleusercontent.com";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
