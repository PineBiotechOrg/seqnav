/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
define(["dojo/_base/declare", "dojo/_base/lang", "dojo/Evented",
        "dijit/Tooltip",
        "underscore/underscore",
        "d3/d3",
        "./Ruler",
        "dojo/i18n!./../nls/base",
        "xstyle/css!./../resources/proteins-bar.css"],
function(declare, lang, Evented,
 Tooltip,
 _,
 d3,
 Ruler,
 strings) {

  const keyMaker = obj => `${obj.gene}.${obj.level}`;

  const gene = d => d.gene;

  return declare(Evented, {
    proteinHeight: 30,
    proteinsGap: 10,

    constructor(area, labelWidth, withRuler) {
      this.area = area;
      this.labelWidth = labelWidth;
      if (withRuler) { this.ruler = new Ruler(area, labelWidth); }
      this.rulerHeight = (this.ruler) ? this.ruler.getHeight() : 0;
      const textElement = area.append("text")
        .classed("protein-header", true)
        .attr("y", (this.proteinHeight / 2) + this.rulerHeight);
      textElement.append("tspan")
        .text("\uF05A")
        .classed("info-icon", true);
      textElement.append("tspan")
        .attr("dx", 4)
        .text(strings.proteinsBar.proteins);
      textElement
        .on("mouseenter", Tooltip.show.bind(null, strings.proteinsBar.proteinsTooltip, textElement[0][0]))
        .on("mouseleave", Tooltip.hide.bind(null, textElement[0][0]));

      this.selectedArea = area.append("rect")
        .classed("highlighted-proteins-area", true);

      return this.rectangleAreas = area.append("g")
        .attr("transform", `translate(${labelWidth}, 0)`)
        .classed("proteins-bar", true);
    },

    setData(proteins, firstNucleotide, lastNucleotide) {
      this.proteins = proteins;
      if (this.ruler) { this.ruler.setRange(firstNucleotide, lastNucleotide); }
      this.firstNucleotide = firstNucleotide;
      this.lastNucleotide = lastNucleotide;

      const text = this.rectangleAreas.selectAll("text").data(proteins.getAllProteins(), keyMaker);
      text.enter().append("text")
        .attr("y", d => (this.proteinHeight / 2) + (d.level * (this.proteinHeight + this.proteinsGap)) + this.rulerHeight)
        .filter(d => d.type === "PROTEIN")
        .on("click", this.mouseClickHandler.bind(this));
      text.exit().remove();
      text.text(gene);

      const rect = this.rectangleAreas.selectAll("rect").data(proteins.getAllProteins(), keyMaker);
      rect.enter().append("rect")
        .attr("height", this.proteinHeight)
        .attr("y", d => (d.level * (this.proteinHeight + this.proteinsGap)) + this.rulerHeight)
        .filter(d => d.type === "PROTEIN")
        .on("click", this.mouseClickHandler.bind(this));
      const title = rect.append("title");
      rect.exit().remove();
      title.text(gene);

      if (this.currentSize) { return this.resize(this.currentSize); }
    },

    highlight(leftEdge, rightEdge) {
      this.leftEdge = leftEdge;
      this.rightEdge = rightEdge;
      if (leftEdge < rightEdge) {
        this.selectedArea.attr("height", ((this.proteins.getLevelsCount() * (this.proteinHeight + this.proteinsGap)) - this.proteinsGap) + this.rulerHeight);
      }

      if (this.currentSize) { return this.resize(this.currentSize); }
    },

    mouseClickHandler(d) { return this.emit("mouseClick", d); },

    resize(s) {
      let scale;
      this.currentSize = s;
      if (this.proteins) {
        const { firstNucleotide } = this;
        scale = (s.w - this.labelWidth) / ((this.lastNucleotide - firstNucleotide) + 1);
        this.rectangleAreas.selectAll("rect")
          .attr("x", d => (d.start - firstNucleotide) * scale)
          .attr("width", d => ((d.end - d.start) * scale) - 2);
        this.rectangleAreas.selectAll("text")
          .attr("x", d => ((d.start - firstNucleotide) * scale) + (((d.end - d.start) * scale) / 2))
          .each(function(d) {
            const maxWidth = ((d.end - d.start) * scale) - 2;
            if (this.getComputedTextLength() > maxWidth) {
              this.textContent = d.short;
              if (this.getComputedTextLength() > maxWidth) {
                return this.textContent = "";
              }
            }
          });
      }
      if (this.leftEdge < this.rightEdge) {
        this.selectedArea
          .attr("x", this.labelWidth + (this.leftEdge * scale))
          .attr("width", (this.rightEdge - this.leftEdge) * scale);
      }

      if (this.ruler) { return this.ruler.resize(s); }
    },

    getHeight() { return ((this.proteins.getLevelsCount() * (this.proteinHeight + this.proteinsGap)) -
                     this.proteinsGap) +
                     this.rulerHeight +
                     20; }
  });
});
