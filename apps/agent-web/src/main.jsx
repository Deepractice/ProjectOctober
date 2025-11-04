import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@deepractice-ai/agent-ui";
import "@deepractice-ai/agent-ui/styles.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
