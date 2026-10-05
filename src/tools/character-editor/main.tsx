import "../../highrise/looks/pieces/index";
import { render } from "preact";
import { App } from "./App";
import "./character-editor.css";
import { startTooltips } from "./tooltips";

startTooltips(document.body);
render(<App />, document.getElementById("root")!);
