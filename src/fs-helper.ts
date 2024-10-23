import * as fs from 'fs'
import * as path from 'path'

export function directoryExistsSync(path: string, required?: boolean): boolean {
  if (!path) {
    throw new Error("Arg 'path' must not be empty")
  }

  let stats: fs.Stats
  try {
    stats = fs.statSync(path)
  } catch (error) {
    if ((error as any)?.code === 'ENOENT') {
      if (!required) {
        return false
      }

      throw new Error(`Directory '${path}' does not exist`)
    }

    throw new Error(
      `Encountered an error when checking whether path '${path}' exists: ${
        (error as any)?.message ?? error
      }`
    )
  }

  if (stats.isDirectory()) {
    return true
  } else if (!required) {
    return false
  }

  throw new Error(`Directory '${path}' does not exist`)
}

export function existsSync(path: string): boolean {
  if (!path) {
    throw new Error("Arg 'path' must not be empty")
  }

  try {
    fs.statSync(path)
  } catch (error) {
    if ((error as any)?.code === 'ENOENT') {
      return false
    }

    throw new Error(
      `Encountered an error when checking whether path '${path}' exists: ${
        (error as any)?.message ?? error
      }`
    )
  }

  return true
}

export function fileExistsSync(path: string): boolean {
  if (!path) {
    throw new Error("Arg 'path' must not be empty")
  }

  let stats: fs.Stats
  try {
    stats = fs.statSync(path)
  } catch (error) {
    if ((error as any)?.code === 'ENOENT') {
      return false
    }

    throw new Error(
      `Encountered an error when checking whether path '${path}' exists: ${
        (error as any)?.message ?? error
      }`
    )
  }

  if (!stats.isDirectory()) {
    return true
  }

  return false
}

/**
 * Searches a given directory and returns a list of file paths giving all files in that directory.
 * The file paths all begin at `dir`.
 *
 * @param dir The directory to search
 * @returns A list of file paths,
 */
export async function readdirRecursive(dir: string): Promise<string[]> {
  const files = await fs.promises.readdir(dir);
  const result: string[] = [];
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = await fs.promises.stat(filePath);
    if (stat.isDirectory()) {
      result.push(...(await readdirRecursive(filePath)));
    } else {
      result.push(filePath);
    }
  }
  return result;
}
