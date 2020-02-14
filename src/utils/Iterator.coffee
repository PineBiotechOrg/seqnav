define ["dojo/_base/declare"],
(declare) ->

  Iterator = declare null,

    hasNext: () -> throw new Error "abstract"

    next: () -> throw new Error "abstract"

    concat: () ->
      result = new Iterator()
      allIterators = [@].concat(Array.prototype.slice.call(arguments))
      current = 0
      result.hasNext = () ->
        iterator = allIterators[current]
        if (iterator.hasNext())
          true
        else if (allIterators.length <= ++current)
          false
        else
          @hasNext

      result.next = () ->
        it = allIterators[current]
        if (it.hasNext())
          it.next()
        else
          current++
          @next()

      result


    map: (func) ->
      result = new Iterator()
      result.hasNext = @hasNext.bind(@)
      result.next = () => func(@next())
      result


    each: (func) ->
      while (@hasNext())
        func @next()


    filter: (func) ->
      result = new Iterator()
      extracted = false
      last = undefined

      result.hasNext = () =>
        if (extracted)
          true
        else
          while (@hasNext())
            n = @next()
            if (func(n))
              extracted = true
              last = n
              return true
          false

      result.next = () ->
        if (@hasNext())
          extracted = false
          last
        else
          throw new Error "filter: empty iterator"

      result


    take: (n) ->
      result = new Iterator()
      i = 0

      result.hasNext = () => @hasNext() and i < n
      result.next = () =>
        i++
        @next()

      result


    takeWhile: (func) ->
      result = new Iterator()
      last = undefined
      extracted = false
      terminated = false

      result.hasNext = () =>
        if (extracted)
          true
        else if (terminated or !@hasNext())
          false
        else
          last = @next()
          if (func(last))
            extracted = true
            true
          else
            terminated = true
            false

      result.next = () ->
        if (extracted or @hasNext())
          extracted = false
          last
        else
          throw new Error "takeWhile: empty iterator"

      result


    drop: (n) ->
      i = 0
      while (i++ < n)
        @next()
      @


    dropWhile: (func) ->
      i = 0
      while (@hasNext())
        last = @next()
        if (!func(last))
          return Iterator.single(last).concat(@)

      Iterator.emptyIterator


    sliding: (size, step) ->
      if (size isnt step)
        throw new Error "Not implemted!"

      result = new Iterator()
      result.hasNext = @hasNext.bind(@)
      result.next = () =>
        arr = []
        i = 0
        while (i++ < size and @hasNext())
          arr.push @next()
        arr
      result


    toArray: () ->
      result = []
      while (@hasNext())
        result.push @next()
      result


  Iterator.single = (obj) ->
    result = new Iterator()
    hasNext = true
    result.hasNext = () -> hasNext
    result.next = () ->
      if (!hasNext) then throw new Error "empty: singleiterator"
      hasNext = false
      obj
    result


  Iterator.fromArray = (arr) ->
    result = new Iterator()
    i = 0
    result.hasNext = () -> i < arr.length
    result.next = () -> arr[i++]
    result


  Iterator.fill = (obj, n) ->
    result = new Iterator()
    i = 0
    result.hasNext = () -> i < n
    result.next = () ->
      i++
      obj
    result


  Iterator.range = (min, max) ->
    result = new Iterator()
    i = min
    result.hasNext = () -> i <= max
    result.next = () -> i++
    result


  ei = Iterator.emptyIterator = new Iterator()
  ei.hasNext = () -> false
  ei.next = () -> throw new Error "empty iterator"


  Iterator.splitString = (str, separator) ->
    if (str.length is 0)
      return Iterator.emptyIterator
    else
      currentIndex = if (str.lastIndexOf(separator, 0) is 0) then separator.length else 0
      result = new Iterator()
      result.hasNext = () -> currentIndex < str.length
      result.next = () ->
        nextIndex = str.indexOf(separator, currentIndex)
        result = undefined
        if (nextIndex is -1)
          result = str.substr(currentIndex)
          currentIndex = str.length
        else
          result = str.substr(currentIndex, nextIndex - currentIndex)
          currentIndex = nextIndex + separator.length
        result
      result

  Iterator.repeat = (arr, n) ->
    i = 0
    j = 0
    n = n || Number.MAX_VALUE
    result = new Iterator()
    result.hasNext = () -> (i < n) or (i is n and j < arr.length)
    result.next = () ->
      result = arr[j]
      j++
      if (j is arr.length)
        i++
        j = 0
      result
    result

  Iterator
