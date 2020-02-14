define(["dojo/_base/declare", "dojo/dom-construct", "dojo/dom-geometry", "dojo/dom-style",
        "./../utils/Iterator",
        "xstyle/css!./../resources/progress-indicator.css"
],
(declare, domConstruct, domGeometry, domStyle,
 Iterator) ->

  ProgressIndicator = declare(null, {

    constructor: ->
      @domNode = domConstruct.create("div", {className: "progress-indicator"})
      circleDiv = domConstruct.create "div", {className: "sk-fading-circle"}, @domNode
      Iterator.range(1, 12).each (i) ->
        domConstruct.create "div", {className: "sk-circle#{i} sk-circle"}, circleDiv

    show: (node) ->
      position = domGeometry.position node
      domStyle.set @domNode, {
        width: "#{position.w}px"
        height: "#{position.h}px"
        top: "#{position.y}px"
        left: "#{position.x}px"
      }
      domConstruct.place @domNode, document.body

    hide: () ->
      document.body.removeChild @domNode
  })

  new ProgressIndicator()
)
