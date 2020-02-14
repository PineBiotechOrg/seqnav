define(["dojo/_base/declare", "dojo/_base/lang",
        "dijit/Tooltip",
        "underscore/underscore"
        "./../model/Table",
        "dojo/i18n!./../nls/base"],
(declare, lang,
 Tooltip,
 _,
 Table,
 strings) ->

  tooltipTemplate = [
    {name: "A", className: "green"}
    {name: "C", className: "violet"}
    {name: "G", className: "blue"}
    {name: "T", className: "yellow"}
  ]

  declare(Tooltip._MasterTooltip, {

    lastColumn: undefined
    lastRow: undefined

    show2: (column, row, pairs, rect, position) ->
      if (column isnt @lastColumn or row isnt @lastRow)
        nucleotideToPair = _.indexBy pairs, "varNucleotide"
        total = _.reduce pairs, ((z, p) -> z + p.count), 0
        notMutatedCount = nucleotideToPair[pairs[0].refNucleotide]?.count || 0
        variability = if (total is 0) then "N/A" else ((total) / total * 100).toFixed(2) + "%"

        sequenceDiv = "<div>#{strings.nucleotidesMap.sequence}: #{pairs[0].sequence}</div>"
        nucleotideDiv = "<div>#{strings.nucleotidesMap.nucleotide}: #{pairs[0].nucleotide}</div>"
        coverageDiv = "<div>#{strings.nucleotidesMap.coverage}: #{pairs[0].coverage}</div>"
        totalCountDiv = "<div>#{strings.nucleotidesMap.totalCount}: #{total.toFixed(2)}</div>"
        variabilityDiv = "<div>#{strings.nucleotidesMap.variability}: #{variability}</div>"
        body = _.map(tooltipTemplate, (obj) ->
          count = nucleotideToPair[obj.name]?.count || 0
          variability = if (total is 0) then "N/A" else (count * 100 / total).toFixed(2) + "%"
          """<div>
               <span class="square square-#{obj.className}">#{obj.name}</span>
               <label>#{count + "\t\t" + variability}</label>
             </div>""").join("")
        html = "<div class='layer-cake-tooltip'>" + sequenceDiv + nucleotideDiv + totalCountDiv + variabilityDiv + coverageDiv + body + "</div>"
        @show html, lang.mixin(null, rect, {x: rect.x - 10}), position

      @lastColumn = column
      @lastRow = row
  })()
)
