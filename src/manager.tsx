import ReactDOM from "react-dom/client";

import { ManagerApp } from "./pages/ManagerApp";
import "./styles.css";

document.body.classList.add("manager-body");

ReactDOM.createRoot(document.getElementById("root")!).render(<ManagerApp />);
