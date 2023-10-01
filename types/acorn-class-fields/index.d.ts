declare module "acorn-class-fields" {
  import acorn from "acorn"

  const classFields: (BaseParser: typeof acorn.Parser) => typeof acorn.Parser

  namespace classFields {
    type AcornClassFieldsParser = acorn.Parser
  }

  export = classFields
}
