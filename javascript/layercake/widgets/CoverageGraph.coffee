define(["dojo/_base/declare",
        "dijit/Tooltip",
        "d3/d3",
        "./../utils/object", "./../uiUtils",
        "dojo/i18n!./../nls/base",
        "xstyle/css!./../resources/coverage-graph.css"],
(declare,
 Tooltip,
 d3,
 object, uiUtils,
 strings) ->

  GraphTooltip = declare(Tooltip._MasterTooltip, {
    constructor: (obj) ->
      @elementName = obj.elementName

    lastColumn: undefined
    lastRow: undefined

    show2: object.skip(1, (index, names, coverages, x, y) ->
      rect = {width: 8, height: 8, x: x, y: y}
      index = "<div><b>Coverages for #{@elementName} ##{index}</b></div>"
      coverage = "<div><b>#{strings.coverageGraph.coverage}</b>: #{Math.round(coverage)}</div>"
      colors = uiUtils.makeColorsIterator()
      coveragesHtml = _.reduce(names, (z, name, i) ->
        if (name?)
          z + "<div style='color: #{colors.next()}'><b>#{name}: </b> #{coverages[i].toFixed(0)}</div>"
        else
          colors.next()
          z
      , "")
      @show("<div>#{index}#{coveragesHtml}</div>", rect, ["below", "above"])
    )
  })

  FocusCircle = declare null, {
    constructor: (graphArea, horizontalOffset,
                  xScale, height,
                  elementName) ->
      @xScale = xScale
      @offset = horizontalOffset

      @focus = graphArea.append("line")
        .attr("x1", 0).attr("y1", 0)
        .attr("x2", 0).attr("y2", height)
        .classed("focus-circle", true)
      @focusRect = graphArea.append("rect")
        .attr("height", height)
        .attr("x", horizontalOffset)
        .classed("focus-rect", true)
        .on("mousemove", @mouseMoveHandler.bind(@))
        .on("mouseout", @hideFocusCircle.bind(@))
      @tooltip = new GraphTooltip({elementName: elementName})
      @hideFocusCircle()

    mouseMoveHandler: ->
      x0 = @xScale.invert(d3.mouse(@focusRect[0][0])[0] - @offset)
      i = Math.round(x0)
      @focus.attr("transform", "translate(#{@xScale(i) + @offset}, 0)")
      lineCoverages = _.map @data, (cs) -> if (cs?) then cs[i] else undefined
      @tooltip.show2 i + @elementOffset, @populations, lineCoverages, d3.event.clientX, d3.event.clientY

    hideFocusCircle: ->
      @focus.attr("transform", "translate(-500, 0)")
      @tooltip.hide @tooltip.aroundNode

    setCoverages: (populations, allCoverages, elementOffset) ->
      @populations = populations
      @data = allCoverages
      @elementOffset = elementOffset

    setFullWidth: (w) -> @focusRect.attr "width", w - @offset
  }

  CoverageGraph = declare null, {
    graphHeight: 80

    constructor: (area, labelWidth, elementName) ->
      @labelWidth = labelWidth

      @mainArea = area
        .attr("transform", "translate(0, 10)")
      textElement = area.classed("coverage-graph", true)
        .append("text")
        .classed("name", true)
      textElement.append("tspan")
        .text("\uF05A")
        .classed("info-icon", true)
      textElement.append("tspan")
        .attr("dx", 4)
        .text(strings.coverageGraph.coverage)
      textElement
        .on("mouseenter", Tooltip.show.bind(null, strings.proteinsBar.proteinsTooltip, textElement[0][0]))
        .on("mouseleave", Tooltip.hide.bind(null, textElement[0][0]))
      @graphArea = area.append("g")
        .attr("height", @graphHeight)
        .attr("transform", "translate(#{labelWidth}, 0)")

      @xScale = d3.scale.linear()
      @yScale = d3.scale.linear()
        .nice()
        .range([@graphHeight, 0])
      @yAxis = d3.svg.axis()
        .scale(@yScale)
        .ticks([5])
        .orient("right")
      @gAxis = @graphArea.append("g")
        .attr("class", "y axis")
      @line = d3.svg.line()
        .x((d, i) => @xScale(i).toFixed(2))
        .y((d, i) => @yScale(d).toFixed(2))

      @focusCircle = new FocusCircle @mainArea, @labelWidth, @xScale, @graphHeight, elementName

      window.model.getChosenPassagesBus().onValue @filterLines.bind @

    setData: (highestCoverage, populations, allCoverages, elementOffset) ->
      @populations = populations
      @chosenCoverages = @allCoverages = allCoverages
      @elementOffset = elementOffset
      @xScale.domain [0, allCoverages[0].length - 1]
      @yScale.domain [0, highestCoverage]
      @gAxis.call @yAxis
      @filterLines window.model.getChosenPassages()

    filterLines: (filter) ->
      @chosenCoverages = _.map @allCoverages, (x, i) -> if (filter[i]) then x else undefined
      populations = _.map @populations, (x, i) -> if (filter[i]) then x else undefined
      @focusCircle.setCoverages populations, @chosenCoverages, @elementOffset
      @resize @currentSize if (@currentSize)

    resize: (s) ->
      @currentSize = s
      if (@chosenCoverages)
        @graphArea.attr("width", s.w)
        @graphArea.selectAll("path").remove()
        @xScale.range [0, s.w - @labelWidth]
        colors = uiUtils.makeColorsIterator()
        _.each @chosenCoverages, (coverages) =>
          if (coverages?)
            @graphArea.append("path")
              .datum(coverages)
              .attr("class", "line")
              .style("stroke", colors.next())
              .attr("d", @line)
          else
            colors.next()
        @gAxis.selectAll("line")
          .attr("x2", s.w)

      @focusCircle.setFullWidth s.w

    getHeight: -> @graphHeight + 30

    move: (x, y) -> @mainArea.attr("transform", "translate(#{x}, #{y + 10})")
  }
)
