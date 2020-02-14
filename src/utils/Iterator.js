/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
define(["dojo/_base/declare"],
function(declare) {

  var Iterator = declare(null, {

    hasNext() { throw new Error("abstract"); },

    next() { throw new Error("abstract"); },

    concat() {
      const result = new Iterator();
      const allIterators = [this].concat(Array.prototype.slice.call(arguments));
      let current = 0;
      result.hasNext = function() {
        const iterator = allIterators[current];
        if (iterator.hasNext()) {
          return true;
        } else if (allIterators.length <= ++current) {
          return false;
        } else {
          return this.hasNext;
        }
      };

      result.next = function() {
        const it = allIterators[current];
        if (it.hasNext()) {
          return it.next();
        } else {
          current++;
          return this.next();
        }
      };

      return result;
    },


    map(func) {
      const result = new Iterator();
      result.hasNext = this.hasNext.bind(this);
      result.next = () => func(this.next());
      return result;
    },


    each(func) {
      return (() => {
        const result = [];
        while (this.hasNext()) {
          result.push(func(this.next()));
        }
        return result;
      })();
    },


    filter(func) {
      const result = new Iterator();
      let extracted = false;
      let last = undefined;

      result.hasNext = () => {
        if (extracted) {
          return true;
        } else {
          while (this.hasNext()) {
            const n = this.next();
            if (func(n)) {
              extracted = true;
              last = n;
              return true;
            }
          }
          return false;
        }
      };

      result.next = function() {
        if (this.hasNext()) {
          extracted = false;
          return last;
        } else {
          throw new Error("filter: empty iterator");
        }
      };

      return result;
    },


    take(n) {
      const result = new Iterator();
      let i = 0;

      result.hasNext = () => this.hasNext() && (i < n);
      result.next = () => {
        i++;
        return this.next();
      };

      return result;
    },


    takeWhile(func) {
      const result = new Iterator();
      let last = undefined;
      let extracted = false;
      let terminated = false;

      result.hasNext = () => {
        if (extracted) {
          return true;
        } else if (terminated || !this.hasNext()) {
          return false;
        } else {
          last = this.next();
          if (func(last)) {
            extracted = true;
            return true;
          } else {
            terminated = true;
            return false;
          }
        }
      };

      result.next = function() {
        if (extracted || this.hasNext()) {
          extracted = false;
          return last;
        } else {
          throw new Error("takeWhile: empty iterator");
        }
      };

      return result;
    },


    drop(n) {
      let i = 0;
      while (i++ < n) {
        this.next();
      }
      return this;
    },


    dropWhile(func) {
      const i = 0;
      while (this.hasNext()) {
        const last = this.next();
        if (!func(last)) {
          return Iterator.single(last).concat(this);
        }
      }

      return Iterator.emptyIterator;
    },


    sliding(size, step) {
      if (size !== step) {
        throw new Error("Not implemted!");
      }

      const result = new Iterator();
      result.hasNext = this.hasNext.bind(this);
      result.next = () => {
        const arr = [];
        let i = 0;
        while ((i++ < size) && this.hasNext()) {
          arr.push(this.next());
        }
        return arr;
      };
      return result;
    },


    toArray() {
      const result = [];
      while (this.hasNext()) {
        result.push(this.next());
      }
      return result;
    }
  }
  );


  Iterator.single = function(obj) {
    const result = new Iterator();
    let hasNext = true;
    result.hasNext = () => hasNext;
    result.next = function() {
      if (!hasNext) { throw new Error("empty: singleiterator"); }
      hasNext = false;
      return obj;
    };
    return result;
  };


  Iterator.fromArray = function(arr) {
    const result = new Iterator();
    let i = 0;
    result.hasNext = () => i < arr.length;
    result.next = () => arr[i++];
    return result;
  };


  Iterator.fill = function(obj, n) {
    const result = new Iterator();
    let i = 0;
    result.hasNext = () => i < n;
    result.next = function() {
      i++;
      return obj;
    };
    return result;
  };


  Iterator.range = function(min, max) {
    const result = new Iterator();
    let i = min;
    result.hasNext = () => i <= max;
    result.next = () => i++;
    return result;
  };


  const ei = (Iterator.emptyIterator = new Iterator());
  ei.hasNext = () => false;
  ei.next = function() { throw new Error("empty iterator"); };


  Iterator.splitString = function(str, separator) {
    if (str.length === 0) {
      return Iterator.emptyIterator;
    } else {
      let currentIndex = (str.lastIndexOf(separator, 0) === 0) ? separator.length : 0;
      let result = new Iterator();
      result.hasNext = () => currentIndex < str.length;
      result.next = function() {
        const nextIndex = str.indexOf(separator, currentIndex);
        result = undefined;
        if (nextIndex === -1) {
          result = str.substr(currentIndex);
          currentIndex = str.length;
        } else {
          result = str.substr(currentIndex, nextIndex - currentIndex);
          currentIndex = nextIndex + separator.length;
        }
        return result;
      };
      return result;
    }
  };

  Iterator.repeat = function(arr, n) {
    let i = 0;
    let j = 0;
    n = n || Number.MAX_VALUE;
    let result = new Iterator();
    result.hasNext = () => (i < n) || ((i === n) && (j < arr.length));
    result.next = function() {
      result = arr[j];
      j++;
      if (j === arr.length) {
        i++;
        j = 0;
      }
      return result;
    };
    return result;
  };

  return Iterator;
});
