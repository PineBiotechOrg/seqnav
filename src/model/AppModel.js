/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
define(["dojo/_base/declare", "dojo/_base/lang", "dojo/json", "dojo/Deferred", "dojo/promise/all",
        "dojo/request", "pv/io",
        "bacon/dist/Bacon",
        "underscore/underscore", "./../utils/Iterator",
        "./Table", "./Proteins", "./Fitness"],
function(declare, lang, JSON, Deferred, all,
 request, io,
 Bacon,
 _, Iterator,
 Table, Proteins, Fitness) {


  // Returns fuction each next call returns next cell of table. In general it does what
  // str.split(separator) does. But this function has two advantages:
  // (1) it takes into account that cells in CSV file can be escaped by quotes:
  //        1,"asdf,asdf",123
  //     This function parses three cells: 1 asdf,asfd 123
  // (2) it is faster because parses only necessary cells rather then all. Also doesn't
  //     create additional arrays.
  const rowParser = function(separator, str) {
    let i = 0;
    return function() {
      let result;
      let j = i;
      const { length } = str;
      let insideQuotes = false;
      let wasInQuotes = false;
      let ch = undefined;
      while ((j < length) && (((ch = str.charAt(j)) !== separator) || insideQuotes)) {
        if (ch === '"') {
          insideQuotes = !insideQuotes;
          wasInQuotes = true;
        }
        j++;
      }

      if (j === length) {
        if (i < j) {
          result = (wasInQuotes) ? str.substring(i + 1, str.length - 1) : str.substring(i);
          i = length;
          return result;
        } else {
          i = j;
          return undefined;
        }
      } else {
        result = str.substring(i, j);
        i = j + 1;
        return result;
      }
    };
  };

  // Next two functions are temporary. Just in order to run layercake in my environment. Must be removed at the end.
  const makeUrl = url => `/api/${url}`;

  const mkDefaultArguments = () =>
    ({
      handleAs: "json",
      headers: {"Content-Type": "application/json; charset=utf-8"},
      preventCache: true
    })
  ;


  // Hardcoded for now. Must be removed when Vivek will add service which returns passage names.
  const passages = ["SRR1036477", "SRR1036617", "SRR1036661", "SRR1036663", "SRR1036988", "SRR1036989", "SRR1036990"];

  return declare(null, {

    // Is array with true/false for each passage. If value for some passage is true then corresponded checkbox
    // is checked and line in chart is not hidden.
    [this.chosenPopulations]: undefined,

    // EventStream (see https://baconjs.github.io/api.html) with array chosenPopulations.
    [this.chosenPopulationsBus]: undefined,

    // TK: Pipelines Virology is hardcoded here, why?
    // DB: Because I need to parse page id from URL /pipelinesvirology/XXXXXX/asdf. Number XXXXXX is used in another
    //     calls.
    constructor() {
      this.key = parseInt(location.pathname.substring("/pipelinesvirology/".length));
      this.chosenPopulationsBus = new Bacon.Bus();
      return this.chosenPopulations = [];
    },

    loadNucleotides() {
      return request.get(`/visualisation/csv_input/${this.key}`).then(function(str) {
      //request.get(makeUrl("populations"), mkDefaultArguments()).then((str) ->
        const nucleotidesIterator = Iterator.splitString(str, "\r\n");
        nucleotidesIterator.next();
        return new Table(nucleotidesIterator, rowParser.bind(null, ","));
      });
    },

    loadPassages() {
      return all(_.map(passages, p => request.get(makeUrl(`passage?fileName=${p}`), mkDefaultArguments()))).then(arr => {
        const iterators = _.map(arr, (fileContent, i) => ({passageName: passages[i], it: Iterator.splitString(fileContent, "\n")}));
        this.chosenPopulations = Iterator.range(1, arr.length).map(() => true).toArray();
        this.chosenPopulationsBus.push(this.chosenPopulations);
        return new Table(iterators, rowParser.bind(null, "\t"));
      });
    },

    loadProteins() {
      return request.get(`/visualisation/csv_reference/${this.key}`).then(function(str) {
      //request.get(makeUrl("proteins"), mkDefaultArguments()).then((str) ->
        const proteinsIterator = Iterator.splitString(str, "\n");
        proteinsIterator.next();
        return new Proteins(proteinsIterator, rowParser.bind(null, ","));
      });
    },

    // TK: So is this just loading /api/fitness? Do you already have an example file for input?
    // DB: Yes, just loads fitness.txt files. I have this file only on my server. Vivek's server doesn't have this yet.
    loadFitness() {
      return request.get(makeUrl("fitness"), mkDefaultArguments()).then(function(str) {
        const nucleotidesIterator = Iterator.splitString(str, "\n");
        return new Fitness(nucleotidesIterator, rowParser.bind(null, "\t"));
      });
    },

    loadPdb(name) {
      const dfd = new Deferred();
      if (name) {
        io.fetchPdb(`/visualisation-files/pdb_${this.key}/${name}.pdb`, dfd.resolve.bind(dfd));
        //io.fetchPdb "../javascript/pdbs/#{name}.pdb", dfd.resolve.bind(dfd)
      } else {
        dfd.reject("Protein not found");
      }
      return dfd.promise;
    },

    // Just getter for @chosenPopulations
    getChosenPassages() { return this.chosenPopulations; },

    // Just getter for @chosenPopulationsBus
    getChosenPassagesBus() { return this.chosenPopulationsBus; },

    // When user checks/unchecks checkbox in layercake and corresponded line in CoverageGraph must be showed/hidden,
    // this method must be called. It updates chosenPopulationsBus and updated value goes to all dialogs and all charts.
    updatePassage(idx, newVal) {
      this.chosenPopulations = _.map(this.chosenPopulations, function(val, i) { if (i === idx) { return newVal; } else { return val; } });
      return this.chosenPopulationsBus.push(this.chosenPopulations);
    }
  }
  );
});
