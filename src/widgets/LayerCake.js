/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
define(["dojo/_base/declare", "dojo/_base/lang", "dojo/Evented",
        "./../uiUtils", "./CheckBox",
        "dojo/i18n!./../nls/base",
        "xstyle/css!./../resources/layer-cake.css"],
function(declare, lang, Evented,
 uiUtils, CheckBox,
 strings) {

  const SelectionCaret = declare(null, {
    row: -1,
    column: -1,

    constructor(parent, horizontalOffset, cellHeight, rowGap, selectionMode) {
      this.area = parent.append("rect")
        .attr("y", (selectionMode === "column") ? -cellHeight / 2 : 0)
        .attr("transform", "translate(-500, 0)")
        .classed("selection-caret", true);
      this.horizontalOffset = horizontalOffset;
      this.cellHeight = cellHeight;
      this.rowGap = rowGap;
      return this.selectionMode = selectionMode;
    },

    setWidth(width) {
      this.cellWidth = width;
      return this.area.attr("width", width - 2);
    },

    setHeight(rowsCount, reserveForFitness) {
      this.reserveForFitness = reserveForFitness;
      if (this.selectionMode === "column") {
        rowsCount = (reserveForFitness) ? rowsCount + 1 : rowsCount;
        return this.area.attr("height", ((rowsCount * (this.cellHeight + this.rowGap)) + this.cellHeight) - this.rowGap);
      } else {
        return this.area.attr("height", this.cellHeight + 6);
      }
    },

    hide() {
      if ((this.row !== -1) || (this.column !== -1)) {
        this.area.attr("transform", "translate(-500, 0)");
        this.row = -1;
        this.column = -1;
        return this.data = undefined;
      }
    },

    setPosition(row, column, data, pos) {
      if ((this.row !== row) || (this.column !== column)) {
        const offsetX = (column * this.cellWidth) + this.horizontalOffset;
        const offsetY2 = (this.reserveForFitness) ? this.cellHeight : 0;
        const offsetY = (this.selectionMode === "column") ? 0 : (((this.cellHeight + this.rowGap) * row) + offsetY2) - 3;
        this.area.attr("transform", `translate(${offsetX}, ${offsetY})`);
        this.row = row;
        this.column = column;
        return this.data = data;
      }
    },

    getSelection() {
      return {
        row: this.row,
        column: this.column,
        data: this.data
      };
    }
  });

  const fitnessToClass = function(xs) {
    if (xs.length === 0) {
      return "no-fitness";
    } else {
      const { fitness } = xs[0];
      if (_.every(xs, x => x.fitness === fitness)) {
        switch (fitness) {
          case "B": return "beneficial-fitness";
          case "N": return "neutral-fitness";
          case "D": return "detrimental-fitness";
        }
      } else {
        return "mixed-fitness";
      }
    }
  };

  return declare(Evented, {
    cellHeight: 24,
    rowGap: 10,

    lowThreshold: 0,

    constructor(baseDomNode, area, labelWidth,
                  columnExtractor, rowExtractor, colorValueExtractor,
                  selectionMode) {
      window.baseDomNode = (this.baseDomNode = baseDomNode);
      this.area = area.classed("cake", true);
      this.labelWidth = labelWidth;
      this.columnExtractor = columnExtractor;
      this.rowExtractor = rowExtractor;
      this.colorValueExtractor = colorValueExtractor;
      this.labels = this.area.append("g")
        .attr("labels", true);
      this.fitnessRects = this.area.append("g")
        .attr("transform", `translate(${labelWidth}, 0)`);
      this.table = this.area.append("g")
        .on("click", this.mouseClickHandler.bind(this));
      this.selectionCaret = new SelectionCaret(this.area, labelWidth, this.cellHeight, this.rowGap, selectionMode);
      return window.model.getChosenPassagesBus().onValue(this.passagesUpdated.bind(this));
    },

    setData(populations, data, fitnessTable, binsCount) {
      this.populations = populations;
      this.data = data;
      this.binsCount = binsCount;
      this.fitnessTable = fitnessTable;
      return this._updateTable();
    },

    setLowThreshold(newValue) {
      this.lowThreshold = newValue;
      return this._updateTable();
    },

    setFitness(fitnessTable) {
      this.fitnessTable = fitnessTable;
      return this.updateFitness();
    },

    checkboxes: [],
    _updateTable() {
      const colors = uiUtils.makeColorsIterator();

      _.each(this.checkboxes, cb => cb.destroy());
      this.checkboxes = _.map(this.populations, (population, i) => {
        return new CheckBox({
              parent: this.labels,
              state: true,
              label:  population,
              onMouseClick(evt) { return window.model.updatePassage(i, evt.state); }
            })
          .move(0, (i * (this.cellHeight + this.rowGap)) + 4)
          .fill(colors.next());
      });
      this.passagesUpdated(window.model.getChosenPassages());
      //  .append("text")
      //     .attr("y", (x, i) => (i + 0.5) * @cellHeight + @rowGap * i)
      //text.exit().remove()
      //text.text((d) -> d)
      //  .style("fill", colors.next.bind())

      const rect = this.table.selectAll("rect").data(this.data, obj => `${this.columnExtractor(obj)}.${this.rowExtractor(obj)}`);
      rect.enter().append("rect")
        .attr("y", obj => this.rowExtractor(obj) * (this.rowGap + this.cellHeight))
        .attr("height", this.cellHeight)
        .on("mousemove", this.mouseMoveHandler.bind(this));
      rect.exit().remove();
      rect.style("fill", d => uiUtils.getColor(this.lowThreshold, this.colorValueExtractor(d)));

      this.updateFitness();

      if (this.currentSize != null) { return this.resize(this.currentSize); }
    },

    updateFitness() {
      this.reserveForFitness = !_.isEmpty(this.fitnessTable.getFilter());
      this.table.attr("transform", `translate(${this.labelWidth}, ${(this.reserveForFitness) ? this.cellHeight : 0})`);
      this.labels.attr("transform", `translate(0, ${(this.reserveForFitness) ? this.cellHeight : 0})`);
      const fitnessRect = this.fitnessRects.selectAll("polyline").data(this.fitnessTable.getData());
      fitnessRect.enter().append("polyline");
      fitnessRect.exit().remove();
      fitnessRect.each(function(fitness) { return this.setAttribute("class", fitnessToClass(fitness)); });
      return this.selectionCaret.setHeight(this.populations.length, this.reserveForFitness);
    },

    passagesUpdated(arr) {
      if (this.checkboxes.length > 0) {
        return _.each(arr, (val, idx) => this.checkboxes[idx].setState(val));
      }
    },

    mouseMoveHandler(d) {
      const { clientX } = d3.event;
      const { clientY } = d3.event;
      const x = clientX - this.baseRootRect.left;
      const y = clientY - this.baseRootRect.top;
      //if (x <= @labelWidth or
      //    x >= @currentSize.w + (@currentSize.x || 0) - 11)
      //  @selectionCaret.hide()
      //else
      const row = this.rowExtractor(d);
      const column = this.columnExtractor(d);
      const rect = {x: clientX, y: clientY};
      this.selectionCaret.setPosition(row, column, d, rect);
      return this.emit("mouseMove", {row, column, rect, d});
    },

    mouseClickHandler() {
      const selection = this.selectionCaret.getSelection();
      if ((selection.row !== -1) && (selection.column !== -1)) { return this.emit("mouseClick", selection); }
    },

    hideSelectionCaret() { return this.selectionCaret.hide(); },

    resize(s) {
      this.currentSize = s;
      this.baseRootRect = this.baseDomNode.getBoundingClientRect();
      if (this.binsCount != null) {
        this.cellWidth = (s.w - this.labelWidth) / this.binsCount;
        this.table.selectAll("rect")
          .attr("width", this.cellWidth - 1)
          .attr("x", obj => (this.columnExtractor(obj) * this.cellWidth).toFixed(1));
        this.fitnessRects.selectAll("rect")
          .attr("width", this.cellWidth - 1)
          .attr("x", (fitnessInfo, i) => (i * this.cellWidth).toFixed(1));
        this.selectionCaret.setWidth(this.cellWidth);

        return this.fitnessRects.selectAll("polyline")
          .attr("points", (fitness, i) => {
            const x0 = (i * this.cellWidth) + 1;
            const cellWidth = this.cellWidth - 4;
            return `${x0.toFixed(2)},${this.cellHeight - 3} ${(x0 + cellWidth).toFixed(2)},${this.cellHeight - 3} ${(x0 + (cellWidth / 2)).toFixed(2)},-3`;
          });
      }
    },

    move(x, y) { return this.area.attr("transform", `translate(${x}, ${y})`); },

    getHeight() { return ((this.populations.length + ((this.reserveForFitness) ? 1 : 0)) * (this.cellHeight + this.rowGap)) - this.rowGap; }
  });
});
