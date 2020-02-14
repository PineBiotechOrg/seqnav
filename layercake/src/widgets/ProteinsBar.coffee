define(["dojo/_base/declare", "dojo/_base/lang", "dojo/Evented",
        "dijit/Tooltip",
        "underscore/underscore",
        "d3/d3",
        "./Ruler",
        "dojo/i18n!./../nls/base",
        "xstyle/css!./../resources/proteins-bar.css"],
(declare, lang, Evented,
 Tooltip,
 _,
 d3,
 Ruler,
 strings) ->

  keyMaker = (obj) -> "#{obj.gene}.#{obj.level}"

  gene = (d) -> d.gene

  declare Evented, {
    proteinHeight: 30
    proteinsGap: 10

    constructor: (area, labelWidth, withRuler) ->
      @area = area
      @labelWidth = labelWidth
      @ruler = new Ruler area, labelWidth if withRuler
      @rulerHeight = if (@ruler) then @ruler.getHeight() else 0
      textElement = area.append("text")
        .classed("protein-header", true)
        .attr("y", @proteinHeight / 2 + @rulerHeight)
      textElement.append("tspan")
        .text("\uF05A")
        .classed("info-icon", true)
      textElement.append("tspan")
        .attr("dx", 4)
        .text(strings.proteinsBar.proteins)
      textElement
        .on("mouseenter", Tooltip.show.bind(null, strings.proteinsBar.proteinsTooltip, textElement[0][0]))
        .on("mouseleave", Tooltip.hide.bind(null, textElement[0][0]))

      @selectedArea = area.append("rect")
        .classed("highlighted-proteins-area", true)

      @rectangleAreas = area.append("g")
        .attr("transform", "translate(#{labelWidth}, 0)")
        .classed("proteins-bar", true)

    setData: (proteins, firstNucleotide, lastNucleotide) ->
      @proteins = proteins
      @ruler.setRange(firstNucleotide, lastNucleotide) if @ruler
      @firstNucleotide = firstNucleotide
      @lastNucleotide = lastNucleotide

      text = @rectangleAreas.selectAll("text").data(proteins.getAllProteins(), keyMaker)
      text.enter().append("text")
        .attr("y", (d) => @proteinHeight / 2 + d.level * (@proteinHeight + @proteinsGap) + @rulerHeight)
        .filter((d) -> d.type is "PROTEIN")
        .on("click", @mouseClickHandler.bind(@))
      text.exit().remove()
      text.text(gene)

      rect = @rectangleAreas.selectAll("rect").data(proteins.getAllProteins(), keyMaker)
      rect.enter().append("rect")
        .attr("height", @proteinHeight)
        .attr("y", (d) => d.level * (@proteinHeight + @proteinsGap) + @rulerHeight)
        .filter((d) -> d.type is "PROTEIN")
        .on("click", @mouseClickHandler.bind(@))
      title = rect.append("title")
      rect.exit().remove()
      title.text(gene)

      @resize @currentSize if @currentSize

    highlight: (leftEdge, rightEdge) ->
      @leftEdge = leftEdge
      @rightEdge = rightEdge
      if (leftEdge < rightEdge)
        @selectedArea.attr("height", @proteins.getLevelsCount() * (@proteinHeight + @proteinsGap) - @proteinsGap + @rulerHeight)

      @resize @currentSize if @currentSize

    mouseClickHandler: (d) -> @emit "mouseClick", d

    resize: (s) ->
      @currentSize = s
      if (@proteins)
        firstNucleotide = @firstNucleotide
        scale = (s.w - @labelWidth) / (@lastNucleotide - firstNucleotide + 1)
        @rectangleAreas.selectAll("rect")
          .attr("x", (d) -> (d.start - firstNucleotide) * scale)
          .attr("width", (d) -> (d.end - d.start) * scale - 2)
        @rectangleAreas.selectAll("text")
          .attr("x", (d) -> (d.start - firstNucleotide) * scale + ((d.end - d.start) * scale) / 2)
          .each((d) ->
            maxWidth = (d.end - d.start) * scale - 2
            if (@getComputedTextLength() > maxWidth)
              @textContent = d.short
              if (@getComputedTextLength() > maxWidth)
                @textContent = ""
          )
      if (@leftEdge < @rightEdge)
        @selectedArea
          .attr("x", @labelWidth + @leftEdge * scale)
          .attr("width", (@rightEdge - @leftEdge) * scale)

      @ruler.resize s if @ruler

    getHeight: -> @proteins.getLevelsCount() * (@proteinHeight + @proteinsGap) -
                     @proteinsGap +
                     @rulerHeight +
                     20
  }
)
