<h1 align="center">stimulus-parser</h1>

<p align="center">
  <a href="https://github.com/marcoroth/stimulus-parser">
    <img src="https://github.com/marcoroth/stimulus-parser/actions/workflows/tests.yml/badge.svg">
  </a>
  <a href="https://www.npmjs.com/package/stimulus-parser">
    <img alt="NPM Version" src="https://img.shields.io/npm/v/stimulus-parser?logo=npm&color=38C160">
  </a>
  <a href="https://www.npmjs.com/package/stimulus-parser">
    <img alt="NPM Downloads" src="https://img.shields.io/npm/dm/stimulus-parser?logo=npm&color=38C160">
  </a>
  <a href="https://bundlephobia.com/package/stimulus-parser">
    <img alt="NPM Bundle Size" src="https://img.shields.io/bundlephobia/minzip/stimulus-parser?label=bundle%20size&logo=npm">
  </a>
</p>


## Installation

To add `stimulus-parser` to your project, run the following command in your terminal:

```bash
yarn add stimulus-parser
```

## Usage

```js
import { Project } from "stimulus-parser"

const project = new Project("/Users/user/path/to/project")

const controllers = project.controllerDefinitions
const controller = controllers[0]

console.log(controller.actionNames)
// => ["connect", "click", "disconnect"]

console.log(controller.targetNames)
// => ["name", "output"]

console.log(controller.classNames)
// => ["loading"]

console.log(controller.values)
// => [{ url: { type: "String", default: "" } }]
```

## Playground

You can inspect parse results on the hosted playground at https://stimulus-parser.hotwire.io.

## Development

To run the tests:

```bash
yarn install
yarn build
yarn test
```
