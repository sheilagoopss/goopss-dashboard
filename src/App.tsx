import React from 'react';
import { AuthProvider } from "./contexts/AuthContext";
import Routes from "./routes/index.routes";
import ErrorBoundary from './components/ErrorBoundary';

const styles = {
  app: {
    fontFamily: "'Inter', sans-serif",
    height: "100vh",
    margin: "0",
    padding: "0",
    backgroundColor: "#ffffff",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    color: "#000000",
    marginBottom: "20px",
    padding: "20px",
    backgroundColor: "#ffffff",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
  },
  logo: {
    width: "50px",
    height: "50px",
  },
  title: {
    margin: "0",
    flex: 1,
    textAlign: "center" as const,
  },
  button: {
    padding: "10px 20px",
    backgroundColor: "#007bff",
    color: "#ffffff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  dropdown: {
    padding: "5px 10px",
    marginRight: "10px",
    borderRadius: "5px",
  },
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        {/* Wrap the entire app with AuthProvider */}
        <div style={styles.app}>
          <header style={styles.header}>
            <div style={styles.logoContainer}>
              <img src="/logo.png" alt="Goopss Logo" style={styles.logo} />
            </div>
            <h1 style={styles.title}>Goopss Dashboard</h1>
          </header>
          <Routes />
        </div>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;