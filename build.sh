#!/bin/bash

ROOT=$(pwd)

clean() {
  rm -rf $ROOT/javascript
  rm -rf $ROOT/dist
}

prepare() {
  mkdir $ROOT/javascript
  mkdir $ROOT/javascript/dtk
  mkdir $ROOT/javascript/libs
  mkdir $ROOT/dist

  cd $ROOT/javascript/dtk
  git clone --branch 1.10 https://github.com/dojo/dojo.git
  cd dojo
  git apply ../../../patches/dojo.js.patch

  cd $ROOT/javascript/dtk
  git clone --branch 1.10 https://github.com/dojo/dijit.git
  git clone --branch 1.10 https://github.com/dojo/dojox.git
  git clone --branch 1.10 https://github.com/dojo/util.git

  cd $ROOT/javascript/libs
  git clone https://github.com/baconjs/bacon.js
  cd bacon.js
  git checkout --detach 0.7.24

  cd $ROOT/javascript/libs
  git clone https://github.com/jashkenas/underscore
  cd underscore
  git checkout --detach 1.7.0
  git apply ../../../patches/underscore.js.patch

  cd $ROOT/javascript/libs
  git clone https://github.com/biasmv/pv.git
  cd pv
  git apply ../../../patches/pv.js.patch

  cd $ROOT/javascript/libs
  git clone https://github.com/kriszyp/xstyle
  git clone https://github.com/mbostock/d3.git
  git clone https://github.com/esri/dojo-theme-flat.git
}

make() {
  coffee --bare --compile --output javascript/layercake src
  cp -r src/templates javascript/layercake
  cp -r src/resources javascript/layercake

  cd javascript/dtk/util/buildscripts
  node ../../dojo/dojo.js load=build --profile ../../../layercake/layercake --release
}

for var in $@
do
  if [[ "$var" == 'clean' ]]; then
    cd $ROOT
    clean
  elif [[ "$var" == 'prepare' ]]; then
    cd $ROOT
    prepare
  elif [[ "$var" == 'make' ]]; then
    cd $ROOT
    make
  fi
done
