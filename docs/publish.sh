#!/usr/bin/env bash
set -e

# netlify-cli can be used to publish directory directly without intermediate git repository,
# but it will complicate deployment because in this case you need to be authenticated on Netlify.
# But for what, if you are already configure Git access?
# Also, this approach allows us to manage access using GitHub and easily give access to publish to project members.

cd _book
git init
git add .
git commit -m 'First commit'

git remote add origin git@github.com:develar/generated-gitbook-electron-webpack.git
git push -f origin master:en