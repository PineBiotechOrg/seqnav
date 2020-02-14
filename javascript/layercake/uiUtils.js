/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
define(["dojo/dom-construct",
        "./utils/Iterator"],
function(domConstruct,
 Iterator) {

  const average = function(x1, x2, alpha) {
    const res = Math.round(x1 + (alpha * (x2 - x1))).toString(16);
    switch (res.length) {
      case 2: return res;
      case 1: return `0${res}`;
      case 0: return "00";
    }
  };

  let scrollBarWidth = undefined;

  const colors = ["gray", "red", "green", "gold", "violet", "orange", "cyan", "lime", "olive"];

  return {
    getColor(threshold, variance) {
      if ((variance + 1) < (2 * threshold)) {
        return "#D4D4D4";
      } else if (variance < 0) {
        const inverse = -variance;
        return `#${average(0xD4, 0xFF, inverse)}${average(0xD4, 0xFF, inverse)}${average(0xD4, 0x00, inverse)}`;
      } else {
        return `#FF${average(0xFF, 0x00, variance)}00`;
      }
    },
      //#if (variance < threshold)
      //#  "#D4D4D4"
      //#else if (variance < 0.5 + threshold / 2)
      //#  doublevar = 2 * (variance - threshold) / (1 - threshold)
      //#  "#" + average(0xD4, 0xFF, doublevar) + average(0xD4, 0xFF, doublevar) + average(0xD4, 0x00, doublevar)
      //#else
      //#  "#FF" + average(0xFF, 0x00, (2 * variance - 1 - threshold) / (1 - threshold)) + "00"

    getScrollBarWidth() {
      if (scrollBarWidth != null) {
        return scrollBarWidth;
      } else {
        const scrollDiv = domConstruct.create("div", {style: {
          width: "100px",
          height: "100px",
          overflow: "scroll",
          position: "absolute",
          top: "-9999px"
        }
        }, document.body);
        scrollBarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
        domConstruct.destroy(scrollDiv);
        return scrollBarWidth;
      }
    },

    makeColorsIterator() { return Iterator.repeat(colors); },

    fitnessToColor(f) { switch (f) {
      case "B": return "#37B349";
      case "N": return "#00BFFA";
      case "D": return "#0080CB";
      case undefined: return "gray";
    } },

    fillFitnessOut(f, out, index) { switch (f) {
      case "B":
        out[index + 0] = 0x37 / 255;
        out[index + 1] = 0xB3 / 255;
        out[index + 2] = 0x49 / 255;
        return out[index + 3] = 1.0;
      case "N":
        out[index + 0] = 0.0;
        out[index + 1] = 0xBF / 255;
        out[index + 2] = 0xFA / 255;
        return out[index + 3] = 1.0;
      case "D":
        out[index + 0] = 0.0;
        out[index + 1] = 0x80 / 255;
        out[index + 2] = 0xCB / 255;
        return out[index + 3] = 1.0;
      case undefined:
        out[index + 0] = 0xD3 / 255;
        out[index + 1] = 0xD3 / 255;
        out[index + 2] = 0xD3 / 255;
        return out[index + 3] = 1.0;
    } }
  };
});
