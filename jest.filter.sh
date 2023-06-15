#! /bin/bash

find __test__ -type f -regex '.*\/[^/]*test\.js$' -not -name $1 -print0 | xargs -0 \
  node --experimental-vm-modules node_modules/jest/bin/jest.js
