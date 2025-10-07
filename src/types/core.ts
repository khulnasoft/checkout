/**
 * Core type definitions for KhulnaSoft Development Engine
 */

export interface IEngineConfig {
  version?: string;
  [key: string]: unknown;
}

export interface IEngineComponent {
  initialize?(): Promise<void>;
  start?(): Promise<void>;
  stop?(): Promise<void>;
}

export interface ILogger {
  debug(message: string, ...meta: unknown[]): void;
  info(message: string, ...meta: unknown[]): void;
  warn(message: string, ...meta: unknown[]): void;
  error(message: string, ...meta: unknown[]): void;
}

export interface ICommand {
  execute(): Promise<unknown>;
  validate?(): boolean;
}

export interface ICommandManager {
  register(name: string, CommandClass: new (params: Record<string, unknown>) => ICommand): void;
  execute<T = unknown>(name: string, params?: Record<string, unknown>): Promise<T>;
  listCommands(): string[];
}

export interface IRepositoryManager extends IEngineComponent {
  // Add repository manager specific methods
  cloneRepository(url: string, targetPath: string): Promise<void>;
  updateRepository(path: string): Promise<void>;
  // ... other repository related methods
}

export interface IAIServiceManager extends IEngineComponent {
  // Add AI service manager specific methods
  processRequest(prompt: string, options?: Record<string, unknown>): Promise<unknown>;
  // ... other AI service related methods
}

export interface IWorkflowManager extends IEngineComponent {
  // Add workflow manager specific methods
  executeWorkflow(workflowName: string, inputs: Record<string, unknown>): Promise<unknown>;
  // ... other workflow related methods
}

export interface IEventBus {
  on(event: string, listener: (...args: unknown[]) => void): void;
  off(event: string, listener: (...args: unknown[]) => void): void;
  emit(event: string, ...args: unknown[]): void;
  once(event: string, listener: (...args: unknown[]) => void): void;
}

export interface IMetricsCollector {
  increment(metric: string, tags?: Record<string, string>): void;
  gauge(metric: string, value: number, tags?: Record<string, string>): void;
  timing(metric: string, value: number, tags?: Record<string, string>): void;
  // ... other metrics related methods
}
