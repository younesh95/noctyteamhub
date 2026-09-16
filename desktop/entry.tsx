import React from "react";
import { createRoot } from "react-dom/client";
import Home from "../app/page";
import Workspace from "../app/workspace/page";
import "../app/globals.css";
createRoot(document.getElementById("root")!).render(
  location.pathname.startsWith("/workspace") ? <Workspace /> : <Home />,
);
