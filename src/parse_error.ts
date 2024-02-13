import { SourceLocation } from "acorn"

export class ParseError {
  constructor(
    public readonly severity: "LINT" | "FAIL",
    public readonly message: string,
    public readonly loc?: SourceLocation | null,
    public readonly cause?: string,
  ) {}
}
