/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
define(["dojo/_base/declare", "dojo/dom-construct", "dojo/dom-geometry", "dojo/dom-style",
        "dijit/Dialog", "dijit/form/Button",
        "xstyle/css!./../resources/stack-dialog.css"],
function(declare, domConstruct, domGeometry, domStyle,
 Dialog, Button) {

  return declare(Dialog, {

    postCreate() {
      this.inherited(arguments);

      this.backButton = new Button({
        style: {position: "absolute"},
        class: "stack-dialog-back-button",
      });
      this.nextButton = new Button({
        style: {position: "absolute"},
        class: "stack-dialog-next-button"
      });
      this.backButton.placeAt(this.ownerDocumentBody);
      this.backButton.startup();
      this.nextButton.placeAt(this.ownerDocumentBody);
      return this.nextButton.startup();
    },

    _position() {
      this.inherited(arguments);

      const p = domGeometry.position(this.domNode);
      domStyle.set(this.backButton.domNode, "top", ((p.y + (p.h / 2)) - 20) + "px");
      domStyle.set(this.backButton.domNode, "left", (p.x - 30) + "px");
      domStyle.set(this.nextButton.domNode, "top", ((p.y + (p.h / 2)) - 20) + "px");
      return domStyle.set(this.nextButton.domNode, "left", p.x + p.w + 5 + "px");
    },

    show() {
      this.inherited(arguments);
      domStyle.set(this.backButton.domNode, "display", "block");
      return domStyle.set(this.nextButton.domNode, "display", "block");
    },

    hide() {
      this.inherited(arguments);
      domStyle.set(this.backButton.domNode, "display", "none");
      return domStyle.set(this.nextButton.domNode, "display", "none");
    }
  });
});
