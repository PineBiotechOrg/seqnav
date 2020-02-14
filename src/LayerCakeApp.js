/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
define(["dojo/_base/declare", "dojo/_base/lang", "dojo/string",
        "dijit/_Widget", "dijit/_TemplatedMixin", "dijit/_WidgetsInTemplateMixin",
        "bacon/dist/Bacon", "./utils/DojoBacon",
        "./model/AppModel",
        "./widgets/NucleotidesMap", "./widgets/ProteinView", "./widgets/progressIndicator",
        "dojo/text!./templates/LayerCakeApp.html", "dojo/text!./templates/HelpDialog.html",
        "dojo/i18n!./nls/base",
        "dijit/layout/BorderContainer", "dijit/layout/ContentPane", "dijit/form/ToggleButton",
        "./widgets/BinsMap", "./widgets/ColorBar", "dijit/form/Select",
        "xstyle/css!dojo-theme-flat/CSS/dojo/flat.css",
        "xstyle/css!./resources/layer-cake-app.css",
        "xstyle/css!dojox/form/resources/RangeSlider.css"],
function(declare, lang, string,
 _Widget, _TemplatedMixin, _WidgetsInTemplateMixin,
 Bacon, DojoBacon,
 AppModel,
 NucleotidesMap, ProteinView, progressIndicator,
 template, helpTemplate,
 strings) {

  let nucleotidesMap = undefined;
  let proteinViewer = undefined;

  const helpDialog = new declare([_Widget, _TemplatedMixin, _WidgetsInTemplateMixin], {
    templateString: helpTemplate
  })();

  return declare([_Widget, _TemplatedMixin, _WidgetsInTemplateMixin], {
    templateString: template,

    constructor() {
      lang.mixin(this, strings.layerCakeApp);
      return window.model = (this.model = new AppModel());
    },

    postCreate() {
      this.inherited(arguments);

      const tableStream = Bacon.fromPromise(this.model.loadPassages());
      const proteinsStream = Bacon.fromPromise(this.model.loadProteins());
      const fitnessStream = Bacon.fromPromise(this.model.loadFitness());

      const binSizeProperty = DojoBacon.fromSelect(this.binSize).map(v => parseInt(v.substr(1)));
      const thresholdProperty = DojoBacon.fromWidget(this.colorBar, "colorChange");
      const synonymousProperty = DojoBacon.fromCheckBox(this.synonymousButton);
      const nonsynonymousProperty = DojoBacon.fromCheckBox(this.nonsynonymousButton);
      const beneficialProperty = DojoBacon.fromCheckBox(this.beneficialButton);
      const neutralProperty = DojoBacon.fromCheckBox(this.neutralButton);
      const detrimentalProperty = DojoBacon.fromCheckBox(this.detrimentalButton);

      const firstGroup = [tableStream, proteinsStream, fitnessStream,
                    binSizeProperty,
                    synonymousProperty, nonsynonymousProperty];
      const secondGroup = [beneficialProperty, neutralProperty, detrimentalProperty];
      Bacon.combineAsArray(firstGroup.concat(secondGroup))
        .sampledBy(Bacon.combineAsArray(firstGroup))
        .onValues(this.updateTable.bind(this));
      Bacon.combineAsArray([fitnessStream, binSizeProperty].concat(secondGroup))
        .sampledBy(Bacon.combineAsArray(secondGroup))
        .onValues(this.applyFilter.bind(this));
      DojoBacon.fromWidget(this.binsMap, "binClick")
        .onValue(this.openNucleotideView.bind(this));
      DojoBacon.fromWidget(this.binsMap, "proteinClick")
        .onValue(this.openProteinViewer.bind(this));
      tableStream.onError(console.log.bind(console));
      proteinsStream.onError(console.log.bind(console));
      Bacon.combineAsArray(tableStream, proteinsStream)
        .onEnd(progressIndicator.hide.bind(progressIndicator));
      this.helpButton.on("click", helpDialog.dialog.show.bind(helpDialog.dialog));


      thresholdProperty.debounce(200)
          .onValue(this.binsMap.setLowThreshold.bind(this.binsMap));

      return progressIndicator.show(this.mainPanel.domNode);
    },

    updateTable(table, proteins, fitness, binSize, synon, nonsynon, beneficial, neutral, detrimental) {
      try {
        const groupedTable = table.setBinSize(binSize, synon, nonsynon, proteins.getRange().min, proteins.getRange().max);
        const groupedFitnessTable = fitness.setBinSize(binSize, beneficial, neutral, detrimental);
        return this.binsMap.setData(proteins, groupedTable, groupedFitnessTable);
      } catch (e) {
        alert(e.message);
        return console.log(e.stack);
      }
    },

    applyFilter(fitness, binSize, beneficial, neutral, detrimental) {
      const groupedFitnessTable = fitness.setBinSize(binSize, beneficial, neutral, detrimental);
      return this.binsMap.setFitnessInfo(groupedFitnessTable);
    },

    openNucleotideView(evt) {
      if (nucleotidesMap == null) { nucleotidesMap = new NucleotidesMap({model: this.model}); }
      return nucleotidesMap.show(evt.table, evt.fitnessInfo, evt.threshold, evt);
    },

    openProteinViewer(evt) {
      if (proteinViewer == null) { proteinViewer = new ProteinView({model: this.model}); }
      return proteinViewer.show(evt.table, evt.fitnessInfo, evt.threshold, evt.proteins, evt.protein);
    }
  });
});
