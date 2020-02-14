# Building #

Project is built on dojo toolkit. It depends on following javascript libraries: dojo (dojo, dijit, dojox, dojo-theme-flat), d3, pv, bacon.js, underscore, xstyle.

File build.sh creates production files for this project. This script takes three parameters:

* *clean* cleans all generated files
* *prepare* downloads all dependencies and prepares general structure for building.
* *make* converts coffescript sources to javascript, then compresses and minimizes all javascript files into one base.js. All files are created in directory dist/layercake.

In order to make first build you need to run such command:
```
#!bash
./build.sh prepare make
```
When coffeescript sources are update, in order to rebuild
```
#!bash
./build.sh make
```

Script build.sh assumes binary files coffee (coffeescript compiler), git and node (node.js) are in global path.