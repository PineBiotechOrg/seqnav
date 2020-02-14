define ["dojo/_base/lang", "dojo/Deferred",
        "dojox/lang/functional"],
(lang, Deferred,
 df) ->

  resolve: (obj) ->
    dfd = new Deferred()
    dfd.resolve obj
    dfd.promise

  reject: (obj) ->
    dfd = new Deferred()
    dfd.reject obj
    dfd.promise
