import IOEventHandler from "../entity/IoEvents";
import {
  hasOnButtonDown,
  hasOnButtonUp,
  hasOnClick,
  hasOnInputDeviceChange,
  hasOnKeyDown,
  hasOnKeyUp,
  hasOnMouseDown,
  hasOnMouseUp,
  hasOnRightClick,
  hasOnRightDown,
  hasOnRightUp,
} from "../EntityFilter";
import FilterSet from "../util/FilterSet";
/**
 * Manages collections of IO event handlers with optimized filtering.
 * Maintains separate filtered sets for different input event types
 * to enable efficient event dispatching without checking every handler.
 */
export default class IOHandlerList implements Iterable<IOEventHandler> {
  all = new Set<IOEventHandler>();

  filtered = {
    onButtonDown: new FilterSet(hasOnButtonDown),
    onButtonUp: new FilterSet(hasOnButtonUp),
    onClick: new FilterSet(hasOnClick),
    onKeyDown: new FilterSet(hasOnKeyDown),
    onKeyUp: new FilterSet(hasOnKeyUp),
    onMouseDown: new FilterSet(hasOnMouseDown),
    onMouseUp: new FilterSet(hasOnMouseUp),
    onRightClick: new FilterSet(hasOnRightClick),
    onRightDown: new FilterSet(hasOnRightDown),
    onRightUp: new FilterSet(hasOnRightUp),
    onInputDeviceChange: new FilterSet(hasOnInputDeviceChange),
  };

  add(handler: IOEventHandler) {
    this.all.add(handler);
    for (const list of Object.values(this.filtered)) {
      list.addIfValid(handler);
    }
  }

  remove(handler: IOEventHandler) {
    this.all.delete(handler);
    for (const list of Object.values(this.filtered)) {
      list.remove(handler);
    }
  }

  [Symbol.iterator]() {
    return this.all[Symbol.iterator]();
  }
}
