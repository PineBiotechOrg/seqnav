/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
define(["dojo/_base/declare", "dojo/_base/lang",
        "./AbstractLayerCakeHeader"],
function(declare, lang,
 AbstractLayerCakeHeader) {

  return declare(AbstractLayerCakeHeader, {
    constructor() {
      return this.cellsArea.classed("nucleotide-cells", true);
    },

    setData(data) {
      this.inherited(arguments, [data, x => x.avg]);

      const text = this.cellsArea.selectAll("text").data(data);
      text.enter()
        .append("text")
          .attr("y", this.cellHeight / 2);
      text.exit().remove();
      text.text(d => d.reference);

      if (this.currentSize) { return this.resize(this.currentSize); }
    },

    resize(s) {
      this.inherited(arguments);

      if (this.initialized) {
        return this.cellsArea.selectAll("text")
          .attr("x", (x, i) => ((i + 0.5) * this.width) - 1);
      }
    },

    _getRectanglesBarVerticalOffset() { return 0; }
  });
});
