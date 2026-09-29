import React from "react";
import { createRoot } from "react-dom/client";
import Home from "../app/page";
import Workspace from "../app/workspace/page";
import "../app/globals.css";
import ConnectionGate from "../features/team/ConnectionGate";
createRoot(document.getElementById("root")!).render(
  <ConnectionGate>
    {location.pathname.startsWith("/workspace") ? <Workspace /> : <Home />}
  </ConnectionGate>,
);
