/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
define(["dojo/_base/lang", "dojo/Deferred",
        "dojox/lang/functional"],
(lang, Deferred,
 df) =>

  ({
    resolve(obj) {
      const dfd = new Deferred();
      dfd.resolve(obj);
      return dfd.promise;
    },

    reject(obj) {
      const dfd = new Deferred();
      dfd.reject(obj);
      return dfd.promise;
    }
  })
);
