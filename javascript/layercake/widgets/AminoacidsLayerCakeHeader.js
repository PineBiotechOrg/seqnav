/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
define(["dojo/_base/declare", "dojo/_base/lang",
        "./../utils/Iterator",
        "../model/Aminoacids", "./AbstractLayerCakeHeader",
        "dojo/i18n!./../nls/base"],
function(declare, lang,
 Iterator,
 Aminoacids, AbstractLayerCakeHeader,
 strings) {

  return declare(AbstractLayerCakeHeader, {
    constructor() {
      return this.cellsArea.classed("aminoacids-cells", true);
    },

    getName() { return strings.layerCakeHeader.aminoacids; },

    setData(data) {
      const aminoacids = Iterator.fromArray(data)
        .sliding(3, 3)
        .map(function(a) {
          if (a.length !== 3) {
            return {avg: 0, aminoacid: ""};
          } else {
            return {
              aminoacid: Aminoacids.strToAminoacid(a[0].reference + a[1].reference + a[2].reference),
              avg: (a[0].avg + a[1].avg + a[2].avg) / 3
            };
          }
        }).toArray();
      this.inherited(arguments, [aminoacids, x => x.avg]);

      const text = this.cellsArea.selectAll("text").data(aminoacids);
      text.enter()
        .append("text")
          .attr("y", this.cellHeight / 2);
      text.exit().remove();
      text.text(d => d.aminoacid);

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
