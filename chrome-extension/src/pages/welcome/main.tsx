import React from "react";
import ReactDOM from "react-dom/client";
import "../../styles/base.css";
import "./welcome.css";
import { WelcomeApp } from "./welcome-app";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WelcomeApp />
  </React.StrictMode>
);
