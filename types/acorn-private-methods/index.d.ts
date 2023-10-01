declare module "acorn-private-methods" {
  import acorn from "acorn"

  const privateMethods: (BaseParser: typeof acorn.Parser) => typeof acorn.Parser

  namespace privateMethods {
    type AcornPrivateMethodsParser = acorn.Parser
  }

  export = privateMethods
}
