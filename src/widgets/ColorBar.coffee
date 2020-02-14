define(["dojo/_base/declare", "dojo/dom-geometry", "dojo/dom-style",
        "dijit/_Widget", "dijit/_TemplatedMixin", "dijit/_WidgetsInTemplateMixin",
        "dojox/form/HorizontalRangeSlider",
        "dojo/text!./../templates/ColorBar.html", "dojo/text!./../templates/ColoredSlider.html",
        "xstyle/css!./../resources/color-bar.css"],
(declare, domGeometry, domStyle,
 _Widget, _TemplatedMixin, _WidgetsInTemplateMixin,
 HorizontalRangeSlider,
 template, sliderTemplate
) ->

  declare "layercake/widgets/Slider", [HorizontalRangeSlider], {
    templateString: sliderTemplate

    startup: ->
      @inherited arguments
      @remainingBarPosition = domGeometry.position @remainingBar

    onChange: ([leftVal, rightVal]) ->
      @inherited arguments
      width = (rightVal - leftVal) / 2
      domStyle.set(@leftRemainder, "width", "#{leftVal}%")
      domStyle.set(@rightRemainder, "width", "#{100 - rightVal}%")
      domStyle.set(@rightRemainder, "left", "#{rightVal}%")
  }

  ###
  # This widget allows to choose value from color gradient
  ###
  declare [_Widget, _TemplatedMixin, _WidgetsInTemplateMixin], {
    templateString: template,

    postCreate: ->
      @inherited arguments
      @colorSlider.on "change", (val) =>
        @moveTick val
        @onColorChange val

    moveTick: ([leftVal, rightVal]) ->
      domStyle.set @leftTick, "left", "#{(@gradientPosition.x + @gradientPosition.w * leftVal / 100 - 23).toFixed(2)}px"
      domStyle.set @rightTick, "left", "#{(@gradientPosition.x + @gradientPosition.w * rightVal / 100 - 23).toFixed(2)}px"
      @leftTick.innerHTML = "#{leftVal.toFixed(0)}%"
      @rightTick.innerHTML = "#{rightVal.toFixed(0)}%"

    onColorChange: ->

    resize: ->
      @inherited arguments
      @gradientPosition = domGeometry.position @gradient
      @moveTick [0, 100]
  }
)
