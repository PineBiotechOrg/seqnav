/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
define(["dojo/_base/declare", "dojo/_base/lang",
        "dijit/Tooltip",
        "underscore/underscore",
        "./../model/Table",
        "dojo/i18n!./../nls/base"],
function(declare, lang,
 Tooltip,
 _,
 Table,
 strings) {

  const tooltipTemplate = [
    {name: "A", className: "green"},
    {name: "C", className: "violet"},
    {name: "G", className: "blue"},
    {name: "T", className: "yellow"}
  ];

  return declare(Tooltip._MasterTooltip, {

    lastColumn: undefined,
    lastRow: undefined,

    show2(column, row, pairs, rect, position) {
      if ((column !== this.lastColumn) || (row !== this.lastRow)) {
        const nucleotideToPair = _.indexBy(pairs, "varNucleotide");
        const total = _.reduce(pairs, ((z, p) => z + p.count), 0);
        const notMutatedCount = (nucleotideToPair[pairs[0].refNucleotide] != null ? nucleotideToPair[pairs[0].refNucleotide].count : undefined) || 0;
        let variability = (total === 0) ? "N/A" : (((total) / total) * 100).toFixed(2) + "%";

        const sequenceDiv = `<div>${strings.nucleotidesMap.sequence}: ${pairs[0].sequence}</div>`;
        const nucleotideDiv = `<div>${strings.nucleotidesMap.nucleotide}: ${pairs[0].nucleotide}</div>`;
        const coverageDiv = `<div>${strings.nucleotidesMap.coverage}: ${pairs[0].coverage}</div>`;
        const totalCountDiv = `<div>${strings.nucleotidesMap.totalCount}: ${total.toFixed(2)}</div>`;
        const variabilityDiv = `<div>${strings.nucleotidesMap.variability}: ${variability}</div>`;
        const body = _.map(tooltipTemplate, function(obj) {
          const count = (nucleotideToPair[obj.name] != null ? nucleotideToPair[obj.name].count : undefined) || 0;
          variability = (total === 0) ? "N/A" : ((count * 100) / total).toFixed(2) + "%";
          return `<div>
  <span class="square square-${obj.className}">${obj.name}</span>
  <label>${count + "\t\t" + variability}</label>
</div>`;
      }).join("");
        const html = `<div class='layer-cake-tooltip'>${sequenceDiv}${nucleotideDiv}${totalCountDiv}${variabilityDiv}${coverageDiv}${body}</div>`;
        this.show(html, lang.mixin(null, rect, {x: rect.x - 10}), position);
      }

      this.lastColumn = column;
      return this.lastRow = row;
    }
  })();
});
