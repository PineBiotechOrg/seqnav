profile = (() ->
  copyOnly = (filename, mid) ->
    list = {}
    (mid of list) or (/\/resources\//.test(mid) and !/\.css$/.test(filename)) or /(png|jpg|jpeg|gif)$/.test(filename)

  basePath: "./../"
  releaseDir: "../dist"
  action: "release"
  cssOptimize: "comments"
  mini: false
  optimize: "shrinksafe"
  layerOptimize: "shrinksafe"
  stripConsole: "all"
  selectorEngine: "lite"

  packages: [
    {name: "dojo", location: "dtk/dojo", destLocation: "dtk/dojo"}
    {name: "dijit", location: "dtk/dijit", destLocation: "dtk/dijit"}
    {name: "dojox", location: "dtk/dojox", destLocation: "dtk/dojox"}
    {name: "bacon", location: "libs/bacon.js", destLocation: "libs/bacon.js"}
    {name: "xstyle", location: "libs/xstyle", destLocation: "libs/xstyle"}
    {name: "underscore", location: "libs/underscore", destLocation: "libs/underscore"}
    {name: "d3", location: "libs/d3", destLocation: "libs/d3"}
    {name: "dojo-theme-flat", location: "libs/dojo-theme-flat", destLocation: "libs/dojo-theme-flat"}
    {name: "pv", location: "libs/pv/src", destLocation: "libs/pv/src"}
    {name: "layercake", location: "layercake"}
  ]

  plugins:
    "xstyle/css": "xstyle/build/amd-css"

  resourceTags:
    copyOnly: copyOnly
    amd: (filename, mid) -> not copyOnly(filename, mid) and /\.js$/.test(filename)
    declarative: (filename) -> /\.html?$/.test(filename)

  layers:
    "layercake/base":
      include: ["layercake/LayerCakeApp", "dojo/selector/acme"]
      includeLocales: ["en-us"]
      customBase: true
    "layercake/resources/base":
      name: "layercake/LayerCakeApp.js"
      targetStylesheet: "layercake/resources/layer-cake-app.css"
)()
