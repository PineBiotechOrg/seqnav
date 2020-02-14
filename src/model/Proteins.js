/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
define(["dojo/_base/declare", "dojo/_base/lang",
        "underscore/underscore",
        "./../utils/Iterator"],
function(declare, lang,
 _,
Iterator) {

  let Proteins;
  const skip = function(it, count) {
    for (let idx = 0, end = count - 1, asc = 0 <= end; asc ? idx <= end : idx >= end; asc ? idx++ : idx--) { it(); }
    return it();
  };

  const strToObj = function(parser, str) {
    if (lang.isString(str)) {
      const it = parser(str);
      return {
        gene: it(),
        short: it(),
        type: it(),
        start: parseInt(it()),
        end: parseInt(it()),
        level: parseInt(skip(it, 2)),
        fileName: it(),
        description: it()
      };
    } else {
      return str;
    }
  };

  return Proteins = declare(null, {
    constructor(iterator, rowParser) {
      this.data = iterator.map(strToObj.bind(null, rowParser)).toArray();
      this.levelToProteins = _.groupBy(this.data, "level");
      this.levelsCount = _.size(this.levelToProteins);
      return this.range = {min: _.min(this.data, "start").start, max: _.max(this.data, "end").end};
    },

    getAllProteins() { return this.data; },
    getLevelsCount() { return this.levelsCount; },
    getLevelToProteins(level) { return this.levelToProteins[level]; },
    getRange() { return this.range; },

    cut(protein) {
      const iterator = Iterator.fromArray(this.data)
        .filter(x => (protein.start <= x.start) && (x.end <= protein.end))
        .map(x => lang.mixin(null, x, {level: x.level - protein.level}));
      return new Proteins(iterator);
    }
  });
});
