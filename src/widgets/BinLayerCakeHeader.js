/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
define(["dojo/_base/declare", "dojo/_base/lang",
        "./../utils/Iterator",
        "./AbstractLayerCakeHeader", "./Ruler"],
function(declare, lang,
 Iterator,
 AbstractLayerCakeHeader, Ruler) {

  return declare(AbstractLayerCakeHeader, {
    fontHeight: 12,
    fontWidth: 6,

    "-chains-": {
      constructor: "manual"
    },

    constructor(area, labelWidth) {
      this.ruler = new Ruler(area, labelWidth);
      return this.inherited(arguments);
    },

    setData(data, range) {
      this.inherited(arguments, [data, x => x]);
      this.ruler.setRange(range.min, range.max);

      if (this.currentSize) { return this.resize(this.currentSize); }
    },

    resize(s) {
      this.inherited(arguments);

      if (this.initialized) {
        return this.ruler.resize(s);
      }
    },

    _getRectanglesBarVerticalOffset() { return this.ruler.getHeight(); }
  });
});
