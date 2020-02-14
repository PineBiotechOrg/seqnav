/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
define(["dojo/_base/declare", "dojo/_base/lang",
        "underscore/underscore",
        "./../utils/Iterator"],
function(declare, lang,
 _,
Iterator) {

  const isUndefined = val => val === 0;
  // Tests whether the current window is detrimental
  const isDetrimental = val => val <= 0.8;
  // Tests whether the current window is neutral
  const isNeutral = val => 0.8 < val && val < 1.2;
  // Tests whether the current window is beneficial
  const isBenefitial = val => 1.2 <= val;

  // Adds information about new window with value val to array collector.
  // Collector is array with three elements: first element contains count
  // of detrimental windows for nucleotides, second elements contains count
  // of neutral windows and third is for beneficial nucleotides
  const classify = function(collector, val) {
    if (!isUndefined(val)) {
      let index = -1;
      if (isDetrimental(val)) { index = 0;
      } else if (isNeutral(val)) { index = 1;
      } else if (isBenefitial(val)) { index = 2; }
      if (index !== -1) {
        const prev = collector[index] || 0;
        return collector[index] = prev + 1;
      }
    }
  };

  // Calls iterator it count times and returns last value
  const skip = function(it, count) {
    for (let idx = 0, end = count - 1, asc = 0 <= end; asc ? idx <= end : idx >= end; asc ? idx++ : idx--) { it(); }
    return it();
  };

  // Takes one row from CSV file (actually iterator for this row) and fills
  // array collecetor with information about fitness.
  const collect = function(windowIndexes, rowIterator, collector) {
    let i = 0;
    while (i < windowIndexes.length) {
      const r = skip(rowIterator, windowIndexes[i]);
      const window = parseFloat(r);
      classify(collector, window);
      i++;
    }
    return collector;
  };

  const sum = arr => _.reduce(arr, ((z, val) => z + (val || 0)), 0);

  // Takes array collector and finds out whether corresponded nucleotide is beneficial,
  // neutral or detrimental. Nucleotide has definite fitness if at least half of windows
  // have the same fitness.
  const findFitness = function(collector) {
    const minVotesCount = Math.ceil(sum(collector) / 2);
    let idx = 0;
    while (idx < collector.length) {
      if (minVotesCount <= collector[idx]) {
        switch (idx) {
          case 0: return "D"; break;
          case 1: return "N"; break;
          case 2: return "B"; break;
        }
      }
      idx++;
    }
    return undefined;
  };

  // Reprepsents information about nucleotides fitness from range [from, to].
  const SlicedFitnessTable = declare(null, {
    constructor(parentTable, filter, from, to) {
      this.data = _.map(parentTable.data.slice(from, to), function(a) {
        if ((a.fitness != null) && a.fitness in filter) { return [a]; } else { return []; }
    });
      return this.filter = filter;
    },

    getData() { return this.data; },
    getFilter() { return this.filter; }
  });

  // Aggregates source data for nucleotides into groups for each beans accordingly chosen bean size
  // and chosen fitness filter.
  const GroupedFitness = declare(null, {
    constructor(parentTable, binSize, filter) {
      let i = 0;
      const { length } = parentTable.data;
      const data = [];
      let nextBinEnd = binSize;
      let binNucleotides = [];
      binNucleotides.bin = 0;
      binNucleotides.from = 0;
      while (i < length) {
        if (i === nextBinEnd) {
          binNucleotides.to = nextBinEnd;
          data.push(binNucleotides);
          binNucleotides = [];
          binNucleotides.bin = data.length;
          binNucleotides.from = nextBinEnd;
          nextBinEnd += binSize;
        }
        const nucleotideInfo = parentTable.data[i];
        if ((nucleotideInfo.fitness != null) && nucleotideInfo.fitness in filter) {
          binNucleotides.push(nucleotideInfo);
        }

        i++;
      }

      data.push(binNucleotides);
      binNucleotides.to = length;

      this.parentTable = parentTable;
      this.binSize = binSize;
      this.filter = filter;
      return this.data = data;
    },

    // Returns arrays with elements for each bin. Each element is array for nucleotides with fitness.
    getData() { return this.data; },

    // Returns current filter of GroupedFitness
    getFilter() { return this.filter; },

    // Produces fitness table for nucleotides from bin
    makeNucleotidesTable(binNumber) {
      const binInfo = this.data[binNumber];
      return this.slice(binInfo.from, binInfo.to);
    },

    // Produces fitness table for nucleotides from start until start + length
    slice(from, length) {
      return new SlicedFitnessTable(this.parentTable, this.filter, from, from + length);
    },

    sliceAll(from, length) {
      const filter = {B: true, N: true, D: true};
      return new SlicedFitnessTable(this.parentTable, filter, from, from + length);
    }
  });

  // This module parses source CSV file and finds out information about each nucleotide whether
  // this nucleotides is neutral, detrimental or beneficial.
  return declare(null, {

    constructor(iterator, rowParser) {
      const header = iterator.next();
      const windowIndexes = this._findWindowIndexes(rowParser(header));
      const data = [];
      const minVotesCount = Math.ceil(windowIndexes.length / 2);
      let lastNucleotide = 0;
      let collector = undefined;
      iterator.each(function(row) {
        const it = rowParser(row);
        const nucleotide = parseInt(it());
        if (lastNucleotide === nucleotide) {
          return collector = collect(windowIndexes, it, collector);
        } else {
          if (collector != null) { data.push({fitness: findFitness(collector)}); }
          while (++lastNucleotide < nucleotide) {
            data.push({});
          }
          return collector = collect(windowIndexes, it, []);
        }});
      data.push({fitness: findFitness(collector)});

      return this.data = data;
    },

    _findWindowIndexes(columnsIterator) {
      let i = 0;
      const windowIndexes = [];
      while (true) {
        const columnHeader = columnsIterator();
        if (columnHeader === undefined) {
          break;
        } else if (columnHeader.lastIndexOf("FitBRbinW", 0) === 0) {
          windowIndexes.push(i - 1);
          i = 0;
        }
        i++;
      }
      return windowIndexes;
    },

    // Once user changes bin size, this method recalculates data for bins. This method takes
    // four parameters: binSize is integer current value and three booolean parameters which
    // corresponds to current filter for fitness.
    // Returns object GroupedFitness.
    setBinSize(binSize, beneficial, neutral, detrimental) {
      const filter = {};
      if (beneficial) {
        filter.B = true;
      }
      if (neutral) {
        filter.N = true;
      }
      if (detrimental) {
        filter.D = true;
      }
      return new GroupedFitness(this, binSize, filter);
    }
  });
});
