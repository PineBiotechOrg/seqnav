define(["dojo/_base/declare", "dojo/_base/lang",
        "./../utils/Iterator",
        "./AbstractLayerCakeHeader", "./Ruler"],
(declare, lang,
 Iterator,
 AbstractLayerCakeHeader, Ruler) ->

  declare AbstractLayerCakeHeader, {
    fontHeight: 12
    fontWidth: 6

    "-chains-":
      constructor: "manual"

    constructor: (area, labelWidth) ->
      @ruler = new Ruler area, labelWidth
      @inherited arguments

    setData: (data, range) ->
      @inherited arguments, [data, (x) -> x]
      @ruler.setRange range.min, range.max

      @resize @currentSize if (@currentSize)

    resize: (s) ->
      @inherited arguments

      if (@initialized)
        @ruler.resize s

    _getRectanglesBarVerticalOffset: -> @ruler.getHeight()
  }
)
