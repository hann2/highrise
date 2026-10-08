import "../../highrise/looks/pieces/index";
import { render } from "preact";
import { App } from "./App";
import "../shared/tools.css";
import "./character-editor.css";
import { startTooltips } from "../shared/tooltips";

startTooltips(document.body);
render(<App />, document.getElementById("root")!);
