/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
define(["dojo/_base/declare",
        "underscore/underscore",
        "./../utils/Iterator",
        "./Aminoacids"],
function(declare,
 _,
 Iterator,
 Aminoacids) {

  const compareNucleotide = (x, obj) => obj.nucleotide < x;

  // Util method which takes array population and scrolls to nucleotide 'untilNucleotide'
  // starting from position 'start'. Returns object with index of nucleotide 'untilNucleotide'
  // and how much nucleotide were scrolled.
  const skipNucleotides = function(population, start, untilNucleotide) {
    let idx = start;
    let x = population[start];
    const { length } = population;
    let skipped = 0;
    while (idx < length) {
      const nextX = population[idx];
      if (nextX.nucleotide !== x.nucleotide) { skipped++; }
      x = nextX;
      if (x.nucleotide === untilNucleotide) { break; }
      idx++;
    }
    return {nextIdx: idx, skipped};
  };

  // Util method which takes population and returns all nucleotides with current position.
  const skipOneNucleotide = function(nucleotides, idx, populationIndex, nucleotidesCounter) {
    const { nucleotide } = nucleotides[idx];
    const {nextIdx} = skipNucleotides(nucleotides, idx, nucleotide + 1);
    const groupedNucleotides = nucleotides.slice(idx, nextIdx);
    //idx = nextIdx
    groupedNucleotides.variance = 0;
    groupedNucleotides.nucleotidesCounter = nucleotidesCounter;
    groupedNucleotides.populationIndex = populationIndex;
    return {ns: groupedNucleotides, idx: nextIdx};
  };

  // Builds table with rates for nucleotides.
  const NucleotidesTable = declare(null, {
    constructor(range, baseTable, scanNextChunk, normalChunkSize, firstNucleotide, lastNucleotide, lowThreshold, highThreshold) {
      const drop = compareNucleotide.bind(null, range.from);
      const take = compareNucleotide.bind(null, range.to);

      const normalizedTable = [];
      const allCoverages = [];
      let tableHighestCoverage = 0;
      _.each(baseTable.data, function(population, populationIndex) {
        const nucleotides = Iterator.fromArray(population)
          .dropWhile(drop)
          .takeWhile(take)
          .toArray();

        let idx = 0;
        const { length } = nucleotides;
        let nucleotidesCounter = 0;
        const { max } = baseTable;
        const coverages = [];
        while (idx < length) {
          var groupedNucleotides;
          const { nucleotide } = nucleotides[idx];
          if ((nucleotide < firstNucleotide) || (lastNucleotide < nucleotide)) {
            ({ns: groupedNucleotides, idx} = skipOneNucleotide(nucleotides, idx, populationIndex, nucleotidesCounter++));
            normalizedTable.push(groupedNucleotides);
          } else {
            const chunk = scanNextChunk(nucleotides, idx, lastNucleotide);
            if (((chunk.length - 2) / 2) < normalChunkSize) {
              let i = 0;
              while ((i++ < normalChunkSize) && (idx < length)) {
                ({ns: groupedNucleotides, idx} = skipOneNucleotide(nucleotides, idx, populationIndex, nucleotidesCounter++));
                normalizedTable.push(groupedNucleotides);
                coverages.push(groupedNucleotides[0].coverage);
                tableHighestCoverage = Math.max(groupedNucleotides[0].coverage, tableHighestCoverage);
              }
            } else {
              let j = 0;
              idx = chunk[chunk.length - 1];
              const lastChunkIndex = chunk.length - 2;
              while (j < lastChunkIndex) {
                groupedNucleotides = nucleotides.slice(chunk[j++], chunk[j++]);
                groupedNucleotides.variance = Table.calcRate(lowThreshold, highThreshold, groupedNucleotides, 0, groupedNucleotides.length);
                groupedNucleotides.nucleotidesCounter = nucleotidesCounter++;
                groupedNucleotides.populationIndex = populationIndex;
                normalizedTable.push(groupedNucleotides);
                coverages.push(groupedNucleotides[0].coverage);
                tableHighestCoverage = Math.max(groupedNucleotides[0].coverage, tableHighestCoverage);
              }
            }
          }
        }

        return allCoverages.push(coverages);
      });
      this.normalizedTable = normalizedTable;

      const binSize = range.to - range.from;
      const populationCount = baseTable.data.length;
      const { length } = normalizedTable;
      this.allCoverages = allCoverages;
      this.tableHighestCoverage = tableHighestCoverage;
      this.baseTable = baseTable;
      return this.referenceNucleotides = Iterator.range(0, binSize - 1).map(function(nucleotide) {
        let i = nucleotide;
        let total = 0;
        while (i < length) {
          total += normalizedTable[i].variance;
          i += binSize;
        }
        const first = normalizedTable[nucleotide][0];
        return {nucleotide: first.nucleotide, reference: first.refNucleotide, coverage: first.coverage, avg: total / populationCount};
      }).toArray();
    },

    getPopulations() { return this.baseTable.getPopulationNames(); },
    getAllCoverages() { return this.allCoverages; },
    getHighCoverage() { return this.tableHighestCoverage; },

    getReferenceNucleotides() { return this.referenceNucleotides; },
    getNormalizedTable() { return this.normalizedTable; },

    getNucleotidesRange(from, to) {
      return Iterator.fromArray(this.getReferenceNucleotides())
        .dropWhile(compareNucleotide.bind(null, from))
        .takeWhile(compareNucleotide.bind(null, to))
        .map(n => n.reference)
        .toArray("");
    },

    slice(idx, length) {
      if (this.getReferenceNucleotides().length < length) {
        return this;
      } else {
        return new NucleotidesTableSlice(this, idx, length);
      }
    }
  });

  var NucleotidesTableSlice = declare(null, {
    constructor(parentTable, idx, length) {
      this.referenceNucleotides = parentTable.getReferenceNucleotides().slice(idx * length, (idx + 1) * length);
      const min = idx * length;
      const max = (idx + 1) * length;
      this.normalizedTable = _.filter(parentTable.getNormalizedTable(), xs => min <= xs.nucleotidesCounter && xs.nucleotidesCounter < max);
      this.allCoverages = _.map(parentTable.getAllCoverages(), coverages => coverages.slice(idx * length, (idx + 1) * length));
      this.tableHighestCoverage = Math.max.apply(null, _.map(this.allCoverages, coverages => Math.max.apply(null, coverages)));
      return this.parentTable = parentTable;
    },

    getPopulations() { return this.parentTable.getPopulationNames(); },
    getAllCoverages() { return this.allCoverages; },
    getHighCoverage() { return this.tableHighestCoverage; },

    getReferenceNucleotides() { return this.referenceNucleotides; },
    getNormalizedTable() { return this.normalizedTable; }
  });

  // Takes source data for nucleotides and aggregates that information into bins taking into account filters
  // (sysnonymous or non-synonymous), bin size, proteins range (applies only for sysnon or non-sysnon cases).
  //
  // Rate value for bin is maximum for rates across nucleotides for this bin.
  const GroupedTable = declare(null, {
    constructor(binSize, baseTable,
                  scanNextChunk, normalChunkSize,
                  firstNucleotide, lastNucleotide,
                  lowThreshold, highThreshold) {
      const bins = [];
      const totals = [];

      _.each(baseTable.data, function(population, populationIndex) {
        let idx = 0;
        const { length } = population;
        let binNumber = -1;
        let localFirstNucleotide = firstNucleotide;
        const { max } = baseTable;
        return (() => {
          const result = [];
          while (idx < length) {
            const z = population[idx];
            const endNucleotide = z.nucleotide + binSize;
            let binNucleotideCount = 0;
            if (z.nucleotide < localFirstNucleotide) {
              ({nextIdx: idx, skipped: binNucleotideCount} = skipNucleotides(population, idx, Math.min(localFirstNucleotide, endNucleotide)));
            }

            let totalBinRate = 0;
            if ((idx < length) && (population[idx].nucleotide !== endNucleotide)) {
              let chunk = [];
              while (true) {
                chunk = scanNextChunk(population, idx, endNucleotide);
                binNucleotideCount += chunk[chunk.length - 2];
                if (chunk[chunk.length - 2] < normalChunkSize) {
                  //localFirstNucleotide = idx + normalChunkSize - chunk[chunk.length - 2]
                  //localFirstNucleotide = skipNucleotides(population, idx, population[idx].nucleotide + normalChunkSize).nextIdx
                  localFirstNucleotide = population[idx].nucleotide + normalChunkSize;
                  idx = chunk[chunk.length - 1];
                  break;
                } else if ((idx < length) && (lastNucleotide < population[idx].nucleotide)) {
                  var skipped;
                  idx = chunk[chunk.length - 1];
                  ({nextIdx: idx, skipped} = skipNucleotides(population, idx, endNucleotide));
                  binNucleotideCount += skipped;
                  break;
                } else {
                  idx = chunk[chunk.length - 1];
                  let j = 0;
                  const lastChunkIndex = chunk.length - 2;
                  while (j < lastChunkIndex) {
                    //totalBinRate += Table.calcRate lowThreshold, highThreshold, population, chunk[j++], chunk[j++]
                    totalBinRate = Math.max(totalBinRate, Table.calcRate(lowThreshold, highThreshold, population, chunk[j++], chunk[j++]));
                  }
                }
              }
            }

            //binRate = totalBinRate / binNucleotideCount
            const binRate = totalBinRate;
            bins.push({
              //totalVariant: totalVariant
              //referenceVariant: referenceVariant
              rate: binRate,
              sequence: z.sequence,
              binNumber: ++binNumber,
              populationIndex,
              from: z.nucleotide,
              to: z.nucleotide + binNucleotideCount
            });
            const prevAverage = totals[binNumber] || 0;
            result.push(totals[binNumber] = prevAverage + binRate);
          }
          return result;
        })();
      });

      this.bins = bins;
      const populationCount = baseTable.data.length;
      this.averages = _.map(totals, total => total / populationCount);
      this.baseTable = baseTable;
      this.scanNextChunk = scanNextChunk;
      this.normalChunkSize = normalChunkSize;
      this.firstNucleotide = firstNucleotide;
      this.lastNucleotide = lastNucleotide;
      this.lowThreshold = lowThreshold;
      this.highThreshold = highThreshold;
      return this.allCoverages = _.map(baseTable.data, this.calcCoverage.bind(this, binSize));
    },

    getAllBins() { return this.bins; },
    getBinCount() { return this.averages.length; },
    getAverages() { return this.averages; },
    getNucleotidesRange() { return this.baseTable.nucleotidesRange; },
    getNucleotidesCount() { return (this.baseTable.nucleotidesRange.max - this.baseTable.nucleotidesRange.min) + 1; },
    getPopulations() { return this.baseTable.getPopulationNames(); },

    // Creates nucleotides table for nucleotides from bin
    makeNucleotidesTable(binNumber) {
      const bin = this.bins[binNumber];
      const firstNucleotide = (bin.from < this.firstNucleotide) ?
        this.firstNucleotide
      :
        (Math.ceil((bin.from - this.firstNucleotide) / this.normalChunkSize) * this.normalChunkSize) + this.firstNucleotide;
      return new NucleotidesTable(bin, this.baseTable, this.scanNextChunk, this.normalChunkSize, firstNucleotide, this.lastNucleotide, this.lowThreshold, this.highThreshold);
    },

    // Creates nucleotides table for nucleotides from range [from, to]
    makeNucleotidesTableForRange(from, to) {
      return new NucleotidesTable({from, to: to + 1}, this.baseTable, this.scanNextChunk, this.normalChunkSize, this.firstNucleotide, this.lastNucleotide, this.lowThreshold, this.highThreshold);
    },

    // Returns array of arrays with coverages for each passage
    getAllCoverages() { return this.allCoverages; },

    // Returns highest coverage across all passages
    getHighestCoverage() { return this.baseTable.highestCoverage; },

    // Calculates coverage for given population and bin size. Coverage for bin is average coverage across all
    // nucleotides from the bin.
    calcCoverage(binSize, population) {
      let idx = 0;
      const { length } = population;
      const result = [];
      while (idx < length) {
        var x;
        let z = population[idx];
        const endNucleotide = z.nucleotide + binSize;
        let { coverage } = z;
        let nucleotidesInBin = 1;
        while ((idx < length) && ((x = population[idx]).nucleotide < endNucleotide)) {
          if (x.nucleotide !== z.nucleotide) {
            coverage += x.coverage;
            nucleotidesInBin++;
            z = z;
          }
          idx++;
        }
        result.push(coverage / nucleotidesInBin);
      }
      return result;
    }
  });

  // Parses CSV row to JS object
  const passageStrToObj = function(passageName, parser, str) {
    const it = parser(str);
    return {
      sequence: passageName,
      nucleotide: parseInt(it()),
      refNucleotide: it(),
      varNucleotide: it(),
      coverage: parseInt(it()),
      count: parseFloat(it())
    };
  };

  // Basic module which contains raw information about all passages. Parses it from *.mt files and aggregates into bins.
  var Table = declare(null, {
    constructor(passageIterators, parser) {
      let highestCoverage = 0;
      const highestCount = 0;
      let currentTotalCount = 0;
      let maxA = -Number.MAX_VALUE;
      const data = _.map(passageIterators, function({passageName, it}) {
        let totalAperPassage = 0;
        let obj = passageStrToObj(passageName, parser, it.next());
        let currentNucleotide = obj.nucleotide;
        let currentCoverage = obj.coverage;
        currentTotalCount = obj.count;
        const array = it.map(function(str) {
          obj = passageStrToObj(passageName, parser, str);
          if (currentNucleotide !== obj.nucleotide) {
            currentNucleotide = obj.nucleotide;
            highestCoverage = Math.max(highestCoverage, currentCoverage);
            const a = Math.log((currentTotalCount / currentCoverage) + 1);
            maxA = Math.max(maxA, a);
            currentCoverage = obj.coverage;
            totalAperPassage += a;
            currentTotalCount = 0;
          }
          currentTotalCount += obj.count;
          return obj;
        }).toArray();
        return array;
      });

      data.sort(function(b1, b2) {
        const s1 = b1[0].sequence;
        const s2 = b2[0].sequence;
        if (s1 < s2) { return -1; } else { if (s1 > s2) { return 1; } else { return 0; } }
      });

      this.nucleotidesRange =  {min: _.first(data[0]).nucleotide, max: _.last(data[0]).nucleotide};
      this.data = data;
      this.highestCoverage = highestCoverage;
      this.max = maxA;
      return this.names = _.map(data, x => x[0].sequence);
    },

    getPopulationNames() { return this.names; },
    getPopulation(name) { return this.nameToPopulation[name]; },

    // Main method of this module which takes
    //   (o) binSize (int),
    //   (o) synonymous (boolean), nonsynonymous (boolean),
    //   (o) index of first nucleotide from protein (int), index of last nucleotide from last protein (int),
    //   (o) low threshold (int), high threshold (int).
    // Returns object GroupedTable.
    aggregateData(binSize,
                    synonymous, nonsynonymous,
                    proteinStart, proteinEnd,
                    lowThreshold, highThreshold) {
      //console.log "thresholds", lowThreshold, highThreshold
      const [low, high] = Array.from(this.findBoundariesInsideRange((lowThreshold * this.max) / 100, (highThreshold * this.max) / 100));
      if (synonymous) {
        if (nonsynonymous) {
          return new GroupedTable(binSize, this, scanForAllMutations, 1, this.nucleotidesRange.min, this.nucleotidesRange.max, low, high);
        } else {
          return new GroupedTable(binSize, this, scanOnlyForType.bind(null, "synonymous"), 3, proteinStart, proteinEnd, low, high);
        }
      } else {
        if (nonsynonymous) {
          return new GroupedTable(binSize, this, scanOnlyForType.bind(null, "nonsynonymous"), 3, proteinStart, proteinEnd, low, high);
        } else {
          return new GroupedTable(binSize, this, scanOnlyForType.bind(null, "empty"), 3, proteinStart, proteinEnd, low, high);
        }
      }
    },

    // Internal method which finds maximum and minumum rate between chosen lowThreshold and highThreshold.
    findBoundariesInsideRange(lowThreshold, highThreshold) {
      let low = Number.MAX_VALUE;
      let high = -Number.MAX_VALUE;
      let minSeq = -1;
      let maxSeq = -1;
      let minIdx = -1;
      let maxIdx = -1;
      _.each(this.data, function(passage) {
        let currentNucleotide = passage[0].nucleotide;
        let currentCoverage = passage[0].coverage;
        let currentTotalCount = passage[0].count;
        let j = 1;
        const l = passage.length;
        while (j < l) {
          const obj = passage[j];
          if (currentNucleotide !== obj.nucleotide) {
            const a = Math.log((currentTotalCount / currentCoverage) + 1);
            if (a >= lowThreshold) {
              low = Math.min(a, low);
            }
            if (a <= highThreshold) {
              high = Math.max(a, high);
            }

            if (a === low) {
              minIdx = j;
              minSeq = obj.sequence;
            }
            if (a === high) {
              maxIdx = j;
              maxSeq = obj.sequence;
            }

            currentCoverage = obj.coverage;
            currentNucleotide = obj.nucleotide;
            currentTotalCount = 0;
          }
          currentTotalCount += obj.count;
          j++;
        }
        return 1;
      });

      //console.log "min", minSeq, minIdx, low
      //console.log "max", maxSeq, maxIdx, high

      return [low, high];
    }
  });

  // These two methods (scanForAllMutations and scanOnlyForType) are used in order to unify processing nucleotides for different
  // kinds of filtering: synonymous, non-synonymous or plain.
  // When user doesn't specify filter (neither synonymous nor non-synonymous) we need to scan by one nucleotide and method 
  // scanForAllMutations does it. When user specifies synonymous or non-synonymous filtering, we need to scan by three nucleotides
  // (by amino acid), method scanOnlyForType does it.
  //
  // Both these methods returns array which has such structure:
  // [first_idx_for_nucleotide1, last_idx_for_nucleotide1, ..., first_idx_for_nucleotideN, last_idx_for_nucleotideN, N, nextIdx]
  //
  // If there is no nucleotides matched current filter were found, this method returns array only from two elements.
  var scanForAllMutations = function(arr, from, endNucleotide) {
    const currentNucleotide = arr[from].nucleotide;
    if (currentNucleotide === endNucleotide) {
      return [0, from];
    } else {
      let i = from + 1;
      const { length } = arr;
      while ((i < length) && (arr[i].nucleotide === currentNucleotide)) {
        i++;
      }
      if ((i === length) && (i === (from + 1))) { return [0, arr.length]; } else { return [from, i, 1, i]; }
    }
  };

  var scanOnlyForType = function(type, arr, from, endNucleotide) {
    let referenceAminoacid = "";
    let prevMutations = [""];
    let nextMutations = [];
    const result = [];
    let nucleotideNumber = 1;
    let i = from;
    const { length } = arr;
    let pair = undefined;
    while (nucleotideNumber <= 3) {
      if (i === length) {
        return [nucleotideNumber - 1, arr.length];
      }
      pair = arr[i];
      const currentNucleotide = pair.nucleotide;
      if (currentNucleotide === endNucleotide) {
        return [nucleotideNumber - 1, i];//arr[from].nucleotide + 3]
      }
      result.push(i);
      referenceAminoacid += pair.refNucleotide;
      while ((i < length) && ((pair = arr[i]).nucleotide === currentNucleotide)) {
        let mutationIndex = 0;
        while (mutationIndex < prevMutations.length) {
          nextMutations.push(prevMutations[mutationIndex] + pair.varNucleotide);
          mutationIndex++;
        }
        i++;
      }
      prevMutations = nextMutations;
      nextMutations = [];
      nucleotideNumber++;
      result.push(i);
    }

    result.push(3);
    result.push(i);
    if (type === "synonymous") {
      if (Aminoacids.checkSynonymousMutations(referenceAminoacid, prevMutations)) { return result; } else { return [3, i]; }
    } else if (type === "nonsynonymous") {
      if (Aminoacids.checkNonSynonymousMutations(referenceAminoacid, prevMutations)) { return result; } else { return [3, i]; }
    } else { // type is "empty"
      return [3, i];
    }
  };

  Table.findNucleotideInfo = function(pairs, from, to) {
    let i = from;
    let total = 0;
    let identity = 0;
    while (i < to) {
      const pair = pairs[i];
      const freq = pair.varFrequency;
      total += freq;
      if (pair.refNucleotide === pair.varNucleotide) { identity += freq; }
      i++;
    }
    return {total, identity};
  };

  Table.calcRate = function(min, max, pairs, from, to) {
    let i = from;
    let totalCount = 0;
    while (i < to) {
      totalCount += pairs[i].count;
      i++;
    }

    const val = Math.log((totalCount / pairs[from].coverage) + 1);
    if (val <= min) { return 0;
    } else if (val >= max) { return 1;
    } else { return (val - min) / (max - min); }
  };

  return Table;
});
