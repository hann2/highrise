// This has to be imported first because it sets up globals that other modules
// expect to exist when they are evaluated.
import "./core/Polyfills";

import { main } from "./highrise/main";
main();
