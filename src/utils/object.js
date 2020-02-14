/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
define([],
() =>

  ({
    skip(numArgs, func) {
      let lastArgs = [];
      let lastResult = undefined;
      return function() {
        let i = 0;
        while (i < numArgs) {
          if (lastArgs[i] !== arguments[i]) {
            lastResult = func.apply(this, arguments);
            lastArgs = arguments;
            return lastResult;
          }
          i++;
        }
        return lastResult;
      };
    }
  })
);

