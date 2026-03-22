import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./UI/App.tsx";
import "./index.css";
import "./UI/UI.css";
import ErrorBoundary from "./UI/components/ErrorBoundary.tsx";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);