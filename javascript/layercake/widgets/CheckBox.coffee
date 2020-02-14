define ["dojo/_base/declare",
        "dijit/_Widget",
        "xstyle/css!./../resources/checkbox.css"],
(declare,
 _Widget) ->

  declare _Widget, {

    width: 16
    height: 16

    checked: false

    constructor: ({parent, state, label}) ->
      @container = parent.append("g")
        .classed("check-box", true)
        .on("click", @mouseClickHandler.bind(@))

      rect = @container.append("rect")
        .attr("width", @width)
        .attr("height", @height)

      @polygon = @container.append("polygon")
        .attr("points", "10.1,8.7 3.5,5.9 2.1,6.3 10.1,14.4 21.6,0.0 19.6,0.0")

      @label = label
      @text = @container.append("text")
        .attr("x", @width + 5)
        .attr("y", @height / 2)
      @text.text(label)

      @setState state

    getState: -> @checked

    setState: (newValue) ->
      @checked = newValue
      @polygon.style("display", if (@checked) then "inline" else "none")

    mouseClickHandler: ->
      @setState !@checked
      @onMouseClick {label: @label, state: @checked}

    onMouseClick: (evt) ->

    getWidth: -> @width
    getHeight: -> @height

    move: (x, y) ->
      @container.attr("transform", "translate(#{x}, #{y})")
      @

    fill: (color) ->
      @text.style("fill", color)
      @

    destroy: ->
      @inherited arguments
  }
