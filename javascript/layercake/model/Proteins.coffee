define(["dojo/_base/declare", "dojo/_base/lang",
        "underscore/underscore",
        "./../utils/Iterator"]
(declare, lang,
 _,
Iterator) ->

  skip = (it, count) ->
    it() for idx in [0..count - 1]
    it()

  strToObj = (parser, str) ->
    if (lang.isString(str))
      it = parser(str)
      gene: it()
      short: it()
      type: it()
      start: parseInt(it())
      end: parseInt(it())
      level: parseInt(skip(it, 2))
      fileName: it()
      description: it()
    else
      str

  Proteins = declare null, {
    constructor: (iterator, rowParser) ->
      @data = iterator.map(strToObj.bind(null, rowParser)).toArray()
      @levelToProteins = _.groupBy @data, "level"
      @levelsCount = _.size(@levelToProteins)
      @range = {min: _.min(@data, "start").start, max: _.max(@data, "end").end}

    getAllProteins: -> @data
    getLevelsCount: -> @levelsCount
    getLevelToProteins: (level) -> @levelToProteins[level]
    getRange: -> @range

    cut: (protein) ->
      iterator = Iterator.fromArray(@data)
        .filter((x) -> protein.start <= x.start and x.end <= protein.end)
        .map((x) -> lang.mixin null, x, {level: x.level - protein.level})
      new Proteins iterator
  }
)
