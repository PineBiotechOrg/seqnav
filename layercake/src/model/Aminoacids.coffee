define ["./../utils/Iterator"],

# Contains definitions for all amino acids
(Iterator) ->
  ATT: "I"
  ATC: "I"
  ATA: "I"
  ATG: "M"
  ACT: "T"
  ACC: "T"
  ACA: "T"
  ACG: "T"
  AAT: "N"
  AAC: "N"
  AAA: "K"
  AAG: "K"
  AGT: "S"
  AGC: "S"
  AGA: "R"
  AGG: "R"
  GTT: "V"
  GTC: "V"
  GTA: "V"
  GTG: "V"
  GCT: "A"
  GCC: "A"
  GCA: "A"
  GCG: "A"
  GAT: "D"
  GAC: "D"
  GAA: "E"
  GAG: "E"
  GGT: "G"
  GGC: "G"
  GGA: "G"
  GGG: "G"
  TTT: "F"
  TTC: "F"
  TTA: "L"
  TTG: "L"
  TCT: "S"
  TCC: "S"
  TCA: "S"
  TCG: "S"
  TAT: "Y"
  TAC: "Y"
  TAA: "STOP"
  TAG: "STOP"
  TGT: "C"
  TGC: "C"
  TGA: "STOP"
  TGG: "W"
  CTT: "L"
  CTC: "L"
  CTA: "L"
  CTG: "L"
  CCT: "P"
  CCC: "P"
  CCA: "P"
  CCG: "P"
  CAT: "H"
  CAC: "H"
  CAA: "Q"
  CAG: "Q"
  CGT: "R"
  CGC: "R"
  CGA: "R"
  CGG: "R"

  # Converting a string to an amino acid, which is blank if the length is less than three, and throws an error if it's more.
  strToAminoacid: (str) ->
    switch
      when str.length < 3 then ""
      when str.length is 3 then @[str]
      when str.length > 3 then throw new Error "Long key: #{str}"

  # Converting an array (lenght is 3) of nucleotides to a string to an amino acid.
  arrToAminoacid: (nucleotides) -> @strToAminoacid nucleotides.join("")

  # Converts arrays (any length) of nucleotides to a string with amino acids.
  arrToAminoacids: (nucleotides) ->
    Iterator.fromArray(nucleotides)
      .sliding(3, 3)
      .map(@arrToAminoacid.bind(@))
      .toArray()
      .join("")

  # Checks synonymous mutations for amino acid
  checkSynonymousMutations: (referenceNucleotides, mutations) ->
    referenceAminoacid = @[referenceNucleotides]
    _.some mutations, (mutatedNucleotides) =>
      mutatedNucleotides isnt referenceNucleotides and @[mutatedNucleotides] is referenceAminoacid

  # Checks non synonymous mutations for amino acid
  checkNonSynonymousMutations: (referenceNucleotides, mutations) ->
    referenceAminoacid = @[referenceNucleotides]
    _.some mutations, (mutatedNucleotides) =>
      mutatedNucleotides isnt referenceNucleotides and @[mutatedNucleotides] isnt referenceAminoacid
