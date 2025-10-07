import {BaseCommand} from './base-command'

interface HelloCommandParams extends Record<string, unknown> {
  name?: string
}

/**
 * HelloCommand - Example command that greets a user
 * @extends {BaseCommand}
 */
export class HelloCommand extends BaseCommand {
  private name: string

  /**
   * @param params - Command parameters
   * @param params.name - Name to greet (default: 'World')
   */
  constructor(params: HelloCommandParams = {}) {
    super(params)
    this.name = params.name || 'World'
  }

  /**
   * Validate command parameters
   * @returns Whether the parameters are valid
   * @throws {Error} If validation fails
   */
  validate(): boolean {
    if (typeof this.name !== 'string' || this.name.trim() === '') {
      throw new Error('Name must be a non-empty string')
    }
    return true
  }

  /**
   * Execute the hello command
   * @returns The greeting message
   */
  async execute(): Promise<string> {
    this.validate()
    const greeting = `Hello, ${this.name}!`
    this.logger.log(greeting)
    return greeting
  }
}

/* Example usage:
const hello = new HelloCommand({name: 'KhulnaSoft'})
await hello.execute() // Logs: "Hello, KhulnaSoft!"
*/
