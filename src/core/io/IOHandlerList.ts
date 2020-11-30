import FilterList from "../util/FilterList";
import IOEventHandler from "../entity/IOEventHandler";

export default class IOHandlerList implements Iterable<IOEventHandler> {
  all = new Set<IOEventHandler>();

  filtered = {
    onButtonDown: new FilterList<IOEventHandler>((e) =>
      Boolean(e.onButtonDown)
    ),
    onButtonUp: new FilterList<IOEventHandler>((e) => Boolean(e.onButtonUp)),
    onClick: new FilterList<IOEventHandler>((e) => Boolean(e.onClick)),
    onKeyDown: new FilterList<IOEventHandler>((e) => Boolean(e.onKeyDown)),
    onKeyUp: new FilterList<IOEventHandler>((e) => Boolean(e.onKeyUp)),
    onMouseDown: new FilterList<IOEventHandler>((e) => Boolean(e.onMouseDown)),
    onMouseUp: new FilterList<IOEventHandler>((e) => Boolean(e.onMouseUp)),
    onRightClick: new FilterList<IOEventHandler>((e) =>
      Boolean(e.onRightClick)
    ),
    onRightDown: new FilterList<IOEventHandler>((e) => Boolean(e.onRightDown)),
    onRightUp: new FilterList<IOEventHandler>((e) => Boolean(e.onRightUp)),
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
