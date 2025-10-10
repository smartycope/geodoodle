import ReactDOM from "react-dom/client";
import "./styling/index.css";
import App from "./App.jsx";
import { StrictMode } from "react";

ReactDOM.createRoot(document.getElementById("root")).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
