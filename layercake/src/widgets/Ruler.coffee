define(["dojo/_base/declare",
        "./../utils/Iterator",
        "xstyle/css!./../resources/ruler.css"],
(declare,
 Iterator) ->

  declare null, {
    fontHeight: 12
    fontWidth: 6

    constructor: (area, labelWidth) ->
      @labelWidth = labelWidth
      @labelsArea = area.append("g")
        .attr("height", @fontHeight)
        .attr("transform", "translate(#{labelWidth}, 0)")
        .classed("ruler-ticks", true)

    setRange: (min, max) ->
      @min = min
      @max = max

    resize: (s) ->
      min = @min
      max = @max
      if (min and max)
        digitsNumber = Math.floor(Math.log(max) / Math.LN10 + 1)
        availableWidth = s.w - @labelWidth
        m = Math.floor(Math.log(availableWidth / (digitsNumber + 3) / @fontWidth) / Math.LN2)
        intervalsCount = Math.pow(2, m)
        intervalLength = (max - min) / intervalsCount
        points = Iterator.range(0, intervalsCount)
          .map((i) -> {label: Math.round(min + intervalLength * i), offset: availableWidth / intervalsCount * i})
          .toArray()

        pointText = @labelsArea.selectAll("text").data(points)
        pointText.enter().append("text")
          .attr("y", @fontHeight)
        pointText.exit().remove()
        pointText.attr("x", (d) -> "#{d.offset}px")
          .text((d) -> d.label)

    getHeight: -> @fontHeight + 2
  }
)
