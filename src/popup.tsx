import ReactDOM from "react-dom/client";

import { PopupApp } from "./pages/PopupApp";
import "./styles.css";

document.body.classList.add("popup-body");

ReactDOM.createRoot(document.getElementById("root")!).render(<PopupApp />);
