import React from "react";
import ReactDOM from "react-dom/client";
import { IconContext } from "@phosphor-icons/react";
import { App } from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./index.css";
import "./app.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <IconContext.Provider value={{ weight: "bold", size: "1.1em", className: "ph" }}>
        <App />
      </IconContext.Provider>
    </ErrorBoundary>
  </React.StrictMode>,
);
