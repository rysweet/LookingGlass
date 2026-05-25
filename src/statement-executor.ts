export interface StatementExecutorHooks<Statement, State> {
  executeSequence: (statements: readonly Statement[], state: State) => void;
  executeScopedSequence?: (statements: readonly Statement[], state: State) => void;
  executeStatement?: (statement: Statement, state: State) => void;
}

export class StatementExecutor<Statement, State> {
  constructor(private readonly hooks: StatementExecutorHooks<Statement, State>) {}

  executeSequence(statements: readonly Statement[], state: State): void {
    this.hooks.executeSequence(statements, state);
  }

  executeScopedSequence(statements: readonly Statement[], state: State): void {
    if (this.hooks.executeScopedSequence) {
      this.hooks.executeScopedSequence(statements, state);
      return;
    }
    this.hooks.executeSequence(statements, state);
  }

  executeStatement(statement: Statement, state: State): void {
    if (this.hooks.executeStatement) {
      this.hooks.executeStatement(statement, state);
      return;
    }
    this.hooks.executeSequence([statement], state);
  }
}
