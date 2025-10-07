import {BaseCommand} from './commands/base-command'

/**
 * CommandManager - Manages registration and execution of commands
 */
export class CommandManager {
  private commands: Map<
    string,
    new (params: Record<string, unknown>) => BaseCommand
  >

  constructor() {
    this.commands = new Map()
  }

  /**
   * Register a new command
   * @param name - Command name
   * @param CommandClass - Command class to register
   * @throws {Error} If the command class doesn't extend BaseCommand
   */
  register(
    name: string,
    CommandClass: new (params: Record<string, unknown>) => BaseCommand
  ): void {
    if (!(CommandClass.prototype instanceof BaseCommand)) {
      throw new Error('Command must extend BaseCommand')
    }
    this.commands.set(name, CommandClass)
  }

  /**
   * Execute a command by name
   * @param name - Command name
   * @param params - Command parameters
   * @returns Command execution result
   * @throws {Error} If the command is not found
   */
  async execute<T = unknown>(
    name: string,
    params: Record<string, unknown> = {}
  ): Promise<T> {
    const CommandClass = this.commands.get(name)
    if (!CommandClass) {
      throw new Error(`Command '${name}' not found`)
    }

    const command = new CommandClass(params)
    return (await command.execute()) as T
  }

  /**
   * List all registered commands
   * @returns Array of command names
   */
  listCommands(): string[] {
    return Array.from(this.commands.keys())
  }
}
