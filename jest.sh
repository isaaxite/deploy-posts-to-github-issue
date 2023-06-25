#! /bin/bash

node --experimental-vm-modules node_modules/jest/bin/jest.js \
  --config=jest.dev.config.mjs \
  $1 $2 $3
