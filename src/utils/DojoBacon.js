/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
define(["bacon/dist/Bacon"],
function(Bacon) {

  return {
    fromWidget(target, eventName) {
      return Bacon.fromBinder(function(handler) {
        const canceller = target.on(eventName, handler);
        return canceller.remove.bind(canceller);
      });
    },


    fromCheckBox(target, skipDuplicates) {
      const getter = target.get.bind(target, "checked");
      const result = this.fromWidget(target, "change")
        .map(getter)
        .toProperty(getter());
      if (skipDuplicates) { return result.skipDuplicates(); } else { return result; }
    },


    fromSelect(target, skipDuplicates) {
      const getter = target.get.bind(target, "value");
      const result = this.fromWidget(target, "change")
        .map(getter)
        .toProperty(getter());
      if (skipDuplicates) { return result.skipDuplicates(); } else { return result; }
    }
  };
});
