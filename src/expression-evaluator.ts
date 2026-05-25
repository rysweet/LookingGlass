export class ExpressionEvaluator<State, Expression = unknown, Value = unknown> {
  constructor(
    private readonly evaluateImpl: (state: State, expression: Expression) => Value,
  ) {}

  evaluate(state: State, expression: Expression): Value {
    return this.evaluateImpl(state, expression);
  }

  evaluateAll(state: State, expressions: readonly Expression[]): Value[] {
    return expressions.map((expression) => this.evaluate(state, expression));
  }
}
