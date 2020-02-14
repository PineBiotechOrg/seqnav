define(["dojo/_base/declare", "dojo/_base/lang",
        "underscore/underscore",
        "./../utils/Iterator"]
(declare, lang,
 _,
Iterator) ->

  isUndefined = (val) -> val is 0
  # Tests whether the current window is detrimental
  isDetrimental = (val) -> val <= 0.8
  # Tests whether the current window is neutral
  isNeutral = (val) -> 0.8 < val < 1.2
  # Tests whether the current window is beneficial
  isBenefitial = (val) -> 1.2 <= val

  # Adds information about new window with value val to array collector.
  # Collector is array with three elements: first element contains count
  # of detrimental windows for nucleotides, second elements contains count
  # of neutral windows and third is for beneficial nucleotides
  classify = (collector, val) ->
    if (!isUndefined(val))
      index = -1
      if (isDetrimental(val)) then index = 0
      else if (isNeutral(val)) then index = 1
      else if (isBenefitial(val)) then index = 2
      if (index isnt -1)
        prev = collector[index] || 0
        collector[index] = prev + 1

  # Calls iterator it count times and returns last value
  skip = (it, count) ->
    it() for idx in [0..count - 1]
    it()

  # Takes one row from CSV file (actually iterator for this row) and fills
  # array collecetor with information about fitness.
  collect = (windowIndexes, rowIterator, collector) ->
    i = 0
    while (i < windowIndexes.length)
      r = skip(rowIterator, windowIndexes[i])
      window = parseFloat(r)
      classify collector, window
      i++
    collector

  sum = (arr) -> _.reduce arr, ((z, val) -> z + (val || 0)), 0

  # Takes array collector and finds out whether corresponded nucleotide is beneficial,
  # neutral or detrimental. Nucleotide has definite fitness if at least half of windows
  # have the same fitness.
  findFitness = (collector) ->
    minVotesCount = Math.ceil(sum(collector) / 2)
    idx = 0
    while (idx < collector.length)
      if (minVotesCount <= collector[idx])
        switch idx
          when 0 then return "D"
          when 1 then return "N"
          when 2 then return "B"
      idx++
    return undefined

  # Reprepsents information about nucleotides fitness from range [from, to].
  SlicedFitnessTable = declare null, {
    constructor: (parentTable, filter, from, to) ->
      @data = _.map parentTable.data.slice(from, to), (a) ->
        if (a.fitness? and a.fitness of filter) then [a] else []
      @filter = filter

    getData: -> @data
    getFilter: -> @filter
  }

  # Aggregates source data for nucleotides into groups for each beans accordingly chosen bean size
  # and chosen fitness filter.
  GroupedFitness = declare null, {
    constructor: (parentTable, binSize, filter) ->
      i = 0
      length = parentTable.data.length
      data = []
      nextBinEnd = binSize
      binNucleotides = []
      binNucleotides.bin = 0
      binNucleotides.from = 0
      while (i < length)
        if (i is nextBinEnd)
          binNucleotides.to = nextBinEnd
          data.push binNucleotides
          binNucleotides = []
          binNucleotides.bin = data.length
          binNucleotides.from = nextBinEnd
          nextBinEnd += binSize
        nucleotideInfo = parentTable.data[i]
        if (nucleotideInfo.fitness? and nucleotideInfo.fitness of filter)
          binNucleotides.push nucleotideInfo

        i++

      data.push binNucleotides
      binNucleotides.to = length

      @parentTable = parentTable
      @binSize = binSize
      @filter = filter
      @data = data

    # Returns arrays with elements for each bin. Each element is array for nucleotides with fitness.
    getData: -> @data

    # Returns current filter of GroupedFitness
    getFilter: -> @filter

    # Produces fitness table for nucleotides from bin
    makeNucleotidesTable: (binNumber) ->
      binInfo = @data[binNumber]
      @slice binInfo.from, binInfo.to

    # Produces fitness table for nucleotides from start until start + length
    slice: (from, length) ->
      new SlicedFitnessTable(@parentTable, @filter, from, from + length)

    sliceAll: (from, length) ->
      filter = {B: true, N: true, D: true}
      new SlicedFitnessTable(@parentTable, filter, from, from + length)
  }

  # This module parses source CSV file and finds out information about each nucleotide whether
  # this nucleotides is neutral, detrimental or beneficial.
  declare null, {

    constructor: (iterator, rowParser) ->
      header = iterator.next()
      windowIndexes = @_findWindowIndexes(rowParser(header))
      data = []
      minVotesCount = Math.ceil(windowIndexes.length / 2)
      lastNucleotide = 0
      collector = undefined
      iterator.each (row) ->
        it = rowParser(row)
        nucleotide = parseInt(it())
        if (lastNucleotide is nucleotide)
          collector = collect windowIndexes, it, collector
        else
          data.push {fitness: findFitness(collector)} if collector?
          while (++lastNucleotide < nucleotide)
            data.push {}
          collector = collect windowIndexes, it, []
      data.push {fitness: findFitness(collector)}

      @data = data

    _findWindowIndexes: (columnsIterator) ->
      i = 0
      windowIndexes = []
      loop
        columnHeader = columnsIterator()
        if (columnHeader is undefined)
          break
        else if (columnHeader.lastIndexOf("FitBRbinW", 0) is 0)
          windowIndexes.push(i - 1)
          i = 0
        i++
      windowIndexes

    # Once user changes bin size, this method recalculates data for bins. This method takes
    # four parameters: binSize is integer current value and three booolean parameters which
    # corresponds to current filter for fitness.
    # Returns object GroupedFitness.
    setBinSize: (binSize, beneficial, neutral, detrimental) ->
      filter = {}
      if (beneficial)
        filter.B = true
      if (neutral)
        filter.N = true
      if (detrimental)
        filter.D = true
      new GroupedFitness(@, binSize, filter)
  }
)
