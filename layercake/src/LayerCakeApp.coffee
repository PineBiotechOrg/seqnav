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
(declare, lang, string,
 _Widget, _TemplatedMixin, _WidgetsInTemplateMixin,
 Bacon, DojoBacon,
 AppModel,
 NucleotidesMap, ProteinView, progressIndicator,
 template, helpTemplate,
 strings) ->

  nucleotidesMap = undefined
  proteinViewer = undefined

  helpDialog = new declare([_Widget, _TemplatedMixin, _WidgetsInTemplateMixin], {
    templateString: helpTemplate
  })()

  declare [_Widget, _TemplatedMixin, _WidgetsInTemplateMixin], {
    templateString: template,

    constructor: ->
      lang.mixin @, strings.layerCakeApp
      window.model = @model = new AppModel()

    postCreate: ->
      @inherited arguments

      tableStream = Bacon.fromPromise(@model.loadPassages())
      proteinsStream = Bacon.fromPromise(@model.loadProteins())
      fitnessStream = Bacon.fromPromise(@model.loadFitness())

      binSizeProperty = DojoBacon.fromSelect(@binSize).map((v) -> parseInt v.substr(1))
      thresholdProperty = DojoBacon.fromWidget(@colorBar, "colorChange")
      synonymousProperty = DojoBacon.fromCheckBox(@synonymousButton)
      nonsynonymousProperty = DojoBacon.fromCheckBox(@nonsynonymousButton)
      beneficialProperty = DojoBacon.fromCheckBox(@beneficialButton)
      neutralProperty = DojoBacon.fromCheckBox(@neutralButton)
      detrimentalProperty = DojoBacon.fromCheckBox(@detrimentalButton)

      firstGroup = [tableStream, proteinsStream, fitnessStream,
                    binSizeProperty,
                    synonymousProperty, nonsynonymousProperty]
      secondGroup = [beneficialProperty, neutralProperty, detrimentalProperty]
      Bacon.combineAsArray(firstGroup.concat(secondGroup))
        .sampledBy(Bacon.combineAsArray(firstGroup))
        .onValues @updateTable.bind(@)
      Bacon.combineAsArray([fitnessStream, binSizeProperty].concat(secondGroup))
        .sampledBy(Bacon.combineAsArray(secondGroup))
        .onValues @applyFilter.bind(@)
      DojoBacon.fromWidget(@binsMap, "binClick")
        .onValue @openNucleotideView.bind(@)
      DojoBacon.fromWidget(@binsMap, "proteinClick")
        .onValue @openProteinViewer.bind(@)
      tableStream.onError console.log.bind(console)
      proteinsStream.onError console.log.bind(console)
      Bacon.combineAsArray(tableStream, proteinsStream)
        .onEnd(progressIndicator.hide.bind(progressIndicator))
      @helpButton.on "click", helpDialog.dialog.show.bind(helpDialog.dialog)


      thresholdProperty.debounce(200)
          .onValue(@binsMap.setLowThreshold.bind @binsMap)

      progressIndicator.show @mainPanel.domNode

    updateTable: (table, proteins, fitness, binSize, synon, nonsynon, beneficial, neutral, detrimental) ->
      try
        groupedTable = table.setBinSize binSize, synon, nonsynon, proteins.getRange().min, proteins.getRange().max
        groupedFitnessTable = fitness.setBinSize binSize, beneficial, neutral, detrimental
        @binsMap.setData proteins, groupedTable, groupedFitnessTable
      catch e
        alert e.message
        console.log e.stack

    applyFilter: (fitness, binSize, beneficial, neutral, detrimental) ->
      groupedFitnessTable = fitness.setBinSize binSize, beneficial, neutral, detrimental
      @binsMap.setFitnessInfo groupedFitnessTable

    openNucleotideView: (evt) ->
      nucleotidesMap = new NucleotidesMap({model: @model}) unless nucleotidesMap?
      nucleotidesMap.show(evt.table, evt.fitnessInfo, evt.threshold, evt)

    openProteinViewer: (evt) ->
      proteinViewer = new ProteinView({model: @model}) unless proteinViewer?
      proteinViewer.show(evt.table, evt.fitnessInfo, evt.threshold, evt.proteins, evt.protein)
  }
)
