import * as fs from 'node:fs';
import * as path from 'node:path';
import * as url from 'node:url';
import * as yaml from 'js-yaml';

type ActionYaml = {
  name: string;
  description: string;
  inputs?: Record<
    string,
    {
      description: string;
      required?: boolean;
      default?: string | number | boolean;
    }
  >;
  outputs?: Record<
    string,
    {
      description: string;
    }
  >;
  runs: {
    using: string;
    main: string;
  };
};

/**
 * Updates the usage section in the README.md based on the action.yml file
 * @param actionReference - The GitHub action reference (e.g., 'actions/checkout@v3')
 * @param actionYamlPath - Path to the action.yml file
 * @param readmePath - Path to the README.md file
 * @param startToken - Start token for the usage section
 * @param endToken - End token for the usage section
 * @throws {Error} If the action reference is empty or if file operations fail
 */
function updateUsage(
  actionReference: string,
  actionYamlPath = 'action.yml',
  readmePath = 'README.md',
  startToken = '<!-- start usage -->',
  endToken = '<!-- end usage -->'
): void {
  if (!actionReference?.trim()) {
    throw new Error('Parameter actionReference must not be empty');
  }

  // Resolve paths relative to the current file's directory
  const resolvePath = (filePath: string): string => {
    return path.isAbsolute(filePath)
      ? filePath
      : path.resolve(path.dirname(filePath === actionYamlPath ? actionYamlPath : readmePath), filePath);
  };

  const resolvedActionYamlPath = resolvePath(actionYamlPath);
  const resolvedReadmePath = resolvePath(readmePath);

  // Ensure files exist
  [resolvedActionYamlPath, resolvedReadmePath].forEach((filePath) => {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
  });

  // Load and parse the action.yml
  let actionYaml: ActionYaml;
  try {
    const fileContent = fs.readFileSync(resolvedActionYamlPath, 'utf8');
    actionYaml = yaml.load(fileContent) as ActionYaml;
    
    if (!actionYaml?.name) {
      throw new Error('Invalid action.yml: Missing required fields');
    }
  } catch (error) {
    throw new Error(`Failed to parse ${resolvedActionYamlPath}: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Load the README
  let originalReadme: string;
  try {
    originalReadme = fs.readFileSync(resolvedReadmePath, 'utf8');
  } catch (error) {
    throw new Error(`Failed to read ${resolvedReadmePath}: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Find the start token
  const startTokenIndex = originalReadme.indexOf(startToken)
  if (startTokenIndex < 0) {
    throw new Error(`Start token '${startToken}' not found`)
  }

  // Find the end token
  const endTokenIndex = originalReadme.indexOf(endToken)
  if (endTokenIndex < 0) {
    throw new Error(`End token '${endToken}' not found`)
  } else if (endTokenIndex < startTokenIndex) {
    throw new Error('Start token must appear before end token')
  }

  // Build the new README
  const newReadme: string[] = []

  // Append the beginning
  newReadme.push(originalReadme.substr(0, startTokenIndex + startToken.length))

  // Build the new usage section
  newReadme.push('```yaml', `- uses: ${actionReference}`, '  with:')
  const inputs = actionYaml.inputs
  let firstInput = true
  for (const key of Object.keys(inputs)) {
    const input = inputs[key]

    // Line break between inputs
    if (!firstInput) {
      newReadme.push('')
    }

    // Constrain the width of the description
    const width = 80
    let description = (input.description as string)
      .trimRight()
      .replace(/\r\n/g, '\n') // Convert CR to LF
      .replace(/ +/g, ' ') //    Squash consecutive spaces
      .replace(/ \n/g, '\n') //  Squash space followed by newline
    while (description) {
      // Longer than width? Find a space to break apart
      let segment: string = description
      if (description.length > width) {
        segment = description.substr(0, width + 1)
        while (!segment.endsWith(' ') && !segment.endsWith('\n') && segment) {
          segment = segment.substr(0, segment.length - 1)
        }

        // Trimmed too much?
        if (segment.length < width * 0.67) {
          segment = description
        }
      } else {
        segment = description
      }

      // Check for newline
      const newlineIndex = segment.indexOf('\n')
      if (newlineIndex >= 0) {
        segment = segment.substr(0, newlineIndex + 1)
      }

      // Append segment
      newReadme.push(`    # ${segment}`.trimRight())

      // Remaining
      description = description.substr(segment.length)
    }

    if (input.default !== undefined) {
      // Append blank line if description had paragraphs
      if ((input.description as string).trimRight().match(/\n[ ]*\r?\n/)) {
        newReadme.push(`    #`)
      }

      // Default
      newReadme.push(`    # Default: ${input.default}`)
    }

    // Input name
    newReadme.push(`    ${key}: ''`)

    firstInput = false
  }

  newReadme.push('```')

  // Append the end
  newReadme.push(originalReadme.substr(endTokenIndex))

  // Write the new README
  fs.writeFileSync(readmePath, newReadme.join(os.EOL))
}

updateUsage(
  'actions/checkout@v5',
  path.join(__dirname, '..', '..', 'action.yml'),
  path.join(__dirname, '..', '..', 'README.md')
)
