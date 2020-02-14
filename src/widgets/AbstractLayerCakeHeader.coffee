define(["dojo/_base/declare", "dojo/_base/lang",
        "./../uiUtils",
        "dojo/i18n!./../nls/base"],
(declare, lang,
 uiUtils,
 strings) ->

  SelectionCaret = declare null, {
    column: -1

    constructor: (parent, cellHeight, labelWidth, verticalOffset) ->
      @labelWidth = labelWidth
      @area = parent.append("rect")
        .attr("y", verticalOffset - 3)
        .attr("height", cellHeight + 6)
        .attr("transform", "translate(-500, 0)")
        .classed("selection-caret", true)

    setWidth: (width) ->
      @area.attr("width", width + 1)
      @cellWidth = width

    setPosition: (column) ->
      if (@column isnt column)
        @area.attr("transform", "translate(#{column * @cellWidth + @labelWidth - 1}, 0)")
        @column = column
  }

  declare null, {
    cellHeight: 24

    constructor: (area, labelWidth, supportsSelection) ->
      @mainArea = area
      @labelWidth = labelWidth
      @supportsSelection = supportsSelection

      if (labelWidth > 0)
        area.classed("layer-cake-header", true)
          .append("text")
          .text(@getName())
          .attr("y", @_getRectanglesBarVerticalOffset() + @cellHeight / 2)
          .classed("name", true)
      if (supportsSelection)
        @selectionCaret = new SelectionCaret area, @cellHeight, labelWidth, @_getRectanglesBarVerticalOffset()

      @cellsArea = area.append("g")
        .attr("height", @cellHeight)
        .attr("transform", "translate(#{labelWidth}, #{@_getRectanglesBarVerticalOffset()})")
        .attr("layer-cake-header-cells", true)

    getName: -> strings.layerCakeHeader.reference

    setData: (data, colorValueExtractor) ->
      @initialized = true
      @cellCount = data.length

      rect = @cellsArea.selectAll("rect").data(data)
      rect.enter().append("rect")
        .attr("height", @cellHeight)
      rect.exit().remove()
      rect.style "fill", (d) -> uiUtils.getColor(0, colorValueExtractor(d))

    resize: (s) ->
      @currentSize = s

      if (@initialized)
        width = @width = (s.w - @labelWidth) / @cellCount
        @cellsArea.selectAll("rect")
          .attr("width", width - 1)
          .attr("x", (x, i) -> i * width)
        @selectionCaret.setWidth(width) if @supportsSelection

    _getRectanglesBarVerticalOffset: -> throw new Error("Abstract")

    setSelection: (colNum) ->
      if (@supportsSelection)
        @selectionCaret.setPosition colNum
      else
        throw new Error("Not supports selection")

    getHeight: -> @cellHeight + @_getRectanglesBarVerticalOffset()

    move: (x, y) -> @mainArea.attr("transform", "translate(#{x}, #{y})")
  }
)
