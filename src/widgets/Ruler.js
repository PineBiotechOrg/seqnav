/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
define(["dojo/_base/declare",
        "./../utils/Iterator",
        "xstyle/css!./../resources/ruler.css"],
function(declare,
 Iterator) {

  return declare(null, {
    fontHeight: 12,
    fontWidth: 6,

    constructor(area, labelWidth) {
      this.labelWidth = labelWidth;
      return this.labelsArea = area.append("g")
        .attr("height", this.fontHeight)
        .attr("transform", `translate(${labelWidth}, 0)`)
        .classed("ruler-ticks", true);
    },

    setRange(min, max) {
      this.min = min;
      return this.max = max;
    },

    resize(s) {
      const { min } = this;
      const { max } = this;
      if (min && max) {
        const digitsNumber = Math.floor((Math.log(max) / Math.LN10) + 1);
        const availableWidth = s.w - this.labelWidth;
        const m = Math.floor(Math.log(availableWidth / (digitsNumber + 3) / this.fontWidth) / Math.LN2);
        const intervalsCount = Math.pow(2, m);
        const intervalLength = (max - min) / intervalsCount;
        const points = Iterator.range(0, intervalsCount)
          .map(i => ({label: Math.round(min + (intervalLength * i)), offset: (availableWidth / intervalsCount) * i}))
          .toArray();

        const pointText = this.labelsArea.selectAll("text").data(points);
        pointText.enter().append("text")
          .attr("y", this.fontHeight);
        pointText.exit().remove();
        return pointText.attr("x", d => `${d.offset}px`)
          .text(d => d.label);
      }
    },

    getHeight() { return this.fontHeight + 2; }
  });
});
