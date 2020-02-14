/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
define(["dojo/_base/declare", "dojo/_base/lang", "dojo/dom-geometry", "dojo/dom-style",
        "dijit/_Widget", "dijit/_TemplatedMixin", "dijit/_WidgetsInTemplateMixin",
        "d3/d3",
        "./NucleotidesLayerCakeHeader", "./BinLayerCakeHeader", "./LayerCake", "./CoverageGraph", "./nucleotidesTooltip",
        "./../uiUtils",
        "dojo/text!./../templates/NucleotidesMap.html",
        "dojo/i18n!./../nls/base",
        "./StackDialog", "dijit/layout/BorderContainer", "dijit/layout/ContentPane", "dijit/form/Button",
        "xstyle/css!./../resources/nucleotides-map.css"],
function(declare, lang, domGeometry, domStyle,
 _Widget, _TemplatedMixin, _WidgetsInTemplateMixin,
 d3,
 NucleotidesLayerCakeHeader, BinLayerCakeHeader, LayerCake, CoverageGraph, tooltip,
 uiUtils,
 template,
 strings) {

  let firstTime = true;

  return declare([_Widget, _TemplatedMixin, _WidgetsInTemplateMixin], {
    templateString: template,

    labelWidth: 100,

    constructor() {
      return lang.mixin(this, strings.nucleotidesMap);
    },

    postCreate() {
      this.inherited(arguments);
      this.dialog.backButton.on("click", this.nextOrBackButtonHandler.bind(this, false));
      this.dialog.nextButton.on("click", this.nextOrBackButtonHandler.bind(this, true));
      this.dialog.on("hide", this.hideDialog.bind(this));

      const topArea = d3.select(this.headerSvgArea);
      this.binsBar = new BinLayerCakeHeader(topArea.append("g"), this.labelWidth, true);
      this.coverageGraph = new CoverageGraph(topArea.append("g"), this.labelWidth, strings.nucleotidesMap.tooltipIndex);
      let offset = this.binsBar.getHeight();
      this.coverageGraph.move(0, offset);
      this.layerCakeHeader = new NucleotidesLayerCakeHeader(topArea.append("g"), this.labelWidth);
      offset += this.coverageGraph.getHeight();
      this.layerCakeHeader.move(0, offset);
      offset += this.layerCakeHeader.getHeight();
      this.topPane.resize({h: offset});
      const centerArea = d3.select(this.centerSvgArea);
      this.cake = new LayerCake(this.domNode, centerArea.append("g"), this.labelWidth,
                            (function(x) { return x.nucleotidesCounter; }), (function(x) { return x.populationIndex; }), (function(x) { return x.variance; }),
                            "cell");
      this.cake.on("mouseMove", this.mouseMoveHandler.bind(this));
      return this.centerPane.on("mouseLeave", this.centerPaneMouseLeaveHandler.bind(this));
    },

    show(groupedTable, fitnessInfo, threshold, evt) {
      this.groupedTable = groupedTable;
      this.fitnessInfo = fitnessInfo;
      this.currentBin = evt.column;
      this.binsBar.setData(groupedTable.getAverages(), groupedTable.getNucleotidesRange());
      this.dialog.show();

      if (firstTime) {
        const centerPaneSize = domGeometry.position(this.centerPane.domNode);
        const withoutScrollBarSize = {w: centerPaneSize.w - uiUtils.getScrollBarWidth(), h: centerPaneSize.h};
        this.binsBar.resize(withoutScrollBarSize);
        this.layerCakeHeader.resize(withoutScrollBarSize);
        this.coverageGraph.resize(withoutScrollBarSize);
        this.cake.resize(withoutScrollBarSize);
        this.mainContainer.layout();
        firstTime = false;
      }

      this.updateState();
      domStyle.set(this.centerSvgArea, "height", this.cake.getHeight() + "px");
      return this.cake.setLowThreshold(threshold / 100);
    },

    nextOrBackButtonHandler(next) {
      this.currentBin += ((next) ? +1 : -1);
      return this.updateState();
    },

    updateState() {
      const t = this.groupedTable.makeNucleotidesTable(this.currentBin);
      const nucleotides = t.getReferenceNucleotides();

      this.layerCakeHeader.setData(nucleotides);
      this.coverageGraph.setData(t.getHighCoverage(), t.getPopulations(), t.getAllCoverages(), t.getNormalizedTable()[0][0].nucleotide);

      const slicedFitnessTable = this.fitnessInfo.makeNucleotidesTable(this.currentBin);
      this.cake.setData(this.groupedTable.getPopulations(), t.getNormalizedTable(), slicedFitnessTable, nucleotides.length);

      this.binsBar.setSelection(this.currentBin);
      this.dialog.backButton.set("disabled", this.currentBin === 0);
      this.dialog.nextButton.set("disabled", (this.currentBin + 1) === this.groupedTable.getBinCount());
      return tooltip.hide(tooltip.aroundNode);
    },

    mouseMoveHandler(e) { return tooltip.show2(e.column, e.row, e.d, lang.mixin({width: this.cake.cellWidth, height: this.cake.cellHeight}, e.rect), ["below"]); },

    centerPaneMouseLeaveHandler() {
      this.cake.hideSelectionCaret();
      return tooltip.hide(tooltip.aroundNode);
    },

    hideDialog() {
      this.dialog.hide();
      return tooltip.hide(tooltip.aroundNode);
    }
  });
});
