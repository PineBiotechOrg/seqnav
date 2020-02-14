define(["dojo/_base/declare", "dojo/_base/lang",
        "dijit/_Widget", "dijit/_TemplatedMixin",
        "d3/d3",
        "./ProteinsBar", "./BinLayerCakeHeader", "./LayerCake", "./CoverageGraph",
        "dojo/i18n!./../nls/base",
        "xstyle/css!./../resources/layer-cake-header.css"],
(declare, lang,
 _Widget, _TemplatedMixin,
 d3,
 ProteinsBar, BinLayerCakeHeader, LayerCake, CoverageGraph,
 strings) ->

  declare [_Widget, _TemplatedMixin], {
    templateString: "<svg></svg>",

    labelWidth: 130,

    postCreate: ->
      @inherited arguments

      @area = d3.select @domNode
      @proteinsBar = new ProteinsBar @area.append("g"), @labelWidth
      @coverageGraph = new CoverageGraph @area.append("g"), @labelWidth, strings.binsMap.tooltipIndex
      @layerCakeHeader = new BinLayerCakeHeader(@area.append("g"), @labelWidth)
      offset = @layerCakeHeader.getHeight() + 20
      @cake = new LayerCake(@domNode, @area.append("g").attr("transform", "translate(0, #{offset})"), @labelWidth,
                            ((x) -> x.binNumber), ((x) -> x.populationIndex), ((x) -> x.rate),
                            "column")

      @proteinsBar.on "mouseClick", @proteinMouseClickHandler.bind(@)
      @cake.on "mouseClick", @cakeMouseClickHandler.bind(@)

    setData: (proteins, table, fitnessInfo) ->
      @proteinsBar.setData proteins, 1, table.getNucleotidesCount()
      @coverageGraph.setData table.getHighestCoverage(), table.getPopulations(), table.getAllCoverages(), 1
      @layerCakeHeader.setData table.getAverages(), table.getNucleotidesRange()
      @cake.setData table.getPopulations(), table.getAllBins(), fitnessInfo, table.getBinCount()

      offset = @proteinsBar.getHeight()
      @coverageGraph.move 0, offset
      offset += @coverageGraph.getHeight()
      @layerCakeHeader.move 0, offset
      offset += @layerCakeHeader.getHeight() + 20
      @cake.move 0, offset

      @proteins = proteins
      @table = table
      @fitnessInfo = fitnessInfo

    setModel: (model) -> @model = model

    currentThreshold: 0
    setLowThreshold: (threshold) ->
      @currentThreshold = threshold
      @cake.setLowThreshold(threshold / 100)

    setFitnessInfo: (fitnessInfo) ->
      @fitnessInfo = fitnessInfo
      @cake.setFitness(fitnessInfo)

    proteinMouseClickHandler: (d) ->
      @onProteinClick {table: @table, protein: d, threshold: @currentThreshold, proteins: @proteins, fitnessInfo: @fitnessInfo}

    cakeMouseClickHandler: (evt) ->
      @onBinClick lang.mixin({table: @table, threshold: @currentThreshold, fitnessInfo: @fitnessInfo}, evt)

    onProteinClick: ->
    onBinClick: ->

    resize: (s) ->
      @area.attr("width", s.w)
        .attr("height", s.h)
      @proteinsBar.resize s
      @coverageGraph.resize s
      @layerCakeHeader.resize s
      @cake.resize s
  }
)
