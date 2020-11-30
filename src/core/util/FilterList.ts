// A list that will only inlcude things that match the filter
export default class FilterList<T> implements Iterable<T> {
  private _items: Set<T> = new Set();

  constructor(private predicate: (item: T) => boolean) {}

  addIfValid(item: T) {
    if (this.predicate(item)) {
      this._items.add(item);
    }
  }

  remove(item: T) {
    if (this.predicate(item)) {
      this._items.delete(item);
    }
  }

  [Symbol.iterator]() {
    return this._items[Symbol.iterator]();
  }
}
