/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
define(["dojo/_base/declare", "dojo/_base/lang", "dojo/dom-geometry", "dojo/dom-style", "dojo/on", "dojo/query",
        "dijit/_Widget", "dijit/_TemplatedMixin", "dijit/_WidgetsInTemplateMixin",
        "d3/d3", "pv/pv", "pv/color",
        "./NucleotidesLayerCakeHeader", "./BinLayerCakeHeader", "./LayerCake", "./ProteinsBar", "./AminoacidsLayerCakeHeader",
        "./nucleotidesTooltip", "./progressIndicator",
        "./../model/Aminoacids", "./../uiUtils", "./../utils/Iterator", "./../utils/object",
        "dojo/text!./../templates/ProteinView.html", "dojo/text!./../templates/AminoacidsDialog.html",
        "dojo/i18n!./../nls/base",
        "./StackDialog", "dijit/layout/BorderContainer", "dijit/layout/ContentPane", "dijit/form/Button",
        "xstyle/css!./../resources/nucleotides-map.css"],
function(declare, lang, domGeometry, domStyle, listener, query,
 _Widget, _TemplatedMixin, _WidgetsInTemplateMixin,
 d3, pv, color,
 NucleotidesLayerCakeHeader, BinLayerCakeHeader, LayerCake, ProteinsBar, AminoacidsLayerCakeHeader,
 tooltip, progressIndicator,
 Aminoacids, uiUtils, Iterator, object,
 template, aminoacidsTemplate,
 strings) {

  let firstTime = true;
  let options = undefined;
  let viewer = undefined;

  const maxNucleotidesCount = 120;

  const aminoacidsDialog = new declare([_Widget, _TemplatedMixin, _WidgetsInTemplateMixin], {
    templateString: aminoacidsTemplate,

    constructor() {
      return lang.mixin(this, strings.aminoacidsDialog);
    },

    postCreate() {
      this.inherited(arguments);
      return this.closeButton.on("click", this.dialog.hide.bind(this.dialog));
    },

    show(aminoacids) {
      this.contentArea.innerHTML = aminoacids;
      return this.dialog.show();
    }
  })();

  return declare([_Widget, _TemplatedMixin, _WidgetsInTemplateMixin], {
    templateString: template,

    labelWidth: 130,

    constructor() {
      return lang.mixin(this, strings.proteinView);
    },

    postCreate() {
      this.inherited(arguments);
      this.dialog.backButton.on("click", this.nextOrBackButtonHandler.bind(this, false));
      this.dialog.nextButton.on("click", this.nextOrBackButtonHandler.bind(this, true));
      this.dialog.on("hide", this.hideDialog.bind(this));
      listener(this.proteinName, "click", this.proteinLabelClickHandler.bind(this));

      const topArea = d3.select(this.headerSvgArea);
      this.proteinsBar = new ProteinsBar(topArea.append("g"), this.labelWidth, true);
      this.aminoacidsLayerCakeHeader = new AminoacidsLayerCakeHeader(topArea.append("g"), this.labelWidth);
      const offset = this.aminoacidsLayerCakeHeader.getHeight();
      this.layerCakeHeader = new NucleotidesLayerCakeHeader(topArea.append("g"), this.labelWidth);
      const centerArea = d3.select(this.centerSvgArea);
      this.cake = new LayerCake(this.domNode, centerArea.append("g"), this.labelWidth,
                            (x => x.nucleotidesCounter - (this.currentScreen * maxNucleotidesCount)), (function(x) { return x.populationIndex; }), (function(x) { return x.variance; }),
                            "cell");
      this.proteinsBar.on("mouseClick", this.proteinClickHandler.bind(this));
      this.cake.on("mouseMove", this.mouseMoveHandler.bind(this));
      this.centerPane.on("mouseLeave", this.centerPaneMouseLeaveHandler.bind(this));

      const oldResize = this.rightPane.resize;
      return this.rightPane.resize = function(s) {
        oldResize.call(this, s);
        if ((s.h != null) && (options != null)) { options.height = s.h; }
        if (viewer) { return viewer.resize(options.width, s.h || options.height); }
      };
    },

    show(groupedTable, fitnessTable, threshold, proteins, protein) {
      this.groupedTable = groupedTable;
      this.fitnessTable = fitnessTable;
      this.range = {start: protein.start, end: protein.end};
      this.nucleotidesTable = this.groupedTable.makeNucleotidesTableForRange(this.range.start, this.range.end);
      this.currentScreen = 0;
      this.currentProteins = proteins.cut(protein);
      this.proteinsBar.setData(this.currentProteins, protein.start, protein.end);
      let offset = this.proteinsBar.getHeight() + 5;
      this.aminoacidsLayerCakeHeader.move(0, offset);
      offset += this.aminoacidsLayerCakeHeader.getHeight() + 10;
      this.layerCakeHeader.move(0, offset);
      offset += this.layerCakeHeader.getHeight() + 20;
      this.topPane.resize({h: offset});

      this.dialog.show();

      if (firstTime) {
        const centerPaneSize = domGeometry.position(this.centerPane.domNode);
        const withoutScrollBarSize = {w: centerPaneSize.w - uiUtils.getScrollBarWidth(), h: centerPaneSize.h};
        this.proteinsBar.resize(withoutScrollBarSize);
        this.aminoacidsLayerCakeHeader.resize(withoutScrollBarSize);
        this.layerCakeHeader.resize(withoutScrollBarSize);
        this.cake.resize(withoutScrollBarSize);
        firstTime = false;

        const rightPaneSize = domGeometry.position(this.rightPane.domNode);
        const newH = (centerPaneSize.h + rightPaneSize.h) / 2;
        this.rightPane.resize({h: newH});
        options = {
          width: Math.floor((rightPaneSize.w - 10) / 2),
          height: newH,
          antialias: true,
          quality: "high"
        };
        domStyle.set(this.proteinCell, "max-width", `${options.width}px`);
        domStyle.set(this.proteinDescriptionCell, "max-width", `${options.width}px`);
        domStyle.set(this.proteinCell, "max-height", `${newH}px`);
        window.viewer = (viewer = pv.Viewer(this.protein3dmodel, options));
      }

      this.mainContainer.layout();
      try {
        this.updateState();
      } catch (e) {
        // if WebGL is not supported, we get this exception
        console.warn(e);
      }
      domStyle.set(this.centerSvgArea, "height", this.cake.getHeight() + "px");
      return d3.select(this.centerSvgArea).attr("height", this.cake.getHeight() + "px");
    },

    nextOrBackButtonHandler(next) {
      this.currentScreen += ((next) ? +1 : -1);
      return this.updateState();
    },

    updateState() {
      const screenTable = this.nucleotidesTable.slice(this.currentScreen, maxNucleotidesCount);
      const screenFitnessTable = this.fitnessTable.slice(this.range.start + (this.currentScreen * maxNucleotidesCount), maxNucleotidesCount);
      const nucleotides = screenTable.getReferenceNucleotides();
      const fullNecleotidesCount = this.nucleotidesTable.getReferenceNucleotides().length;

      if (fullNecleotidesCount <= maxNucleotidesCount) {
        this.proteinsBar.highlight(-1, -1);
      } else {
        this.proteinsBar.highlight(maxNucleotidesCount * this.currentScreen, maxNucleotidesCount * (this.currentScreen + 1));
      }
      this.layerCakeHeader.setData(nucleotides);
      this.aminoacidsLayerCakeHeader.setData(nucleotides);
      this.cake.setData(this.groupedTable.getPopulations(), screenTable.getNormalizedTable(), screenFitnessTable, nucleotides.length);
      this.dialog.backButton.set("disabled", this.currentScreen === 0);
      this.dialog.nextButton.set("disabled", this.currentScreen === Math.floor(fullNecleotidesCount / maxNucleotidesCount));
      return this.proteinClickHandler(this.currentProteins.getAllProteins()[0]);
    },

    mouseMoveHandler(e) { return tooltip.show2(e.column, e.row, e.d, lang.mixin({width: this.cake.cellWidth, height: this.cake.cellHeight}, e.rect), ["below"]); },

    proteinClickHandler: object.skip(1, function(protein) {
      this.currentProtein = protein;
      this.proteinName.innerHTML = protein.gene || "";
      this.proteinDescription.innerHTML = protein.description || "";
      viewer.clear();
      const gl = viewer._canvas.gl();
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      progressIndicator.show(query(".protein3dmodel canvas")[0]);
      this.messageArea.innerHTML = "";
      return this.model.loadPdb(protein.fileName)
        .then(this.newStructureHandler.bind(this), str => { return this.messageArea.innerHTML = str; })
        .always(progressIndicator.hide.bind(progressIndicator));
    }),

    newStructureHandler(structure) {
      let cartoon;
      window.structure = structure;
      window.cartoon = (cartoon = viewer.cartoon("protein", structure));//), {color: color.ssSuccession()}
      viewer.centerOn(structure);
      viewer.autoZoom();
      return this.drawFitness(viewer, cartoon, structure);
    },

    drawFitness(viewer, cartoon, structure) {
      const nucleotides = this.fitnessTable.sliceAll(this.currentProtein.start, (this.currentProtein.end - this.currentProtein.start) + 1).getData();
      const aminoacidsIterator = Iterator.fromArray(nucleotides)
        .sliding(3, 3);

      const lastIndex = -1;
      let fitness = undefined;
      const colorOperation = new color.ColorOp(function(atom, out, index) {
        if ((lastIndex !== atom.residue().index()) && aminoacidsIterator.hasNext()) {
          const aminoacid = aminoacidsIterator.next();
          fitness = (aminoacid[0][0] != null ? aminoacid[0][0].fitness : undefined) || (aminoacid[1][0] != null ? aminoacid[1][0].fitness : undefined) || (aminoacid[2][0] != null ? aminoacid[2][0].fitness : undefined);
        }
        return uiUtils.fillFitnessOut(fitness, out, index);
      });
      cartoon.colorBy(colorOperation);
      return viewer.requestRedraw();
    },

    proteinLabelClickHandler(protein) {
      const aminoacids = Aminoacids.arrToAminoacids(this.nucleotidesTable.getNucleotidesRange(this.currentProtein.start, this.currentProtein.end));
      return aminoacidsDialog.show(aminoacids);
    },

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
