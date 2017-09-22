#!/usr/bin/env bash
set -e

ln -f readme.md packages/electron-webpack/readme.md

npm publish packages/electron-webpack || true
npm publish packages/electron-webpack-eslint || true
npm publish packages/electron-webpack-js || true
npm publish packages/electron-webpack-ts || true
npm publish packages/electron-webpack-vue || true