/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
define(["dojo/_base/declare", "dojo/_base/lang",
        "dijit/_Widget", "dijit/_TemplatedMixin",
        "d3/d3",
        "./ProteinsBar", "./BinLayerCakeHeader", "./LayerCake", "./CoverageGraph",
        "dojo/i18n!./../nls/base",
        "xstyle/css!./../resources/layer-cake-header.css"],
function(declare, lang,
 _Widget, _TemplatedMixin,
 d3,
 ProteinsBar, BinLayerCakeHeader, LayerCake, CoverageGraph,
 strings) {

  return declare([_Widget, _TemplatedMixin], {
    templateString: "<svg></svg>",

    labelWidth: 130,

    postCreate() {
      this.inherited(arguments);

      this.area = d3.select(this.domNode);
      this.proteinsBar = new ProteinsBar(this.area.append("g"), this.labelWidth);
      this.coverageGraph = new CoverageGraph(this.area.append("g"), this.labelWidth, strings.binsMap.tooltipIndex);
      this.layerCakeHeader = new BinLayerCakeHeader(this.area.append("g"), this.labelWidth);
      const offset = this.layerCakeHeader.getHeight() + 20;
      this.cake = new LayerCake(this.domNode, this.area.append("g").attr("transform", `translate(0, ${offset})`), this.labelWidth,
                            (function(x) { return x.binNumber; }), (function(x) { return x.populationIndex; }), (function(x) { return x.rate; }),
                            "column");

      this.proteinsBar.on("mouseClick", this.proteinMouseClickHandler.bind(this));
      return this.cake.on("mouseClick", this.cakeMouseClickHandler.bind(this));
    },

    setData(proteins, table, fitnessInfo) {
      this.proteinsBar.setData(proteins, 1, table.getNucleotidesCount());
      this.coverageGraph.setData(table.getHighestCoverage(), table.getPopulations(), table.getAllCoverages(), 1);
      this.layerCakeHeader.setData(table.getAverages(), table.getNucleotidesRange());
      this.cake.setData(table.getPopulations(), table.getAllBins(), fitnessInfo, table.getBinCount());

      let offset = this.proteinsBar.getHeight();
      this.coverageGraph.move(0, offset);
      offset += this.coverageGraph.getHeight();
      this.layerCakeHeader.move(0, offset);
      offset += this.layerCakeHeader.getHeight() + 20;
      this.cake.move(0, offset);

      this.proteins = proteins;
      this.table = table;
      return this.fitnessInfo = fitnessInfo;
    },

    setModel(model) { return this.model = model; },

    currentThreshold: 0,
    setLowThreshold(threshold) {
      this.currentThreshold = threshold;
      return this.cake.setLowThreshold(threshold / 100);
    },

    setFitnessInfo(fitnessInfo) {
      this.fitnessInfo = fitnessInfo;
      return this.cake.setFitness(fitnessInfo);
    },

    proteinMouseClickHandler(d) {
      return this.onProteinClick({table: this.table, protein: d, threshold: this.currentThreshold, proteins: this.proteins, fitnessInfo: this.fitnessInfo});
    },

    cakeMouseClickHandler(evt) {
      return this.onBinClick(lang.mixin({table: this.table, threshold: this.currentThreshold, fitnessInfo: this.fitnessInfo}, evt));
    },

    onProteinClick() {},
    onBinClick() {},

    resize(s) {
      this.area.attr("width", s.w)
        .attr("height", s.h);
      this.proteinsBar.resize(s);
      this.coverageGraph.resize(s);
      this.layerCakeHeader.resize(s);
      return this.cake.resize(s);
    }
  });
});
