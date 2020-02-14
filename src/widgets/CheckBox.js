/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
define(["dojo/_base/declare",
        "dijit/_Widget",
        "xstyle/css!./../resources/checkbox.css"],
function(declare,
 _Widget) {

  return declare(_Widget, {

    width: 16,
    height: 16,

    checked: false,

    constructor({parent, state, label}) {
      this.container = parent.append("g")
        .classed("check-box", true)
        .on("click", this.mouseClickHandler.bind(this));

      const rect = this.container.append("rect")
        .attr("width", this.width)
        .attr("height", this.height);

      this.polygon = this.container.append("polygon")
        .attr("points", "10.1,8.7 3.5,5.9 2.1,6.3 10.1,14.4 21.6,0.0 19.6,0.0");

      this.label = label;
      this.text = this.container.append("text")
        .attr("x", this.width + 5)
        .attr("y", this.height / 2);
      this.text.text(label);

      return this.setState(state);
    },

    getState() { return this.checked; },

    setState(newValue) {
      this.checked = newValue;
      return this.polygon.style("display", (this.checked) ? "inline" : "none");
    },

    mouseClickHandler() {
      this.setState(!this.checked);
      return this.onMouseClick({label: this.label, state: this.checked});
    },

    onMouseClick(evt) {},

    getWidth() { return this.width; },
    getHeight() { return this.height; },

    move(x, y) {
      this.container.attr("transform", `translate(${x}, ${y})`);
      return this;
    },

    fill(color) {
      this.text.style("fill", color);
      return this;
    },

    destroy() {
      return this.inherited(arguments);
    }
  });
});
