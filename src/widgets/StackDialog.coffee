define(["dojo/_base/declare", "dojo/dom-construct", "dojo/dom-geometry", "dojo/dom-style",
        "dijit/Dialog", "dijit/form/Button",
        "xstyle/css!./../resources/stack-dialog.css"],
(declare, domConstruct, domGeometry, domStyle,
 Dialog, Button) ->

  declare Dialog, {

    postCreate: ->
      @inherited arguments

      @backButton = new Button {
        style: {position: "absolute"},
        class: "stack-dialog-back-button",
      }
      @nextButton = new Button {
        style: {position: "absolute"},
        class: "stack-dialog-next-button"
      }
      @backButton.placeAt(@ownerDocumentBody)
      @backButton.startup()
      @nextButton.placeAt(@ownerDocumentBody)
      @nextButton.startup()

    _position: ->
      @inherited arguments

      p = domGeometry.position @domNode
      domStyle.set(@backButton.domNode, "top", p.y + p.h / 2 - 20 + "px")
      domStyle.set(@backButton.domNode, "left", p.x - 30 + "px")
      domStyle.set(@nextButton.domNode, "top", p.y + p.h / 2 - 20 + "px")
      domStyle.set(@nextButton.domNode, "left", p.x + p.w + 5 + "px")

    show: ->
      @inherited arguments
      domStyle.set @backButton.domNode, "display", "block"
      domStyle.set @nextButton.domNode, "display", "block"

    hide: ->
      @inherited arguments
      domStyle.set @backButton.domNode, "display", "none"
      domStyle.set @nextButton.domNode, "display", "none"
  }
)
