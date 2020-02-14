/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
define(["dojo/_base/declare",
        "dijit/Tooltip",
        "d3/d3",
        "./../utils/object", "./../uiUtils",
        "dojo/i18n!./../nls/base",
        "xstyle/css!./../resources/coverage-graph.css"],
function(declare,
 Tooltip,
 d3,
 object, uiUtils,
 strings) {

  let CoverageGraph;
  const GraphTooltip = declare(Tooltip._MasterTooltip, {
    constructor(obj) {
      return this.elementName = obj.elementName;
    },

    lastColumn: undefined,
    lastRow: undefined,

    show2: object.skip(1, function(index, names, coverages, x, y) {
      const rect = {width: 8, height: 8, x, y};
      index = `<div><b>Coverages for ${this.elementName} #${index}</b></div>`;
      var coverage = `<div><b>${strings.coverageGraph.coverage}</b>: ${Math.round(coverage)}</div>`;
      const colors = uiUtils.makeColorsIterator();
      const coveragesHtml = _.reduce(names, function(z, name, i) {
        if (name != null) {
          return z + `<div style='color: ${colors.next()}'><b>${name}: </b> ${coverages[i].toFixed(0)}</div>`;
        } else {
          colors.next();
          return z;
        }
      }
      , "");
      return this.show(`<div>${index}${coveragesHtml}</div>`, rect, ["below", "above"]);
    })
  });

  const FocusCircle = declare(null, {
    constructor(graphArea, horizontalOffset,
                  xScale, height,
                  elementName) {
      this.xScale = xScale;
      this.offset = horizontalOffset;

      this.focus = graphArea.append("line")
        .attr("x1", 0).attr("y1", 0)
        .attr("x2", 0).attr("y2", height)
        .classed("focus-circle", true);
      this.focusRect = graphArea.append("rect")
        .attr("height", height)
        .attr("x", horizontalOffset)
        .classed("focus-rect", true)
        .on("mousemove", this.mouseMoveHandler.bind(this))
        .on("mouseout", this.hideFocusCircle.bind(this));
      this.tooltip = new GraphTooltip({elementName});
      return this.hideFocusCircle();
    },

    mouseMoveHandler() {
      const x0 = this.xScale.invert(d3.mouse(this.focusRect[0][0])[0] - this.offset);
      const i = Math.round(x0);
      this.focus.attr("transform", `translate(${this.xScale(i) + this.offset}, 0)`);
      const lineCoverages = _.map(this.data, function(cs) { if (cs != null) { return cs[i]; } else { return undefined; } });
      return this.tooltip.show2(i + this.elementOffset, this.populations, lineCoverages, d3.event.clientX, d3.event.clientY);
    },

    hideFocusCircle() {
      this.focus.attr("transform", "translate(-500, 0)");
      return this.tooltip.hide(this.tooltip.aroundNode);
    },

    setCoverages(populations, allCoverages, elementOffset) {
      this.populations = populations;
      this.data = allCoverages;
      return this.elementOffset = elementOffset;
    },

    setFullWidth(w) { return this.focusRect.attr("width", w - this.offset); }
  });

  return CoverageGraph = declare(null, {
    graphHeight: 80,

    constructor(area, labelWidth, elementName) {
      this.labelWidth = labelWidth;

      this.mainArea = area
        .attr("transform", "translate(0, 10)");
      const textElement = area.classed("coverage-graph", true)
        .append("text")
        .classed("name", true);
      textElement.append("tspan")
        .text("\uF05A")
        .classed("info-icon", true);
      textElement.append("tspan")
        .attr("dx", 4)
        .text(strings.coverageGraph.coverage);
      textElement
        .on("mouseenter", Tooltip.show.bind(null, strings.proteinsBar.proteinsTooltip, textElement[0][0]))
        .on("mouseleave", Tooltip.hide.bind(null, textElement[0][0]));
      this.graphArea = area.append("g")
        .attr("height", this.graphHeight)
        .attr("transform", `translate(${labelWidth}, 0)`);

      this.xScale = d3.scale.linear();
      this.yScale = d3.scale.linear()
        .nice()
        .range([this.graphHeight, 0]);
      this.yAxis = d3.svg.axis()
        .scale(this.yScale)
        .ticks([5])
        .orient("right");
      this.gAxis = this.graphArea.append("g")
        .attr("class", "y axis");
      this.line = d3.svg.line()
        .x((d, i) => this.xScale(i).toFixed(2))
        .y((d, i) => this.yScale(d).toFixed(2));

      this.focusCircle = new FocusCircle(this.mainArea, this.labelWidth, this.xScale, this.graphHeight, elementName);

      return window.model.getChosenPassagesBus().onValue(this.filterLines.bind(this));
    },

    setData(highestCoverage, populations, allCoverages, elementOffset) {
      this.populations = populations;
      this.chosenCoverages = (this.allCoverages = allCoverages);
      this.elementOffset = elementOffset;
      this.xScale.domain([0, allCoverages[0].length - 1]);
      this.yScale.domain([0, highestCoverage]);
      this.gAxis.call(this.yAxis);
      return this.filterLines(window.model.getChosenPassages());
    },

    filterLines(filter) {
      this.chosenCoverages = _.map(this.allCoverages, function(x, i) { if (filter[i]) { return x; } else { return undefined; } });
      const populations = _.map(this.populations, function(x, i) { if (filter[i]) { return x; } else { return undefined; } });
      this.focusCircle.setCoverages(populations, this.chosenCoverages, this.elementOffset);
      if (this.currentSize) { return this.resize(this.currentSize); }
    },

    resize(s) {
      this.currentSize = s;
      if (this.chosenCoverages) {
        this.graphArea.attr("width", s.w);
        this.graphArea.selectAll("path").remove();
        this.xScale.range([0, s.w - this.labelWidth]);
        const colors = uiUtils.makeColorsIterator();
        _.each(this.chosenCoverages, coverages => {
          if (coverages != null) {
            return this.graphArea.append("path")
              .datum(coverages)
              .attr("class", "line")
              .style("stroke", colors.next())
              .attr("d", this.line);
          } else {
            return colors.next();
          }
        });
        this.gAxis.selectAll("line")
          .attr("x2", s.w);
      }

      return this.focusCircle.setFullWidth(s.w);
    },

    getHeight() { return this.graphHeight + 30; },

    move(x, y) { return this.mainArea.attr("transform", `translate(${x}, ${y + 10})`); }
  });
});
