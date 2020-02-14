define ["dojo/dom-construct",
        "./utils/Iterator"],
(domConstruct,
 Iterator) ->

  average = (x1, x2, alpha) ->
    res = Math.round(x1 + alpha * (x2 - x1)).toString(16)
    switch res.length
      when 2 then res
      when 1 then "0" + res
      when 0 then "00"

  scrollBarWidth = undefined

  colors = ["gray", "red", "green", "gold", "violet", "orange", "cyan", "lime", "olive"]

  getColor: (threshold, variance) ->
    if (variance + 1 < 2 * threshold)
      "#D4D4D4"
    else if (variance < 0)
      inverse = -variance
      "#" + average(0xD4, 0xFF, inverse) + average(0xD4, 0xFF, inverse) + average(0xD4, 0x00, inverse)
    else
      "#FF" + average(0xFF, 0x00, variance) + "00"
    ##if (variance < threshold)
    ##  "#D4D4D4"
    ##else if (variance < 0.5 + threshold / 2)
    ##  doublevar = 2 * (variance - threshold) / (1 - threshold)
    ##  "#" + average(0xD4, 0xFF, doublevar) + average(0xD4, 0xFF, doublevar) + average(0xD4, 0x00, doublevar)
    ##else
    ##  "#FF" + average(0xFF, 0x00, (2 * variance - 1 - threshold) / (1 - threshold)) + "00"

  getScrollBarWidth: ->
    if (scrollBarWidth?)
      scrollBarWidth
    else
      scrollDiv = domConstruct.create("div", {style:
        width: "100px"
        height: "100px"
        overflow: "scroll"
        position: "absolute"
        top: "-9999px"
      }, document.body)
      scrollBarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth
      domConstruct.destroy(scrollDiv)
      scrollBarWidth

  makeColorsIterator: -> Iterator.repeat colors

  fitnessToColor: (f) -> switch (f)
    when "B" then "#37B349"
    when "N" then "#00BFFA"
    when "D" then "#0080CB"
    when undefined then "gray"

  fillFitnessOut: (f, out, index) -> switch (f)
    when "B"
      out[index + 0] = 0x37 / 255
      out[index + 1] = 0xB3 / 255
      out[index + 2] = 0x49 / 255
      out[index + 3] = 1.0
    when "N"
      out[index + 0] = 0.0
      out[index + 1] = 0xBF / 255
      out[index + 2] = 0xFA / 255
      out[index + 3] = 1.0
    when "D"
      out[index + 0] = 0.0
      out[index + 1] = 0x80 / 255
      out[index + 2] = 0xCB / 255
      out[index + 3] = 1.0
    when undefined
      out[index + 0] = 0xD3 / 255
      out[index + 1] = 0xD3 / 255
      out[index + 2] = 0xD3 / 255
      out[index + 3] = 1.0
