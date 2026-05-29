import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";

import App from "./App.tsx";
import "./index.css";

if (window.location.pathname !== "/") {
  window.history.replaceState(null, "", "/" + window.location.hash);
}

createRoot(document.getElementById("root")!).render(
  // <StrictMode>
  <HashRouter>
    <App />
  </HashRouter>
  // </StrictMode>
);
