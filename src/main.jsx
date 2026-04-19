import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { ProfileProvider } from './contexts/ProfileContext.jsx';
import { DataProvider } from './contexts/DataContext.jsx';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ProfileProvider>
        <DataProvider>
          <App />
        </DataProvider>
      </ProfileProvider>
    </AuthProvider>
  </React.StrictMode>
);
