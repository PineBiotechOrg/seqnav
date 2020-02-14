/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS201: Simplify complex destructure assignments
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
define(["dojo/_base/declare", "dojo/dom-geometry", "dojo/dom-style",
        "dijit/_Widget", "dijit/_TemplatedMixin", "dijit/_WidgetsInTemplateMixin",
        "dojox/form/HorizontalRangeSlider",
        "dojo/text!./../templates/ColorBar.html", "dojo/text!./../templates/ColoredSlider.html",
        "xstyle/css!./../resources/color-bar.css"],
function(declare, domGeometry, domStyle,
 _Widget, _TemplatedMixin, _WidgetsInTemplateMixin,
 HorizontalRangeSlider,
 template, sliderTemplate
) {

  declare("layercake/widgets/Slider", [HorizontalRangeSlider], {
    templateString: sliderTemplate,

    startup() {
      this.inherited(arguments);
      return this.remainingBarPosition = domGeometry.position(this.remainingBar);
    },

    onChange(...args) {
      const [leftVal, rightVal] = Array.from(args[0]);
      this.inherited(arguments);
      const width = (rightVal - leftVal) / 2;
      domStyle.set(this.leftRemainder, "width", `${leftVal}%`);
      domStyle.set(this.rightRemainder, "width", `${100 - rightVal}%`);
      return domStyle.set(this.rightRemainder, "left", `${rightVal}%`);
    }
  });

  /*
   * This widget allows to choose value from color gradient
   */
  return declare([_Widget, _TemplatedMixin, _WidgetsInTemplateMixin], {
    templateString: template,

    postCreate() {
      this.inherited(arguments);
      return this.colorSlider.on("change", val => {
        this.moveTick(val);
        return this.onColorChange(val);
      });
    },

    moveTick(...args) {
      const [leftVal, rightVal] = Array.from(args[0]);
      domStyle.set(this.leftTick, "left", `${((this.gradientPosition.x + ((this.gradientPosition.w * leftVal) / 100)) - 23).toFixed(2)}px`);
      domStyle.set(this.rightTick, "left", `${((this.gradientPosition.x + ((this.gradientPosition.w * rightVal) / 100)) - 23).toFixed(2)}px`);
      this.leftTick.innerHTML = `${leftVal.toFixed(0)}%`;
      return this.rightTick.innerHTML = `${rightVal.toFixed(0)}%`;
    },

    onColorChange() {},

    resize() {
      this.inherited(arguments);
      this.gradientPosition = domGeometry.position(this.gradient);
      return this.moveTick([0, 100]);
    }
  });
});
