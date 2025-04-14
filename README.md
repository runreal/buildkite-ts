# Buildkite Pipeline Generator

A TypeScript-based pipeline generator for Buildkite that supports dynamically loaded and registered pipeline definitions.

## Usage

### As a Module

```typescript
import { registry } from './src/pipeline-registry.ts'
import { initConfig } from './src/pipeline-config.ts'
import MyPipeline from './pipelines/my-pipeline.pipeline.ts' // Assuming your pipeline is here

// Optionally load configuration programmatically
// If using the generate-pipeline script, this is handled automatically
// await initConfig('./pipelines/config.ts')

// Register a pipeline manually
registry.register('my-pipeline', MyPipeline)

// Generate a pipeline
const pipeline = await registry.generatePipeline('my-pipeline')

// Output the pipeline (e.g., as JSON)
console.log(JSON.stringify(pipeline, null, 2))
```

### As a CLI

The primary way to use this tool is via the `generate-pipeline.ts` script.

```bash
# Structure your project:
# my-project/
# |- pipelines/
# |  |- my-pipeline.pipeline.ts
# |  |- another-pipeline.steps.ts
# |  |- config.ts        # Optional config for pipelines in this dir
# |- src/                 # Copied/cloned from buildkite-ts-test
# |- deno.json            # Your project's Deno config
# ... other files

# Generate a pipeline definition (looks for ./pipelines/my-pipeline.pipeline.ts)
deno run --allow-read --allow-env src/generate-pipeline.ts my-pipeline

# Generate steps (looks for ./pipelines/another-pipeline.steps.ts)
deno run --allow-read --allow-env src/generate-pipeline.ts another-pipeline --type steps

# Specify a different directory for pipelines and config
deno run --allow-read --allow-env src/generate-pipeline.ts my-pipeline --dir ./custom-pipelines

# Upload directly to Buildkite (requires buildkite-agent and --allow-run)
# Set CI=true environment variable or ensure Deno.env.get('CI') is 'true'
CI=true deno run --allow-read --allow-env --allow-run=buildkite-agent src/generate-pipeline.ts my-pipeline
```

The script will automatically:

1. Look for a pipeline file named `<pipeline_name>.<type>.ts` (e.g., `my-pipeline.pipeline.ts`) inside the specified directory (`--dir`, defaults to `./pipelines`).
2. Load the configuration from `config.ts` within that same directory (e.g., `./pipelines/config.ts`).
3. Generate the pipeline definition as JSON in `./.generated/<pipeline_name>.<type>.json`.
4. If `CI=true` is set in the environment, upload the generated JSON using `buildkite-agent pipeline upload`.

## Creating Custom Pipelines

Create a new pipeline by extending the `BasePipeline` class:

```typescript
// pipelines/my-pipeline.pipeline.ts
import { BasePipeline } from '../src/base-pipeline.ts'
import { CommandStep } from '../src/buildkite-interface.ts'
import { config } from '../src/pipeline-config.ts' // Import the loaded config

export class MyPipeline extends BasePipeline {
	build() {
		// Example: Accessing config loaded from pipelines/config.ts
		const version = config.env?.PROJECT_VERSION || 'unknown'

		const step: CommandStep = {
			label: `:hammer: My Step (Version: ${version})`,
			command: "echo 'Hello, world!'",
		}
		this.addStep(step)
		return this.pipeline
	}
}
```

Save this file within the directory the `generate-pipeline.ts` script will look in (default: `./pipelines`). The script will automatically detect and register the pipeline based on the filename.

## Pipeline Configuration

Pipeline configuration is loaded automatically by the `generate-pipeline.ts` script from a specific file.

### Configuration File

Create a file named `config.ts` inside the directory where your pipeline definition files reside (specified by `--dir`, defaults to `./pipelines`).

```typescript
// pipelines/config.ts
export default {
	env: {
		// Environment variables for all pipeline steps
		PROJECT_VERSION: '1.0.0',
	},
	plugins: {
		// Common plugin configurations
		myPlugin: {
			'org/my-plugin#v1.0.0': {
				setting: 'value',
			},
		},
	},
	// Add any custom data your pipelines need
	myCustomConfig: {
		// Your custom configuration here
		setting: 'some value',
	},
}
```

### Initialization (Automatic via CLI)

The `generate-pipeline.ts` script handles loading this `config.ts` automatically before generating the pipeline.

### Initialization (Manual/Programmatic)

If you are using the library programmatically (not via the CLI script), you need to initialize the configuration yourself:

```typescript
import { initConfig } from './src/pipeline-config.ts'

// Load the configuration (specify the correct path)
await initConfig('./pipelines/config.ts')
```

### Custom Configuration Path (via CLI)

To use a configuration file in a different directory, use the `--dir` flag with the `generate-pipeline.ts` script. It will look for `config.ts` within that specified directory.

```bash
# Looks for ./custom-pipelines/my-pipeline.pipeline.ts 
# and loads config from ./custom-pipelines/config.ts
deno run --allow-read --allow-env src/generate-pipeline.ts my-pipeline --dir ./custom-pipelines
```

### Accessing Configuration in Pipelines

Import the `config` object directly from `pipeline-config.ts`. The `initConfig` function (called either automatically by the CLI or manually by you) populates this shared config object.

```typescript
// pipelines/my-pipeline.pipeline.ts
import { BasePipeline } from '../src/base-pipeline.ts'
import { config } from '../src/pipeline-config.ts' // Import the config object

export class MyPipeline extends BasePipeline {
	build() {
		// Access your configuration
		const version = config.env.PROJECT_VERSION
		const myCustomSetting = config.myCustomConfig.setting

		this.addStep({
			command: `echo "Version: ${version}, Setting: ${myCustomSetting}"`,
			label: ':gear: Config Step',
		})
		return this.pipeline
	}
}
```

## Pipeline Discovery

Pipelines are not "built-in". The `generate-pipeline.ts` script discovers pipeline definition files based on naming conventions within a specified directory (`--dir`, default `./pipelines`).

- For pipeline generation (`--type pipeline`, default), it looks for `<name>.pipeline.ts`.
- For step generation (`--type steps`), it looks for `<name>.steps.ts`.

Alternatively, you can manually register pipeline classes using `registry.register()` as shown in the "As a Module" example.

The `src/dynamic-pipeline.ts` file is provided as an example of a pipeline definition. You would typically copy or adapt this into your `pipelines` directory (e.g., as `pipelines/dynamic.pipeline.ts`) to use it with the CLI script.

## Requirements

- Latest stable Deno (uses recent `@std` modules)
- Buildkite Agent (optional, only required for direct pipeline upload via the CLI)
- Necessary Deno permissions for `generate-pipeline.ts` (e.g., `--allow-read`, `--allow-env`, `--allow-run=buildkite-agent` if uploading).
