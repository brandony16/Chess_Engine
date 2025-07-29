import PropTypes from "prop-types";
import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: null };
  }

  /**
   * Updates state to show fallback UI
   * @param {Error} error - the error
   * @returns {{ hasError: true, errorMessage: string}}
   */
  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error.message };
  }

  /**
   * Log error
   * @param {Error} error
   * @param {{componentStack: string}} info
   */
  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert">
          <h1>Oops-something went wrong.</h1>
          <p>{this.state.errorMessage}</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      );
    }

    // If no error, render normally
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};
