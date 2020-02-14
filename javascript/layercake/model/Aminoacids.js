/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
define(["./../utils/Iterator"],

// Contains definitions for all amino acids
function(Iterator) {
  return {
    ATT: "I",
    ATC: "I",
    ATA: "I",
    ATG: "M",
    ACT: "T",
    ACC: "T",
    ACA: "T",
    ACG: "T",
    AAT: "N",
    AAC: "N",
    AAA: "K",
    AAG: "K",
    AGT: "S",
    AGC: "S",
    AGA: "R",
    AGG: "R",
    GTT: "V",
    GTC: "V",
    GTA: "V",
    GTG: "V",
    GCT: "A",
    GCC: "A",
    GCA: "A",
    GCG: "A",
    GAT: "D",
    GAC: "D",
    GAA: "E",
    GAG: "E",
    GGT: "G",
    GGC: "G",
    GGA: "G",
    GGG: "G",
    TTT: "F",
    TTC: "F",
    TTA: "L",
    TTG: "L",
    TCT: "S",
    TCC: "S",
    TCA: "S",
    TCG: "S",
    TAT: "Y",
    TAC: "Y",
    TAA: "STOP",
    TAG: "STOP",
    TGT: "C",
    TGC: "C",
    TGA: "STOP",
    TGG: "W",
    CTT: "L",
    CTC: "L",
    CTA: "L",
    CTG: "L",
    CCT: "P",
    CCC: "P",
    CCA: "P",
    CCG: "P",
    CAT: "H",
    CAC: "H",
    CAA: "Q",
    CAG: "Q",
    CGT: "R",
    CGC: "R",
    CGA: "R",
    CGG: "R",

    // Converting a string to an amino acid, which is blank if the length is less than three, and throws an error if it's more.
    strToAminoacid(str) {
      switch (false) {
        case !(str.length < 3): return "";
        case str.length !== 3: return this[str];
        case !(str.length > 3): throw new Error(`Long key: ${str}`);
      }
    },

    // Converting an array (lenght is 3) of nucleotides to a string to an amino acid.
    arrToAminoacid(nucleotides) { return this.strToAminoacid(nucleotides.join("")); },

    // Converts arrays (any length) of nucleotides to a string with amino acids.
    arrToAminoacids(nucleotides) {
      return Iterator.fromArray(nucleotides)
        .sliding(3, 3)
        .map(this.arrToAminoacid.bind(this))
        .toArray()
        .join("");
    },

    // Checks synonymous mutations for amino acid
    checkSynonymousMutations(referenceNucleotides, mutations) {
      const referenceAminoacid = this[referenceNucleotides];
      return _.some(mutations, mutatedNucleotides => {
        return (mutatedNucleotides !== referenceNucleotides) && (this[mutatedNucleotides] === referenceAminoacid);
      });
    },

    // Checks non synonymous mutations for amino acid
    checkNonSynonymousMutations(referenceNucleotides, mutations) {
      const referenceAminoacid = this[referenceNucleotides];
      return _.some(mutations, mutatedNucleotides => {
        return (mutatedNucleotides !== referenceNucleotides) && (this[mutatedNucleotides] !== referenceAminoacid);
      });
    }
  };
});
