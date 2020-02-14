define(["dojo/_base/declare",
        "underscore/underscore",
        "./../utils/Iterator",
        "./Aminoacids"]
(declare,
 _,
 Iterator,
 Aminoacids) ->

  compareNucleotide = (x, obj) -> obj.nucleotide < x

  # Util method which takes array population and scrolls to nucleotide 'untilNucleotide'
  # starting from position 'start'. Returns object with index of nucleotide 'untilNucleotide'
  # and how much nucleotide were scrolled.
  skipNucleotides = (population, start, untilNucleotide) ->
    idx = start
    x = population[start]
    length = population.length
    skipped = 0
    while (idx < length)
      nextX = population[idx]
      if (nextX.nucleotide isnt x.nucleotide) then skipped++
      x = nextX
      if (x.nucleotide is untilNucleotide) then break
      idx++
    {nextIdx: idx, skipped: skipped}

  # Util method which takes population and returns all nucleotides with current position.
  skipOneNucleotide = (nucleotides, idx, populationIndex, nucleotidesCounter) ->
    nucleotide = nucleotides[idx].nucleotide
    {nextIdx: nextIdx} = skipNucleotides(nucleotides, idx, nucleotide + 1)
    groupedNucleotides = nucleotides.slice idx, nextIdx
    #idx = nextIdx
    groupedNucleotides.variance = 0
    groupedNucleotides.nucleotidesCounter = nucleotidesCounter
    groupedNucleotides.populationIndex = populationIndex
    {ns: groupedNucleotides, idx: nextIdx}

  # Builds table with rates for nucleotides.
  NucleotidesTable = declare null, {
    constructor: (range, baseTable, scanNextChunk, normalChunkSize, firstNucleotide, lastNucleotide, lowThreshold, highThreshold) ->
      drop = compareNucleotide.bind null, range.from
      take = compareNucleotide.bind null, range.to

      normalizedTable = []
      allCoverages = []
      tableHighestCoverage = 0
      _.each baseTable.data, (population, populationIndex) ->
        nucleotides = Iterator.fromArray(population)
          .dropWhile(drop)
          .takeWhile(take)
          .toArray()

        idx = 0
        length = nucleotides.length
        nucleotidesCounter = 0
        max = baseTable.max
        coverages = []
        while (idx < length)
          nucleotide = nucleotides[idx].nucleotide
          if (nucleotide < firstNucleotide || lastNucleotide < nucleotide)
            {ns: groupedNucleotides, idx: idx} = skipOneNucleotide nucleotides, idx, populationIndex, nucleotidesCounter++
            normalizedTable.push groupedNucleotides
          else
            chunk = scanNextChunk(nucleotides, idx, lastNucleotide)
            if ((chunk.length - 2) / 2 < normalChunkSize)
              i = 0
              while (i++ < normalChunkSize and idx < length)
                {ns: groupedNucleotides, idx: idx} = skipOneNucleotide nucleotides, idx, populationIndex, nucleotidesCounter++
                normalizedTable.push groupedNucleotides
                coverages.push groupedNucleotides[0].coverage
                tableHighestCoverage = Math.max(groupedNucleotides[0].coverage, tableHighestCoverage)
            else
              j = 0
              idx = chunk[chunk.length - 1]
              lastChunkIndex = chunk.length - 2
              while (j < lastChunkIndex)
                groupedNucleotides = nucleotides.slice chunk[j++], chunk[j++]
                groupedNucleotides.variance = Table.calcRate lowThreshold, highThreshold, groupedNucleotides, 0, groupedNucleotides.length
                groupedNucleotides.nucleotidesCounter = nucleotidesCounter++
                groupedNucleotides.populationIndex = populationIndex
                normalizedTable.push groupedNucleotides
                coverages.push groupedNucleotides[0].coverage
                tableHighestCoverage = Math.max(groupedNucleotides[0].coverage, tableHighestCoverage)

        allCoverages.push coverages
      @normalizedTable = normalizedTable

      binSize = range.to - range.from
      populationCount = baseTable.data.length
      length = normalizedTable.length
      @allCoverages = allCoverages
      @tableHighestCoverage = tableHighestCoverage
      @baseTable = baseTable
      @referenceNucleotides = Iterator.range(0, binSize - 1).map((nucleotide) ->
        i = nucleotide
        total = 0
        while (i < length)
          total += normalizedTable[i].variance
          i += binSize
        first = normalizedTable[nucleotide][0]
        {nucleotide: first.nucleotide, reference: first.refNucleotide, coverage: first.coverage, avg: total / populationCount}
      ).toArray()

    getPopulations: -> @baseTable.getPopulationNames()
    getAllCoverages: -> @allCoverages
    getHighCoverage: -> @tableHighestCoverage

    getReferenceNucleotides: -> @referenceNucleotides
    getNormalizedTable: -> @normalizedTable

    getNucleotidesRange: (from, to) ->
      Iterator.fromArray(@getReferenceNucleotides())
        .dropWhile(compareNucleotide.bind(null, from))
        .takeWhile(compareNucleotide.bind(null, to))
        .map((n) -> n.reference)
        .toArray("")

    slice: (idx, length) ->
      if (@getReferenceNucleotides().length < length)
        @
      else
        new NucleotidesTableSlice @, idx, length
  }

  NucleotidesTableSlice = declare null, {
    constructor: (parentTable, idx, length) ->
      @referenceNucleotides = parentTable.getReferenceNucleotides().slice(idx * length, (idx + 1) * length)
      min = idx * length
      max = (idx + 1) * length
      @normalizedTable = _.filter(parentTable.getNormalizedTable(), (xs) -> min <= xs.nucleotidesCounter < max)
      @allCoverages = _.map(parentTable.getAllCoverages(), (coverages) -> coverages.slice(idx * length, (idx + 1) * length))
      @tableHighestCoverage = Math.max.apply(null, _.map(@allCoverages, (coverages) -> Math.max.apply(null, coverages)))
      @parentTable = parentTable

    getPopulations: -> @parentTable.getPopulationNames()
    getAllCoverages: -> @allCoverages
    getHighCoverage: -> @tableHighestCoverage

    getReferenceNucleotides: -> @referenceNucleotides
    getNormalizedTable: -> @normalizedTable
  }

  # Takes source data for nucleotides and aggregates that information into bins taking into account filters
  # (sysnonymous or non-synonymous), bin size, proteins range (applies only for sysnon or non-sysnon cases).
  #
  # Rate value for bin is maximum for rates across nucleotides for this bin.
  GroupedTable = declare null, {
    constructor: (binSize, baseTable,
                  scanNextChunk, normalChunkSize,
                  firstNucleotide, lastNucleotide,
                  lowThreshold, highThreshold) ->
      bins = []
      totals = []

      _.each baseTable.data, (population, populationIndex) ->
        idx = 0
        length = population.length
        binNumber = -1
        localFirstNucleotide = firstNucleotide
        max = baseTable.max
        while idx < length
          z = population[idx]
          endNucleotide = z.nucleotide + binSize
          binNucleotideCount = 0
          if (z.nucleotide < localFirstNucleotide)
            {nextIdx: idx, skipped: binNucleotideCount} = skipNucleotides population, idx, Math.min(localFirstNucleotide, endNucleotide)

          totalBinRate = 0
          if (idx < length and population[idx].nucleotide isnt endNucleotide)
            chunk = []
            loop
              chunk = scanNextChunk(population, idx, endNucleotide)
              binNucleotideCount += chunk[chunk.length - 2]
              if (chunk[chunk.length - 2] < normalChunkSize)
                #localFirstNucleotide = idx + normalChunkSize - chunk[chunk.length - 2]
                #localFirstNucleotide = skipNucleotides(population, idx, population[idx].nucleotide + normalChunkSize).nextIdx
                localFirstNucleotide = population[idx].nucleotide + normalChunkSize
                idx = chunk[chunk.length - 1]
                break
              else if (idx < length and lastNucleotide < population[idx].nucleotide)
                idx = chunk[chunk.length - 1]
                {nextIdx: idx, skipped: skipped} = skipNucleotides population, idx, endNucleotide
                binNucleotideCount += skipped
                break
              else
                idx = chunk[chunk.length - 1]
                j = 0
                lastChunkIndex = chunk.length - 2
                while (j < lastChunkIndex)
                  #totalBinRate += Table.calcRate lowThreshold, highThreshold, population, chunk[j++], chunk[j++]
                  totalBinRate = Math.max(totalBinRate, Table.calcRate lowThreshold, highThreshold, population, chunk[j++], chunk[j++])

          #binRate = totalBinRate / binNucleotideCount
          binRate = totalBinRate
          bins.push {
            #totalVariant: totalVariant
            #referenceVariant: referenceVariant
            rate: binRate
            sequence: z.sequence
            binNumber: ++binNumber
            populationIndex: populationIndex
            from: z.nucleotide
            to: z.nucleotide + binNucleotideCount
          }
          prevAverage = totals[binNumber] || 0
          totals[binNumber] = prevAverage + binRate

      @bins = bins
      populationCount = baseTable.data.length
      @averages = _.map totals, (total) -> total / populationCount
      @baseTable = baseTable
      @scanNextChunk = scanNextChunk
      @normalChunkSize = normalChunkSize
      @firstNucleotide = firstNucleotide
      @lastNucleotide = lastNucleotide
      @lowThreshold = lowThreshold
      @highThreshold = highThreshold
      @allCoverages = _.map baseTable.data, @calcCoverage.bind(@, binSize)

    getAllBins: -> @bins
    getBinCount: -> @averages.length
    getAverages: -> @averages
    getNucleotidesRange: -> @baseTable.nucleotidesRange
    getNucleotidesCount: -> @baseTable.nucleotidesRange.max - @baseTable.nucleotidesRange.min + 1
    getPopulations: -> @baseTable.getPopulationNames()

    # Creates nucleotides table for nucleotides from bin
    makeNucleotidesTable: (binNumber) ->
      bin = @bins[binNumber]
      firstNucleotide = if (bin.from < @firstNucleotide)
        @firstNucleotide
      else
        Math.ceil((bin.from - @firstNucleotide) / @normalChunkSize) * @normalChunkSize + @firstNucleotide
      new NucleotidesTable bin, @baseTable, @scanNextChunk, @normalChunkSize, firstNucleotide, @lastNucleotide, @lowThreshold, @highThreshold

    # Creates nucleotides table for nucleotides from range [from, to]
    makeNucleotidesTableForRange: (from, to) ->
      new NucleotidesTable {from: from, to: to + 1}, @baseTable, @scanNextChunk, @normalChunkSize, @firstNucleotide, @lastNucleotide, @lowThreshold, @highThreshold

    # Returns array of arrays with coverages for each passage
    getAllCoverages: -> @allCoverages

    # Returns highest coverage across all passages
    getHighestCoverage: -> @baseTable.highestCoverage

    # Calculates coverage for given population and bin size. Coverage for bin is average coverage across all
    # nucleotides from the bin.
    calcCoverage: (binSize, population) ->
      idx = 0
      length = population.length
      result = []
      while idx < length
        z = population[idx]
        endNucleotide = z.nucleotide + binSize
        coverage = z.coverage
        nucleotidesInBin = 1
        while (idx < length and (x = population[idx]).nucleotide < endNucleotide)
          if (x.nucleotide isnt z.nucleotide)
            coverage += x.coverage
            nucleotidesInBin++
            z = z
          idx++
        result.push(coverage / nucleotidesInBin)
      result
  }

  # Parses CSV row to JS object
  passageStrToObj = (passageName, parser, str) ->
    it = parser(str)
    sequence: passageName
    nucleotide: parseInt(it())
    refNucleotide: it()
    varNucleotide: it()
    coverage: parseInt(it())
    count: parseFloat(it())

  # Basic module which contains raw information about all passages. Parses it from *.mt files and aggregates into bins.
  Table = declare null, {
    constructor: (passageIterators, parser) ->
      highestCoverage = 0
      highestCount = 0
      currentTotalCount = 0
      maxA = -Number.MAX_VALUE
      data = _.map(passageIterators, ({passageName, it}) ->
        totalAperPassage = 0
        obj = passageStrToObj(passageName, parser, it.next())
        currentNucleotide = obj.nucleotide
        currentCoverage = obj.coverage
        currentTotalCount = obj.count
        array = it.map((str) ->
          obj = passageStrToObj(passageName, parser, str)
          if (currentNucleotide isnt obj.nucleotide)
            currentNucleotide = obj.nucleotide
            highestCoverage = Math.max(highestCoverage, currentCoverage)
            a = Math.log(currentTotalCount / currentCoverage + 1)
            maxA = Math.max(maxA, a)
            currentCoverage = obj.coverage
            totalAperPassage += a
            currentTotalCount = 0
          currentTotalCount += obj.count
          obj
        ).toArray()
        array
      )

      data.sort((b1, b2) ->
        s1 = b1[0].sequence
        s2 = b2[0].sequence
        if (s1 < s2) then -1 else (if (s1 > s2) then 1 else 0)
      )

      @nucleotidesRange =  {min: _.first(data[0]).nucleotide, max: _.last(data[0]).nucleotide}
      @data = data
      @highestCoverage = highestCoverage
      @max = maxA
      @names = _.map data, (x) -> x[0].sequence

    getPopulationNames: -> @names
    getPopulation: (name) -> @nameToPopulation[name]

    # Main method of this module which takes
    #   (o) binSize (int),
    #   (o) synonymous (boolean), nonsynonymous (boolean),
    #   (o) index of first nucleotide from protein (int), index of last nucleotide from last protein (int),
    #   (o) low threshold (int), high threshold (int).
    # Returns object GroupedTable.
    aggregateData: (binSize,
                    synonymous, nonsynonymous,
                    proteinStart, proteinEnd,
                    lowThreshold, highThreshold) ->
      #console.log "thresholds", lowThreshold, highThreshold
      [low, high] = @findBoundariesInsideRange(lowThreshold * @max / 100, highThreshold * @max / 100)
      if (synonymous)
        if (nonsynonymous)
          new GroupedTable(binSize, @, scanForAllMutations, 1, @nucleotidesRange.min, @nucleotidesRange.max, low, high)
        else
          new GroupedTable(binSize, @, scanOnlyForType.bind(null, "synonymous"), 3, proteinStart, proteinEnd, low, high)
      else
        if (nonsynonymous)
          new GroupedTable(binSize, @, scanOnlyForType.bind(null, "nonsynonymous"), 3, proteinStart, proteinEnd, low, high)
        else
          new GroupedTable(binSize, @, scanOnlyForType.bind(null, "empty"), 3, proteinStart, proteinEnd, low, high)

    # Internal method which finds maximum and minumum rate between chosen lowThreshold and highThreshold.
    findBoundariesInsideRange: (lowThreshold, highThreshold) ->
      low = Number.MAX_VALUE
      high = -Number.MAX_VALUE
      minSeq = -1
      maxSeq = -1
      minIdx = -1
      maxIdx = -1
      _.each @data, (passage) ->
        currentNucleotide = passage[0].nucleotide
        currentCoverage = passage[0].coverage
        currentTotalCount = passage[0].count
        j = 1
        l = passage.length
        while (j < l)
          obj = passage[j]
          if (currentNucleotide isnt obj.nucleotide)
            a = Math.log(currentTotalCount / currentCoverage + 1)
            if (a >= lowThreshold)
              low = Math.min a, low
            if (a <= highThreshold)
              high = Math.max a, high

            if (a == low)
              minIdx = j
              minSeq = obj.sequence
            if (a == high)
              maxIdx = j
              maxSeq = obj.sequence

            currentCoverage = obj.coverage
            currentNucleotide = obj.nucleotide
            currentTotalCount = 0
          currentTotalCount += obj.count
          j++
        1

      #console.log "min", minSeq, minIdx, low
      #console.log "max", maxSeq, maxIdx, high

      [low, high]
  }

  # These two methods (scanForAllMutations and scanOnlyForType) are used in order to unify processing nucleotides for different
  # kinds of filtering: synonymous, non-synonymous or plain.
  # When user doesn't specify filter (neither synonymous nor non-synonymous) we need to scan by one nucleotide and method 
  # scanForAllMutations does it. When user specifies synonymous or non-synonymous filtering, we need to scan by three nucleotides
  # (by amino acid), method scanOnlyForType does it.
  #
  # Both these methods returns array which has such structure:
  # [first_idx_for_nucleotide1, last_idx_for_nucleotide1, ..., first_idx_for_nucleotideN, last_idx_for_nucleotideN, N, nextIdx]
  #
  # If there is no nucleotides matched current filter were found, this method returns array only from two elements.
  scanForAllMutations = (arr, from, endNucleotide) ->
    currentNucleotide = arr[from].nucleotide
    if (currentNucleotide is endNucleotide)
      [0, from]
    else
      i = from + 1
      length = arr.length
      while (i < length and arr[i].nucleotide is currentNucleotide)
        i++
      if (i is length and i is from + 1) then [0, arr.length] else [from, i, 1, i]

  scanOnlyForType = (type, arr, from, endNucleotide) ->
    referenceAminoacid = ""
    prevMutations = [""]
    nextMutations = []
    result = []
    nucleotideNumber = 1
    i = from
    length = arr.length
    pair = undefined
    while (nucleotideNumber <= 3)
      if (i is length)
        return [nucleotideNumber - 1, arr.length]
      pair = arr[i]
      currentNucleotide = pair.nucleotide
      if (currentNucleotide is endNucleotide)
        return [nucleotideNumber - 1, i]#arr[from].nucleotide + 3]
      result.push i
      referenceAminoacid += pair.refNucleotide
      while (i < length and (pair = arr[i]).nucleotide is currentNucleotide)
        mutationIndex = 0
        while (mutationIndex < prevMutations.length)
          nextMutations.push(prevMutations[mutationIndex] + pair.varNucleotide)
          mutationIndex++
        i++
      prevMutations = nextMutations
      nextMutations = []
      nucleotideNumber++
      result.push i

    result.push 3
    result.push i
    if (type is "synonymous")
      if (Aminoacids.checkSynonymousMutations(referenceAminoacid, prevMutations)) then result else [3, i]
    else if (type is "nonsynonymous")
      if (Aminoacids.checkNonSynonymousMutations(referenceAminoacid, prevMutations)) then result else [3, i]
    else # type is "empty"
      [3, i]

  Table.findNucleotideInfo = (pairs, from, to) ->
    i = from
    total = 0
    identity = 0
    while (i < to)
      pair = pairs[i]
      freq = pair.varFrequency
      total += freq
      identity += freq if pair.refNucleotide is pair.varNucleotide
      i++
    {total: total, identity: identity}

  Table.calcRate = (min, max, pairs, from, to) ->
    i = from
    totalCount = 0
    while (i < to)
      totalCount += pairs[i].count
      i++

    val = Math.log(totalCount / pairs[from].coverage + 1)
    if (val <= min) then 0
    else if (val >= max) then 1
    else (val - min) / (max - min)

  Table
)
