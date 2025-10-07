import type {Console} from 'node:console'

/**
 * BaseCommand - Abstract base class for all commands
 * @abstract
 */
export abstract class BaseCommand {
  protected params: Record<string, unknown>
  protected logger: Console

  /**
   * @param params - Command parameters
   */
  constructor(params: Record<string, unknown> = {}) {
    this.params = params
    this.logger = console // In a real app, use a proper logger
  }

  /**
   * Execute the command
   * @abstract
   * @returns The result of the command execution
   */
  abstract execute(): Promise<unknown>

  /**
   * Validate command parameters
   * @returns Whether the parameters are valid
   */
  validate(): boolean {
    return true // Default validation passes
  }
}
