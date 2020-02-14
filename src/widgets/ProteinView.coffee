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
(declare, lang, domGeometry, domStyle, listener, query,
 _Widget, _TemplatedMixin, _WidgetsInTemplateMixin,
 d3, pv, color,
 NucleotidesLayerCakeHeader, BinLayerCakeHeader, LayerCake, ProteinsBar, AminoacidsLayerCakeHeader,
 tooltip, progressIndicator,
 Aminoacids, uiUtils, Iterator, object,
 template, aminoacidsTemplate
 strings) ->

  firstTime = true
  options = undefined
  viewer = undefined

  maxNucleotidesCount = 120

  aminoacidsDialog = new declare([_Widget, _TemplatedMixin, _WidgetsInTemplateMixin], {
    templateString: aminoacidsTemplate

    constructor: ->
      lang.mixin @, strings.aminoacidsDialog

    postCreate: ->
      @inherited arguments
      @closeButton.on "click", @dialog.hide.bind(@dialog)

    show: (aminoacids) ->
      @contentArea.innerHTML = aminoacids
      @dialog.show()
  })()

  declare [_Widget, _TemplatedMixin, _WidgetsInTemplateMixin], {
    templateString: template,

    labelWidth: 130

    constructor: ->
      lang.mixin @, strings.proteinView

    postCreate: ->
      @inherited arguments
      @dialog.backButton.on "click", @nextOrBackButtonHandler.bind @, false
      @dialog.nextButton.on "click", @nextOrBackButtonHandler.bind @, true
      @dialog.on "hide", @hideDialog.bind @
      listener @proteinName, "click", @proteinLabelClickHandler.bind(@)

      topArea = d3.select @headerSvgArea
      @proteinsBar = new ProteinsBar topArea.append("g"), @labelWidth, true
      @aminoacidsLayerCakeHeader = new AminoacidsLayerCakeHeader(topArea.append("g"), @labelWidth)
      offset = @aminoacidsLayerCakeHeader.getHeight()
      @layerCakeHeader = new NucleotidesLayerCakeHeader(topArea.append("g"), @labelWidth)
      centerArea = d3.select @centerSvgArea
      @cake = new LayerCake(@domNode, centerArea.append("g"), @labelWidth,
                            ((x) => x.nucleotidesCounter - @currentScreen * maxNucleotidesCount), ((x) -> x.populationIndex), ((x) -> x.variance),
                            "cell")
      @proteinsBar.on "mouseClick", @proteinClickHandler.bind @
      @cake.on "mouseMove", @mouseMoveHandler.bind @
      @centerPane.on "mouseLeave", @centerPaneMouseLeaveHandler.bind(@)

      oldResize = @rightPane.resize
      @rightPane.resize = (s) ->
        oldResize.call(@, s)
        options.height = s.h if s.h? and options?
        viewer.resize(options.width, s.h || options.height) if viewer

    show: (groupedTable, fitnessTable, threshold, proteins, protein) ->
      @groupedTable = groupedTable
      @fitnessTable = fitnessTable
      @range = {start: protein.start, end: protein.end}
      @nucleotidesTable = @groupedTable.makeNucleotidesTableForRange @range.start, @range.end
      @currentScreen = 0
      @currentProteins = proteins.cut protein
      @proteinsBar.setData @currentProteins, protein.start, protein.end
      offset = @proteinsBar.getHeight() + 5
      @aminoacidsLayerCakeHeader.move 0, offset
      offset += @aminoacidsLayerCakeHeader.getHeight() + 10
      @layerCakeHeader.move 0, offset
      offset += @layerCakeHeader.getHeight() + 20
      @topPane.resize {h: offset}

      @dialog.show()

      if (firstTime)
        centerPaneSize = domGeometry.position @centerPane.domNode
        withoutScrollBarSize = {w: centerPaneSize.w - uiUtils.getScrollBarWidth(), h: centerPaneSize.h}
        @proteinsBar.resize withoutScrollBarSize
        @aminoacidsLayerCakeHeader.resize withoutScrollBarSize
        @layerCakeHeader.resize withoutScrollBarSize
        @cake.resize withoutScrollBarSize
        firstTime = false

        rightPaneSize = domGeometry.position @rightPane.domNode
        newH = (centerPaneSize.h + rightPaneSize.h) / 2
        @rightPane.resize {h: newH}
        options =
          width: Math.floor((rightPaneSize.w - 10) / 2)
          height: newH
          antialias: true
          quality: "high"
        domStyle.set @proteinCell, "max-width", "#{options.width}px"
        domStyle.set @proteinDescriptionCell, "max-width", "#{options.width}px"
        domStyle.set @proteinCell, "max-height", "#{newH}px"
        window.viewer = viewer = pv.Viewer @protein3dmodel, options

      @mainContainer.layout()
      try
        @updateState()
      catch e
        # if WebGL is not supported, we get this exception
        console.warn e
      domStyle.set(@centerSvgArea, "height", @cake.getHeight() + "px")
      d3.select(@centerSvgArea).attr("height", @cake.getHeight() + "px")

    nextOrBackButtonHandler: (next) ->
      @currentScreen += (if (next) then +1 else -1)
      @updateState()

    updateState: ->
      screenTable = @nucleotidesTable.slice @currentScreen, maxNucleotidesCount
      screenFitnessTable = @fitnessTable.slice(@range.start + @currentScreen * maxNucleotidesCount, maxNucleotidesCount)
      nucleotides = screenTable.getReferenceNucleotides()
      fullNecleotidesCount = @nucleotidesTable.getReferenceNucleotides().length

      if (fullNecleotidesCount <= maxNucleotidesCount)
        @proteinsBar.highlight -1, -1
      else
        @proteinsBar.highlight maxNucleotidesCount * @currentScreen, maxNucleotidesCount * (@currentScreen + 1)
      @layerCakeHeader.setData nucleotides
      @aminoacidsLayerCakeHeader.setData nucleotides
      @cake.setData @groupedTable.getPopulations(), screenTable.getNormalizedTable(), screenFitnessTable, nucleotides.length
      @dialog.backButton.set "disabled", @currentScreen is 0
      @dialog.nextButton.set "disabled", @currentScreen is Math.floor(fullNecleotidesCount / maxNucleotidesCount)
      @proteinClickHandler(@currentProteins.getAllProteins()[0])

    mouseMoveHandler: (e) -> tooltip.show2 e.column, e.row, e.d, lang.mixin({width: @cake.cellWidth, height: @cake.cellHeight}, e.rect), ["below"]

    proteinClickHandler: object.skip(1, (protein) ->
      @currentProtein = protein
      @proteinName.innerHTML = protein.gene || ""
      @proteinDescription.innerHTML = protein.description || ""
      viewer.clear()
      gl = viewer._canvas.gl()
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      progressIndicator.show query(".protein3dmodel canvas")[0]
      @messageArea.innerHTML = ""
      @model.loadPdb(protein.fileName)
        .then(@newStructureHandler.bind(@), (str) => @messageArea.innerHTML = str)
        .always(progressIndicator.hide.bind(progressIndicator))
    )

    newStructureHandler: (structure) ->
      window.structure = structure
      window.cartoon = cartoon = viewer.cartoon "protein", structure#), {color: color.ssSuccession()}
      viewer.centerOn structure
      viewer.autoZoom()
      @drawFitness(viewer, cartoon, structure)

    drawFitness: (viewer, cartoon, structure) ->
      nucleotides = @fitnessTable.sliceAll(@currentProtein.start, @currentProtein.end - @currentProtein.start + 1).getData()
      aminoacidsIterator = Iterator.fromArray(nucleotides)
        .sliding(3, 3)

      lastIndex = -1
      fitness = undefined
      colorOperation = new color.ColorOp (atom, out, index) ->
        if (lastIndex isnt atom.residue().index() and aminoacidsIterator.hasNext())
          aminoacid = aminoacidsIterator.next()
          fitness = aminoacid[0][0]?.fitness || aminoacid[1][0]?.fitness || aminoacid[2][0]?.fitness
        uiUtils.fillFitnessOut fitness, out, index
      cartoon.colorBy colorOperation
      viewer.requestRedraw()

    proteinLabelClickHandler: (protein) ->
      aminoacids = Aminoacids.arrToAminoacids(@nucleotidesTable.getNucleotidesRange(@currentProtein.start, @currentProtein.end))
      aminoacidsDialog.show aminoacids

    centerPaneMouseLeaveHandler: ->
      @cake.hideSelectionCaret()
      tooltip.hide tooltip.aroundNode

    hideDialog: ->
      @dialog.hide()
      tooltip.hide tooltip.aroundNode
  }
)
