# /README.md
# [React](https://react.dev/) &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/facebook/react/blob/main/LICENSE) [![npm version](https://img.shields.io/npm/v/react.svg?style=flat)](https://www.npmjs.com/package/react) [![(Runtime) Build and Test](https://github.com/facebook/react/actions/workflows/runtime_build_and_test.yml/badge.svg)](https://github.com/facebook/react/actions/workflows/runtime_build_and_test.yml) [![(Compiler) TypeScript](https://github.com/facebook/react/actions/workflows/compiler_typescript.yml/badge.svg?branch=main)](https://github.com/facebook/react/actions/workflows/compiler_typescript.yml) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://legacy.reactjs.org/docs/how-to-contribute.html#your-first-pull-request)

React is a JavaScript library for building user interfaces.

* **Declarative:** React makes it painless to create interactive UIs. Design simple views for each state in your application, and React will efficiently update and render just the right components when your data changes. Declarative views make your code more predictable, simpler to understand, and easier to debug.
* **Component-Based:** Build encapsulated components that manage their own state, then compose them to make complex UIs. Since component logic is written in JavaScript instead of templates, you can easily pass rich data through your app and keep the state out of the DOM.
* **Learn Once, Write Anywhere:** We don't make assumptions about the rest of your technology stack, so you can develop new features in React without rewriting existing code. React can also render on the server using [Node](https://nodejs.org/en) and power mobile apps using [React Native](https://reactnative.dev/).

[Learn how to use React in your project](https://react.dev/learn).

## Installation

React has been designed for gradual adoption from the start, and **you can use as little or as much React as you need**:

* Use [Quick Start](https://react.dev/learn) to get a taste of React.
* [Add React to an Existing Project](https://react.dev/learn/add-react-to-an-existing-project) to use as little or as much React as you need.
* [Create a New React App](https://react.dev/learn/start-a-new-react-project) if you're looking for a powerful JavaScript toolchain.

## Documentation

You can find the React documentation [on the website](https://react.dev/).

Check out the [Getting Started](https://react.dev/learn) page for a quick overview.

The documentation is divided into several sections:

* [Quick Start](https://react.dev/learn)
* [Tutorial](https://react.dev/learn/tutorial-tic-tac-toe)
* [Thinking in React](https://react.dev/learn/thinking-in-react)
* [Installation](https://react.dev/learn/installation)
* [Describing the UI](https://react.dev/learn/describing-the-ui)
* [Adding Interactivity](https://react.dev/learn/adding-interactivity)
* [Managing State](https://react.dev/learn/managing-state)
* [Advanced Guides](https://react.dev/learn/escape-hatches)
* [API Reference](https://react.dev/reference/react)
* [Where to Get Support](https://react.dev/community)
* [Contributing Guide](https://legacy.reactjs.org/docs/how-to-contribute.html)

You can improve it by sending pull requests to [this repository](https://github.com/reactjs/react.dev).

## Examples

We have several examples [on the website](https://react.dev/). Here is the first one to get you started:

```jsx
import { createRoot } from 'react-dom/client';

function HelloMessage({ name }) {
  return <div>Hello {name}</div>;
}

const root = createRoot(document.getElementById('container'));
root.render(<HelloMessage name="Taylor" />);
```

This example will render "Hello Taylor" into a container on the page.

You'll notice that we used an HTML-like syntax; [we call it JSX](https://react.dev/learn#writing-markup-with-jsx). JSX is not required to use React, but it makes code more readable, and writing it feels like writing HTML.

## Contributing

The main purpose of this repository is to continue evolving React core, making it faster and easier to use. Development of React happens in the open on GitHub, and we are grateful to the community for contributing bugfixes and improvements. Read below to learn how you can take part in improving React.

### [Code of Conduct](https://code.fb.com/codeofconduct)

Facebook has adopted a Code of Conduct that we expect project participants to adhere to. Please read [the full text](https://code.fb.com/codeofconduct) so that you can understand what actions will and will not be tolerated.

### [Contributing Guide](https://legacy.reactjs.org/docs/how-to-contribute.html)

Read our [contributing guide](https://legacy.reactjs.org/docs/how-to-contribute.html) to learn about our development process, how to propose bugfixes and improvements, and how to build and test your changes to React.

### [Good First Issues](https://github.com/facebook/react/labels/good%20first%20issue)

To help you get your feet wet and get you familiar with our contribution process, we have a list of [good first issues](https://github.com/facebook/react/labels/good%20first%20issue) that contain bugs that have a relatively limited scope. This is a great place to get started.

### License

React is [MIT licensed](./LICENSE).


# /package.json
{
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "devDependencies": {
    "@babel/cli": "^7.10.5",
    "@babel/code-frame": "^7.10.4",
    "@babel/core": "^7.11.1",
    "@babel/helper-define-map": "^7.18.6",
    "@babel/helper-module-imports": "^7.10.4",
    "@babel/parser": "^7.11.3",
    "@babel/plugin-external-helpers": "^7.10.4",
    "@babel/plugin-proposal-class-properties": "^7.10.4",
    "@babel/plugin-proposal-object-rest-spread": "^7.11.0",
    "@babel/plugin-syntax-dynamic-import": "^7.8.3",
    "@babel/plugin-syntax-import-meta": "^7.10.4",
    "@babel/plugin-syntax-jsx": "^7.23.3",
    "@babel/plugin-syntax-typescript": "^7.14.5",
    "@babel/plugin-transform-arrow-functions": "^7.10.4",
    "@babel/plugin-transform-block-scoped-functions": "^7.10.4",
    "@babel/plugin-transform-block-scoping": "^7.11.1",
    "@babel/plugin-transform-class-properties": "^7.25.9",
    "@babel/plugin-transform-classes": "^7.10.4",
    "@babel/plugin-transform-computed-properties": "^7.10.4",
    "@babel/plugin-transform-destructuring": "^7.10.4",
    "@babel/plugin-transform-for-of": "^7.10.4",
    "@babel/plugin-transform-literals": "^7.10.4",
    "@babel/plugin-transform-modules-commonjs": "^7.10.4",
    "@babel/plugin-transform-object-super": "^7.10.4",
    "@babel/plugin-transform-parameters": "^7.10.5",
    "@babel/plugin-transform-react-jsx": "^7.23.4",
    "@babel/plugin-transform-react-jsx-development": "^7.22.5",
    "@babel/plugin-transform-react-jsx-source": "^7.10.5",
    "@babel/plugin-transform-shorthand-properties": "^7.10.4",
    "@babel/plugin-transform-spread": "^7.11.0",
    "@babel/plugin-transform-template-literals": "^7.10.5",
    "@babel/preset-env": "^7.26.9",
    "@babel/preset-flow": "^7.10.4",
    "@babel/preset-react": "^7.23.3",
    "@babel/preset-typescript": "^7.26.0",
    "@babel/traverse": "^7.11.0",
    "@rollup/plugin-babel": "^6.0.3",
    "@rollup/plugin-commonjs": "^24.0.1",
    "@rollup/plugin-node-resolve": "^15.0.1",
    "@rollup/plugin-replace": "^5.0.2",
    "@rollup/plugin-typescript": "^12.1.2",
    "@types/invariant": "^2.2.35",
    "@typescript-eslint/eslint-plugin": "^6.21.0",
    "@typescript-eslint/parser": "^6.21.0",
    "abortcontroller-polyfill": "^1.7.5",
    "art": "0.10.1",
    "babel-plugin-syntax-trailing-function-commas": "^6.5.0",
    "chalk": "^3.0.0",
    "cli-table": "^0.3.1",
    "coffee-script": "^1.12.7",
    "confusing-browser-globals": "^1.0.9",
    "core-js": "^3.6.4",
    "create-react-class": "^15.6.3",
    "danger": "^11.2.3",
    "error-stack-parser": "^2.0.6",
    "eslint": "^7.7.0",
    "eslint-config-prettier": "^6.9.0",
    "eslint-plugin-babel": "^5.3.0",
    "eslint-plugin-es": "^4.1.0",
    "eslint-plugin-eslint-plugin": "^3.5.3",
    "eslint-plugin-ft-flow": "^2.0.3",
    "eslint-plugin-jest": "28.4.0",
    "eslint-plugin-no-for-of-loops": "^1.0.0",
    "eslint-plugin-no-function-declare-after-return": "^1.0.0",
    "eslint-plugin-react": "^6.7.1",
    "eslint-plugin-react-internal": "link:./scripts/eslint-rules",
    "fbjs-scripts": "^3.0.1",
    "filesize": "^6.0.1",
    "flow-bin": "^0.245.2",
    "flow-remove-types": "^2.245.2",
    "glob": "^7.1.6",
    "glob-stream": "^6.1.0",
    "google-closure-compiler": "^20230206.0.0",
    "gzip-size": "^5.1.1",
    "hermes-eslint": "^0.25.1",
    "hermes-parser": "^0.25.1",
    "jest": "^29.4.2",
    "jest-cli": "^29.4.2",
    "jest-diff": "^29.4.2",
    "jest-environment-jsdom": "^29.4.2",
    "jest-snapshot-serializer-raw": "^1.2.0",
    "minimatch": "^3.0.4",
    "minimist": "^1.2.3",
    "mkdirp": "^0.5.1",
    "ncp": "^2.0.0",
    "prettier": "^3.3.3",
    "prettier-2": "npm:prettier@^2",
    "prettier-plugin-hermes-parser": "^0.23.0",
    "pretty-format": "^29.4.1",
    "prop-types": "^15.6.2",
    "random-seed": "^0.3.0",
    "react-lifecycles-compat": "^3.0.4",
    "rimraf": "^3.0.0",
    "rollup": "^3.29.5",
    "rollup-plugin-dts": "^6.1.1",
    "rollup-plugin-prettier": "^4.1.1",
    "rollup-plugin-strip-banner": "^3.0.0",
    "semver": "^7.1.1",
    "shelljs": "^0.8.5",
    "signedsource": "^2.0.0",
    "targz": "^1.0.1",
    "through2": "^3.0.1",
    "tmp": "^0.1.0",
    "to-fast-properties": "^2.0.0",
    "tsup": "^8.4.0",
    "typescript": "^5.4.3",
    "undici": "^5.28.4",
    "web-streams-polyfill": "^3.1.1",
    "yargs": "^15.3.1"
  },
  "jest": {
    "testRegex": "/scripts/jest/dont-run-jest-directly\\.js$"
  },
  "scripts": {
    "prebuild": "./scripts/react-compiler/link-compiler.sh",
    "build": "node ./scripts/rollup/build-all-release-channels.js",
    "build-for-devtools": "cross-env RELEASE_CHANNEL=experimental yarn build react/index,react/jsx,react/compiler-runtime,react-dom/index,react-dom/client,react-dom/unstable_testing,react-dom/test-utils,react-is,react-debug-tools,scheduler,react-test-renderer,react-refresh,react-art --type=NODE",
    "build-for-devtools-dev": "yarn build-for-devtools --type=NODE_DEV",
    "build-for-devtools-prod": "yarn build-for-devtools --type=NODE_PROD",
    "build-for-flight-dev": "cross-env RELEASE_CHANNEL=experimental node ./scripts/rollup/build.js react/index,react/jsx,react.react-server,react-dom/index,react-dom/client,react-dom/server,react-dom.react-server,react-dom-server.node,react-dom-server-legacy.node,scheduler,react-server-dom-webpack/ --type=NODE_DEV,ESM_PROD,NODE_ES2015 && mv ./build/node_modules ./build/oss-experimental",
    "build-for-vt-dev": "cross-env RELEASE_CHANNEL=experimental node ./scripts/rollup/build.js react/index,react/jsx,react-dom/index,react-dom/client,react-dom/server,react-dom-server.node,react-dom-server-legacy.node,scheduler --type=NODE_DEV && mv ./build/node_modules ./build/oss-experimental",
    "linc": "node ./scripts/tasks/linc.js",
    "lint": "node ./scripts/tasks/eslint.js",
    "lint-build": "node ./scripts/rollup/validate/index.js",
    "extract-errors": "node scripts/error-codes/extract-errors.js",
    "postinstall": "node ./scripts/flow/createFlowConfigs.js",
    "pretest": "./scripts/react-compiler/build-compiler.sh && ./scripts/react-compiler/link-compiler.sh",
    "test": "node ./scripts/jest/jest-cli.js",
    "test-stable": "node ./scripts/jest/jest-cli.js --release-channel=stable",
    "test-www": "node ./scripts/jest/jest-cli.js --release-channel=www-modern",
    "test-classic": "node ./scripts/jest/jest-cli.js --release-channel=www-classic",
    "test-build-devtools": "node ./scripts/jest/jest-cli.js --build --project devtools --release-channel=experimental",
    "test-dom-fixture": "cd fixtures/dom && yarn && yarn test",
    "flow": "node ./scripts/tasks/flow.js",
    "flow-ci": "node ./scripts/tasks/flow-ci.js",
    "prettier": "node ./scripts/prettier/index.js write-changed",
    "prettier-all": "node ./scripts/prettier/index.js write",
    "prettier-check": "node ./scripts/prettier/index.js",
    "version-check": "node ./scripts/tasks/version-check.js",
    "publish-prereleases": "echo 'This command has been deprecated. Please refer to https://github.com/facebook/react/tree/main/scripts/release#trigger-an-automated-prerelease'",
    "download-build": "node ./scripts/release/download-experimental-build.js",
    "download-build-for-head": "node ./scripts/release/download-experimental-build.js --commit=$(git rev-parse HEAD)",
    "download-build-in-codesandbox-ci": "yarn build --type=node react/index react-dom/index react-dom/client react-dom/src/server react-dom/test-utils scheduler/index react/jsx-runtime react/jsx-dev-runtime",
    "check-release-dependencies": "node ./scripts/release/check-release-dependencies",
    "generate-inline-fizz-runtime": "node ./scripts/rollup/generate-inline-fizz-runtime.js",
    "flags": "node ./scripts/flags/flags.js"
  },
  "resolutions": {
    "react-is": "npm:react-is",
    "jsdom": "22.1.0"
  },
  "packageManager": "yarn@1.22.22"
}


# /LICENSE
MIT License

Copyright (c) Meta Platforms, Inc. and affiliates.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


# /.gitignore
.DS_STORE
node_modules
scripts/flow/*/.flowconfig
.flowconfig
*~
*.pyc
.grunt
_SpecRunner.html
__benchmarks__
build/
remote-repo/
coverage/
.module-cache
fixtures/dom/public/react-dom.js
fixtures/dom/public/react.js
test/the-files-to-test.generated.js
*.log*
chrome-user-data
*.sublime-project
*.sublime-workspace
.idea
*.iml
.vscode
*.swp
*.swo

packages/react-devtools-core/dist
packages/react-devtools-extensions/chrome/build
packages/react-devtools-extensions/chrome/*.crx
packages/react-devtools-extensions/chrome/*.pem
packages/react-devtools-extensions/firefox/build
packages/react-devtools-extensions/firefox/*.xpi
packages/react-devtools-extensions/firefox/*.pem
packages/react-devtools-extensions/shared/build
packages/react-devtools-extensions/.tempUserDataDir
packages/react-devtools-fusebox/dist
packages/react-devtools-inline/dist
packages/react-devtools-shell/dist
packages/react-devtools-timeline/dist



