define(["dojo/_base/declare", "dojo/_base/lang", "dojo/json", "dojo/Deferred", "dojo/promise/all",
        "dojo/request", "pv/io",
        "bacon/dist/Bacon",
        "underscore/underscore", "./../utils/Iterator",
        "./Table", "./Proteins", "./Fitness"],
(declare, lang, JSON, Deferred, all,
 request, io,
 Bacon,
 _, Iterator,
 Table, Proteins, Fitness) ->


  # Returns fuction each next call returns next cell of table. In general it does what
  # str.split(separator) does. But this function has two advantages:
  # (1) it takes into account that cells in CSV file can be escaped by quotes:
  #        1,"asdf,asdf",123
  #     This function parses three cells: 1 asdf,asfd 123
  # (2) it is faster because parses only necessary cells rather then all. Also doesn't
  #     create additional arrays.
  rowParser = (separator, str) ->
    i = 0
    ->
      j = i
      length = str.length
      insideQuotes = false
      wasInQuotes = false
      ch = undefined
      while j < length and (((ch = str.charAt(j)) isnt separator) or insideQuotes)
        if (ch is '"')
          insideQuotes = !insideQuotes
          wasInQuotes = true
        j++

      if (j is length)
        if (i < j)
          result = if (wasInQuotes) then str.substring i + 1, str.length - 1 else str.substring i
          i = length
          result
        else
          i = j
          undefined
      else
        result = str.substring i, j
        i = j + 1
        result

  # Next two functions are temporary. Just in order to run layercake in my environment. Must be removed at the end.
  makeUrl = (url) -> "/api/#{url}"

  mkDefaultArguments = () ->
    handleAs: "json"
    headers: {"Content-Type": "application/json; charset=utf-8"}
    preventCache: true


  # Hardcoded for now. Must be removed when Vivek will add service which returns passage names.
  passages = ["SRR1036477", "SRR1036617", "SRR1036661", "SRR1036663", "SRR1036988", "SRR1036989", "SRR1036990"]

  declare(null,

    # Is array with true/false for each passage. If value for some passage is true then corresponded checkbox
    # is checked and line in chart is not hidden.
    @chosenPopulations: undefined

    # EventStream (see https://baconjs.github.io/api.html) with array chosenPopulations.
    @chosenPopulationsBus: undefined

    # TK: Pipelines Virology is hardcoded here, why?
    # DB: Because I need to parse page id from URL /pipelinesvirology/XXXXXX/asdf. Number XXXXXX is used in another
    #     calls.
    constructor: ->
      @key = parseInt(location.pathname.substring("/pipelinesvirology/".length))
      @chosenPopulationsBus = new Bacon.Bus()
      @chosenPopulations = []

    loadNucleotides: ->
      request.get("/visualisation/csv_input/" + this.key).then((str) ->
      #request.get(makeUrl("populations"), mkDefaultArguments()).then((str) ->
        nucleotidesIterator = Iterator.splitString(str, "\r\n")
        nucleotidesIterator.next()
        new Table(nucleotidesIterator, rowParser.bind(null, ","))
      )

    loadPassages: ->
      all(_.map(passages, (p) -> request.get(makeUrl("passage?fileName=#{p}"), mkDefaultArguments()))).then((arr) =>
        iterators = _.map(arr, (fileContent, i) ->
           {passageName: passages[i], it: Iterator.splitString(fileContent, "\n")}
        )
        @chosenPopulations = Iterator.range(1, arr.length).map(() -> true).toArray()
        @chosenPopulationsBus.push @chosenPopulations
        new Table(iterators, rowParser.bind(null, "\t"))
      )

    loadProteins: ->
      request.get("/visualisation/csv_reference/" + this.key).then((str) ->
      #request.get(makeUrl("proteins"), mkDefaultArguments()).then((str) ->
        proteinsIterator = Iterator.splitString(str, "\n")
        proteinsIterator.next()
        new Proteins(proteinsIterator, rowParser.bind(null, ","))
      )

    # TK: So is this just loading /api/fitness? Do you already have an example file for input?
    # DB: Yes, just loads fitness.txt files. I have this file only on my server. Vivek's server doesn't have this yet.
    loadFitness: ->
      request.get(makeUrl("fitness"), mkDefaultArguments()).then((str) ->
        nucleotidesIterator = Iterator.splitString(str, "\n")
        new Fitness(nucleotidesIterator, rowParser.bind(null, "\t"))
      )

    loadPdb: (name) ->
      dfd = new Deferred()
      if (name)
        io.fetchPdb "/visualisation-files/pdb_#{@key}/#{name}.pdb", dfd.resolve.bind(dfd)
        #io.fetchPdb "../javascript/pdbs/#{name}.pdb", dfd.resolve.bind(dfd)
      else
        dfd.reject("Protein not found")
      dfd.promise

    # Just getter for @chosenPopulations
    getChosenPassages: -> @chosenPopulations

    # Just getter for @chosenPopulationsBus
    getChosenPassagesBus: -> @chosenPopulationsBus

    # When user checks/unchecks checkbox in layercake and corresponded line in CoverageGraph must be showed/hidden,
    # this method must be called. It updates chosenPopulationsBus and updated value goes to all dialogs and all charts.
    updatePassage: (idx, newVal) ->
      @chosenPopulations = _.map @chosenPopulations, (val, i) -> if i is idx then newVal else val
      @chosenPopulationsBus.push @chosenPopulations
  )
)
