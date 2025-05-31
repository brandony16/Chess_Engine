/**
 * A variation of a map that has a max size that when reached, deletes the least used value in the map.
 * Helps limit memory usage so map doesnt blow up to millions of attack maps that are all pretty much unused.
 */
export class LRUMap {
  constructor(maxSize) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  /**
   * Gets like a map, but deletes and re-adds it so update when it was last called.
   *
   * @param {any} key - key to get in the map
   * @returns the value at the specifiec key
   */
  get(key) {
    if (!this.cache.has(key)) return undefined;

    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  /**
   * Sets like a map. Deletes and re-adds it if it is already in the map, and deletes the
   * oldest key if max size is reached.
   * @param {any} key - the key to set
   * @param {any} value - the value to store at the key
   */
  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, value);
  }

  /**
   * Determines if the map has a key
   *
   * @param {any} key - the key to find
   * @returns {boolean} if the map has the key
   */
  has(key) {
    return this.cache.has(key);
  }

  /**
   * Deletes a entry at a given key
   *
   * @param {any} key - the key to delete
   * @returns {boolean} if the deletion was successful
   */
  delete(key) {
    return this.cache.delete(key);
  }

  /**
   * Clears the cache.
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Gets the szie of the cache
   *
   * @returns {number} the size of the cache
   */
  getSize() {
    return this.cache.size;
  }
}

