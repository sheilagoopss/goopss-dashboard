import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    if (!error.message.includes('ResizeObserver')) {
      return { hasError: true };
    }
    return { hasError: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (!error.message.includes('ResizeObserver')) {
      console.error("Error:", error);
      console.error("Error Info:", errorInfo);
    }
  }

  public render() {
    return this.props.children;
  }
}

export default ErrorBoundary;

// Add this line at the end of the file
export {};
