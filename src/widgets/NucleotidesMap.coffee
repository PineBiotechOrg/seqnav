define(["dojo/_base/declare", "dojo/_base/lang", "dojo/dom-geometry", "dojo/dom-style",
        "dijit/_Widget", "dijit/_TemplatedMixin", "dijit/_WidgetsInTemplateMixin",
        "d3/d3",
        "./NucleotidesLayerCakeHeader", "./BinLayerCakeHeader", "./LayerCake", "./CoverageGraph", "./nucleotidesTooltip",
        "./../uiUtils",
        "dojo/text!./../templates/NucleotidesMap.html",
        "dojo/i18n!./../nls/base",
        "./StackDialog", "dijit/layout/BorderContainer", "dijit/layout/ContentPane", "dijit/form/Button",
        "xstyle/css!./../resources/nucleotides-map.css"],
(declare, lang, domGeometry, domStyle,
 _Widget, _TemplatedMixin, _WidgetsInTemplateMixin,
 d3,
 NucleotidesLayerCakeHeader, BinLayerCakeHeader, LayerCake, CoverageGraph, tooltip,
 uiUtils,
 template,
 strings) ->

  firstTime = true

  declare [_Widget, _TemplatedMixin, _WidgetsInTemplateMixin], {
    templateString: template,

    labelWidth: 100

    constructor: ->
      lang.mixin @, strings.nucleotidesMap

    postCreate: ->
      @inherited arguments
      @dialog.backButton.on "click", @nextOrBackButtonHandler.bind @, false
      @dialog.nextButton.on "click", @nextOrBackButtonHandler.bind @, true
      @dialog.on "hide", @hideDialog.bind @

      topArea = d3.select @headerSvgArea
      @binsBar = new BinLayerCakeHeader(topArea.append("g"), @labelWidth, true)
      @coverageGraph = new CoverageGraph topArea.append("g"), @labelWidth, strings.nucleotidesMap.tooltipIndex
      offset = @binsBar.getHeight()
      @coverageGraph.move(0, offset)
      @layerCakeHeader = new NucleotidesLayerCakeHeader(topArea.append("g"), @labelWidth)
      offset += @coverageGraph.getHeight()
      @layerCakeHeader.move(0, offset)
      offset += @layerCakeHeader.getHeight()
      @topPane.resize {h: offset}
      centerArea = d3.select @centerSvgArea
      @cake = new LayerCake(@domNode, centerArea.append("g"), @labelWidth,
                            ((x) -> x.nucleotidesCounter), ((x) -> x.populationIndex), ((x) -> x.variance),
                            "cell")
      @cake.on "mouseMove", @mouseMoveHandler.bind @
      @centerPane.on "mouseLeave", @centerPaneMouseLeaveHandler.bind(@)

    show: (groupedTable, fitnessInfo, threshold, evt) ->
      @groupedTable = groupedTable
      @fitnessInfo = fitnessInfo
      @currentBin = evt.column
      @binsBar.setData groupedTable.getAverages(), groupedTable.getNucleotidesRange()
      @dialog.show()

      if (firstTime)
        centerPaneSize = domGeometry.position @centerPane.domNode
        withoutScrollBarSize = {w: centerPaneSize.w - uiUtils.getScrollBarWidth(), h: centerPaneSize.h}
        @binsBar.resize withoutScrollBarSize
        @layerCakeHeader.resize withoutScrollBarSize
        @coverageGraph.resize withoutScrollBarSize
        @cake.resize withoutScrollBarSize
        @mainContainer.layout()
        firstTime = false

      @updateState()
      domStyle.set(@centerSvgArea, "height", @cake.getHeight() + "px")
      @cake.setLowThreshold(threshold / 100)

    nextOrBackButtonHandler: (next) ->
      @currentBin += (if (next) then +1 else -1)
      @updateState()

    updateState: ->
      t = @groupedTable.makeNucleotidesTable @currentBin
      nucleotides = t.getReferenceNucleotides()

      @layerCakeHeader.setData nucleotides
      @coverageGraph.setData t.getHighCoverage(), t.getPopulations(), t.getAllCoverages(), t.getNormalizedTable()[0][0].nucleotide

      slicedFitnessTable = @fitnessInfo.makeNucleotidesTable @currentBin
      @cake.setData @groupedTable.getPopulations(), t.getNormalizedTable(), slicedFitnessTable, nucleotides.length

      @binsBar.setSelection @currentBin
      @dialog.backButton.set "disabled", @currentBin is 0
      @dialog.nextButton.set "disabled", @currentBin + 1 is @groupedTable.getBinCount()
      tooltip.hide tooltip.aroundNode

    mouseMoveHandler: (e) -> tooltip.show2 e.column, e.row, e.d, lang.mixin({width: @cake.cellWidth, height: @cake.cellHeight}, e.rect), ["below"]

    centerPaneMouseLeaveHandler: ->
      @cake.hideSelectionCaret()
      tooltip.hide tooltip.aroundNode

    hideDialog: ->
      @dialog.hide()
      tooltip.hide tooltip.aroundNode
  }
)
