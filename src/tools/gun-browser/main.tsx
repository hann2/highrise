import { render } from "preact";
import "../shared/tools.css";
import { startTooltips } from "../shared/tooltips";
import { App } from "./App";
import "./gun-browser.css";

startTooltips(document.body);
render(<App />, document.getElementById("root")!);
