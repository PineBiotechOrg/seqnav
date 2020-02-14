define ["bacon/dist/Bacon"],
(Bacon) ->

  fromWidget: (target, eventName) ->
    Bacon.fromBinder (handler) ->
      canceller = target.on eventName, handler
      canceller.remove.bind canceller


  fromCheckBox: (target, skipDuplicates) ->
    getter = target.get.bind target, "checked"
    result = @fromWidget(target, "change")
      .map(getter)
      .toProperty(getter())
    if (skipDuplicates) then result.skipDuplicates() else result


  fromSelect: (target, skipDuplicates) ->
    getter = target.get.bind target, "value"
    result = @fromWidget(target, "change")
      .map(getter)
      .toProperty(getter())
    if (skipDuplicates) then result.skipDuplicates() else result
