import React from 'react';
import { AuthProvider } from "./contexts/AuthContext";
import Routes from "./routes/index.routes";
import ErrorBoundary from './components/ErrorBoundary';
import { useLocation } from 'react-router-dom';
import { ConfigProvider } from 'antd';

function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <ConfigProvider
      theme={{
        token: {
          fontFamily: 'Poppins, -apple-system, BlinkMacSystemFont, sans-serif',
        },
      }}
    >
      <ErrorBoundary>
        <AuthProvider>
          <div style={{
            fontFamily: "'Inter', sans-serif",
            height: "100vh",
            margin: "0",
            padding: "0",
            backgroundColor: "#ffffff",
          }}>
            {isLoginPage && (
              <header style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                color: "#000000",
                marginBottom: "20px",
                padding: "20px",
                backgroundColor: "#ffffff",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                }}>
                  <img src="/logo.png" alt="Goopss Logo" style={{ width: "50px", height: "50px" }} />
                </div>
                <h1 style={{
                  margin: "0",
                  flex: 1,
                  textAlign: "center",
                }}>
                  Goopss Dashboard
                </h1>
              </header>
            )}
            <Routes />
          </div>
        </AuthProvider>
      </ErrorBoundary>
    </ConfigProvider>
  );
}

export default App;