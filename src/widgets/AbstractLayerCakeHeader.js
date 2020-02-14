/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
define(["dojo/_base/declare", "dojo/_base/lang",
        "./../uiUtils",
        "dojo/i18n!./../nls/base"],
function(declare, lang,
 uiUtils,
 strings) {

  const SelectionCaret = declare(null, {
    column: -1,

    constructor(parent, cellHeight, labelWidth, verticalOffset) {
      this.labelWidth = labelWidth;
      return this.area = parent.append("rect")
        .attr("y", verticalOffset - 3)
        .attr("height", cellHeight + 6)
        .attr("transform", "translate(-500, 0)")
        .classed("selection-caret", true);
    },

    setWidth(width) {
      this.area.attr("width", width + 1);
      return this.cellWidth = width;
    },

    setPosition(column) {
      if (this.column !== column) {
        this.area.attr("transform", `translate(${((column * this.cellWidth) + this.labelWidth) - 1}, 0)`);
        return this.column = column;
      }
    }
  });

  return declare(null, {
    cellHeight: 24,

    constructor(area, labelWidth, supportsSelection) {
      this.mainArea = area;
      this.labelWidth = labelWidth;
      this.supportsSelection = supportsSelection;

      if (labelWidth > 0) {
        area.classed("layer-cake-header", true)
          .append("text")
          .text(this.getName())
          .attr("y", this._getRectanglesBarVerticalOffset() + (this.cellHeight / 2))
          .classed("name", true);
      }
      if (supportsSelection) {
        this.selectionCaret = new SelectionCaret(area, this.cellHeight, labelWidth, this._getRectanglesBarVerticalOffset());
      }

      return this.cellsArea = area.append("g")
        .attr("height", this.cellHeight)
        .attr("transform", `translate(${labelWidth}, ${this._getRectanglesBarVerticalOffset()})`)
        .attr("layer-cake-header-cells", true);
    },

    getName() { return strings.layerCakeHeader.reference; },

    setData(data, colorValueExtractor) {
      this.initialized = true;
      this.cellCount = data.length;

      const rect = this.cellsArea.selectAll("rect").data(data);
      rect.enter().append("rect")
        .attr("height", this.cellHeight);
      rect.exit().remove();
      return rect.style("fill", d => uiUtils.getColor(0, colorValueExtractor(d)));
    },

    resize(s) {
      this.currentSize = s;

      if (this.initialized) {
        const width = (this.width = (s.w - this.labelWidth) / this.cellCount);
        this.cellsArea.selectAll("rect")
          .attr("width", width - 1)
          .attr("x", (x, i) => i * width);
        if (this.supportsSelection) { return this.selectionCaret.setWidth(width); }
      }
    },

    _getRectanglesBarVerticalOffset() { throw new Error("Abstract"); },

    setSelection(colNum) {
      if (this.supportsSelection) {
        return this.selectionCaret.setPosition(colNum);
      } else {
        throw new Error("Not supports selection");
      }
    },

    getHeight() { return this.cellHeight + this._getRectanglesBarVerticalOffset(); },

    move(x, y) { return this.mainArea.attr("transform", `translate(${x}, ${y})`); }
  });
});
