/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
define(["dojo/_base/declare", "dojo/dom-construct", "dojo/dom-geometry", "dojo/dom-style",
        "./../utils/Iterator",
        "xstyle/css!./../resources/progress-indicator.css"
],
function(declare, domConstruct, domGeometry, domStyle,
 Iterator) {

  const ProgressIndicator = declare(null, {

    constructor() {
      this.domNode = domConstruct.create("div", {className: "progress-indicator"});
      const circleDiv = domConstruct.create("div", {className: "sk-fading-circle"}, this.domNode);
      return Iterator.range(1, 12).each(i => domConstruct.create("div", {className: `sk-circle${i} sk-circle`}, circleDiv));
    },

    show(node) {
      const position = domGeometry.position(node);
      domStyle.set(this.domNode, {
        width: `${position.w}px`,
        height: `${position.h}px`,
        top: `${position.y}px`,
        left: `${position.x}px`
      });
      return domConstruct.place(this.domNode, document.body);
    },

    hide() {
      return document.body.removeChild(this.domNode);
    }
  });

  return new ProgressIndicator();
});
