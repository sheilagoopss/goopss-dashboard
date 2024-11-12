import React, { useEffect } from 'react';
import { AuthProvider } from "./contexts/AuthContext";
import Routes from "./routes/index.routes";
import ErrorBoundary from './components/ErrorBoundary';
import { useLocation, useNavigate } from 'react-router-dom';

function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  const navigate = useNavigate();

  useEffect(() => {
    const redirectPath = new URLSearchParams(window.location.search).get("redirect");
    if (redirectPath) {
      navigate(redirectPath, { replace: true });
    }
  }, [navigate]);

  return (
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
  );
}

export default App;