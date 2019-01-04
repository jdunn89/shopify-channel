#!/usr/bin/env bash

function run_tests {
  echo "**********************************************"
  echo "Begin Running Tests "
  echo "**********************************************"

  nyc ./node_modules/mocha/bin/mocha --timeout 10000 ./node_modules/@nchannel/endpoint-sdk/validation/*.spec.js
  nyc report --reporter=text-lcov | coveralls

  echo "**********************************************"
  echo "End Running Tests "
  echo "**********************************************"
}

run_tests
