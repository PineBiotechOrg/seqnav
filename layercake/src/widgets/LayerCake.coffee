define(["dojo/_base/declare", "dojo/_base/lang", "dojo/Evented",
        "./../uiUtils", "./CheckBox",
        "dojo/i18n!./../nls/base",
        "xstyle/css!./../resources/layer-cake.css"],
(declare, lang, Evented,
 uiUtils, CheckBox,
 strings) ->

  SelectionCaret = declare null, {
    row: -1
    column: -1

    constructor: (parent, horizontalOffset, cellHeight, rowGap, selectionMode) ->
      @area = parent.append("rect")
        .attr("y", if (selectionMode is "column") then -cellHeight / 2 else 0)
        .attr("transform", "translate(-500, 0)")
        .classed("selection-caret", true)
      @horizontalOffset = horizontalOffset
      @cellHeight = cellHeight
      @rowGap = rowGap
      @selectionMode = selectionMode

    setWidth: (width) ->
      @cellWidth = width
      @area.attr("width", width - 2)

    setHeight: (rowsCount, reserveForFitness) ->
      @reserveForFitness = reserveForFitness
      if (@selectionMode is "column")
        rowsCount = if (reserveForFitness) then rowsCount + 1 else rowsCount
        @area.attr("height", rowsCount * (@cellHeight + @rowGap) + @cellHeight - @rowGap)
      else
        @area.attr("height", @cellHeight + 6)

    hide: ->
      if (@row isnt -1 or @column isnt -1)
        @area.attr("transform", "translate(-500, 0)")
        @row = -1
        @column = -1
        @data = undefined

    setPosition: (row, column, data, pos) ->
      if (@row isnt row or @column isnt column)
        offsetX = column * @cellWidth + @horizontalOffset
        offsetY2 = if (@reserveForFitness) then @cellHeight else 0
        offsetY = if (@selectionMode is "column") then 0 else (@cellHeight + @rowGap) * row + offsetY2 - 3
        @area.attr("transform", "translate(#{offsetX}, #{offsetY})")
        @row = row
        @column = column
        @data = data

    getSelection: ->
      row: @row
      column: @column
      data: @data
  }

  fitnessToClass = (xs) ->
    if (xs.length is 0)
      "no-fitness"
    else
      fitness = xs[0].fitness
      if (_.every(xs, (x) -> x.fitness is fitness))
        switch (fitness)
          when "B" then "beneficial-fitness"
          when "N" then "neutral-fitness"
          when "D" then "detrimental-fitness"
      else
        "mixed-fitness"

  declare Evented, {
    cellHeight: 24
    rowGap: 10

    lowThreshold: 0

    constructor: (baseDomNode, area, labelWidth,
                  columnExtractor, rowExtractor, colorValueExtractor,
                  selectionMode) ->
      window.baseDomNode = @baseDomNode = baseDomNode
      @area = area.classed("cake", true)
      @labelWidth = labelWidth
      @columnExtractor = columnExtractor
      @rowExtractor = rowExtractor
      @colorValueExtractor = colorValueExtractor
      @labels = @area.append("g")
        .attr("labels", true)
      @fitnessRects = @area.append("g")
        .attr("transform", "translate(#{labelWidth}, 0)")
      @table = @area.append("g")
        .on("click", @mouseClickHandler.bind @)
      @selectionCaret = new SelectionCaret(@area, labelWidth, @cellHeight, @rowGap, selectionMode)
      window.model.getChosenPassagesBus().onValue @passagesUpdated.bind @

    setData: (populations, data, fitnessTable, binsCount) ->
      @populations = populations
      @data = data
      @binsCount = binsCount
      @fitnessTable = fitnessTable
      @_updateTable()

    setLowThreshold: (newValue) ->
      @lowThreshold = newValue
      @_updateTable()

    setFitness: (fitnessTable) ->
      @fitnessTable = fitnessTable
      @updateFitness()

    checkboxes: []
    _updateTable: ->
      colors = uiUtils.makeColorsIterator()

      _.each @checkboxes, (cb) -> cb.destroy()
      @checkboxes = _.map(@populations, (population, i) =>
        new CheckBox({
              parent: @labels,
              state: true,
              label:  population,
              onMouseClick: (evt) -> window.model.updatePassage(i, evt.state)
            })
          .move(0, i * (@cellHeight + @rowGap) + 4)
          .fill(colors.next())
      )
      @passagesUpdated(window.model.getChosenPassages())
      #  .append("text")
      #     .attr("y", (x, i) => (i + 0.5) * @cellHeight + @rowGap * i)
      #text.exit().remove()
      #text.text((d) -> d)
      #  .style("fill", colors.next.bind())

      rect = @table.selectAll("rect").data(@data, (obj) => "#{@columnExtractor(obj)}.#{@rowExtractor(obj)}")
      rect.enter().append("rect")
        .attr("y", (obj) => @rowExtractor(obj) * (@rowGap + @cellHeight))
        .attr("height", @cellHeight)
        .on("mousemove", @mouseMoveHandler.bind(@))
      rect.exit().remove()
      rect.style("fill", (d) => uiUtils.getColor(@lowThreshold, @colorValueExtractor(d)))

      @updateFitness()

      @resize @currentSize if @currentSize?

    updateFitness: ->
      @reserveForFitness = not _.isEmpty(@fitnessTable.getFilter())
      @table.attr("transform", "translate(#{@labelWidth}, #{if (@reserveForFitness) then @cellHeight else 0})")
      @labels.attr("transform", "translate(0, #{if (@reserveForFitness) then @cellHeight else 0})")
      fitnessRect = @fitnessRects.selectAll("polyline").data(@fitnessTable.getData())
      fitnessRect.enter().append("polyline")
      fitnessRect.exit().remove()
      fitnessRect.each (fitness) -> @setAttribute "class", fitnessToClass(fitness)
      @selectionCaret.setHeight(@populations.length, @reserveForFitness)

    passagesUpdated: (arr) ->
      if (@checkboxes.length > 0)
        _.each arr, (val, idx) => @checkboxes[idx].setState val

    mouseMoveHandler: (d) ->
      clientX = d3.event.clientX
      clientY = d3.event.clientY
      x = clientX - @baseRootRect.left
      y = clientY - @baseRootRect.top
      #if (x <= @labelWidth or
      #    x >= @currentSize.w + (@currentSize.x || 0) - 11)
      #  @selectionCaret.hide()
      #else
      row = @rowExtractor d
      column = @columnExtractor d
      rect = {x: clientX, y: clientY}
      @selectionCaret.setPosition(row, column, d, rect)
      this.emit "mouseMove", {row: row, column: column, rect: rect, d: d}

    mouseClickHandler: ->
      selection = @selectionCaret.getSelection()
      @emit("mouseClick", selection) if (selection.row isnt -1 and selection.column isnt -1)

    hideSelectionCaret: -> @selectionCaret.hide()

    resize: (s) ->
      @currentSize = s
      @baseRootRect = @baseDomNode.getBoundingClientRect()
      if (@binsCount?)
        @cellWidth = (s.w - @labelWidth) / @binsCount
        @table.selectAll("rect")
          .attr("width", @cellWidth - 1)
          .attr("x", (obj) => (@columnExtractor(obj) * @cellWidth).toFixed(1))
        @fitnessRects.selectAll("rect")
          .attr("width", @cellWidth - 1)
          .attr("x", (fitnessInfo, i) => (i * @cellWidth).toFixed(1))
        @selectionCaret.setWidth @cellWidth

        @fitnessRects.selectAll("polyline")
          .attr("points", (fitness, i) =>
            x0 = i * @cellWidth + 1
            cellWidth = @cellWidth - 4
            "#{x0.toFixed(2)},#{@cellHeight - 3} #{(x0 + cellWidth).toFixed(2)},#{@cellHeight - 3} #{(x0 + cellWidth / 2).toFixed(2)},-3"
          )

    move: (x, y) -> @area.attr("transform", "translate(#{x}, #{y})")

    getHeight: -> (@populations.length + (if (@reserveForFitness) then 1 else 0)) * (@cellHeight + @rowGap) - @rowGap
  }
)
