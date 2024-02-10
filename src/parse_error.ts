export class ParseError {
  constructor(
    public readonly severity: "LINT" | "FAIL",
    public readonly message: string,
    public readonly loc?: any,
    public readonly cause?: any,
  ) {}
}
