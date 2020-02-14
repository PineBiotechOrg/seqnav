define [],
() ->

  skip: (numArgs, func) ->
    lastArgs = []
    lastResult = undefined
    () ->
      i = 0
      while (i < numArgs)
        if (lastArgs[i] isnt arguments[i])
          lastResult = func.apply(@, arguments)
          lastArgs = arguments
          return lastResult
        i++
      lastResult

