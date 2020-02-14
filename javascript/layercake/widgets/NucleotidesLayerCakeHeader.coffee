define(["dojo/_base/declare", "dojo/_base/lang",
        "./AbstractLayerCakeHeader"],
(declare, lang,
 AbstractLayerCakeHeader) ->

  declare AbstractLayerCakeHeader, {
    constructor: ->
      @cellsArea.classed("nucleotide-cells", true)

    setData: (data) ->
      @inherited arguments, [data, (x) -> x.avg]

      text = @cellsArea.selectAll("text").data(data)
      text.enter()
        .append("text")
          .attr("y", @cellHeight / 2)
      text.exit().remove()
      text.text((d) -> d.reference)

      @resize @currentSize if (@currentSize)

    resize: (s) ->
      @inherited arguments

      if (@initialized)
        @cellsArea.selectAll("text")
          .attr("x", (x, i) => (i + 0.5) * @width - 1)

    _getRectanglesBarVerticalOffset: -> 0
  }
)
