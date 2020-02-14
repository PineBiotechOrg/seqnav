define(["dojo/_base/declare", "dojo/_base/lang",
        "./../utils/Iterator",
        "../model/Aminoacids", "./AbstractLayerCakeHeader",
        "dojo/i18n!./../nls/base"],
(declare, lang,
 Iterator,
 Aminoacids, AbstractLayerCakeHeader,
 strings) ->

  declare AbstractLayerCakeHeader, {
    constructor: ->
      @cellsArea.classed("aminoacids-cells", true)

    getName: -> strings.layerCakeHeader.aminoacids

    setData: (data) ->
      aminoacids = Iterator.fromArray(data)
        .sliding(3, 3)
        .map((a) ->
          if (a.length isnt 3)
            {avg: 0, aminoacid: ""}
          else
            aminoacid: Aminoacids.strToAminoacid a[0].reference + a[1].reference + a[2].reference
            avg: (a[0].avg + a[1].avg + a[2].avg) / 3
        ).toArray()
      @inherited arguments, [aminoacids, (x) -> x.avg]

      text = @cellsArea.selectAll("text").data(aminoacids)
      text.enter()
        .append("text")
          .attr("y", @cellHeight / 2)
      text.exit().remove()
      text.text((d) -> d.aminoacid)

      @resize @currentSize if (@currentSize)

    resize: (s) ->
      @inherited arguments

      if (@initialized)
        @cellsArea.selectAll("text")
          .attr("x", (x, i) => (i + 0.5) * @width - 1)

    _getRectanglesBarVerticalOffset: -> 0
  }
)
