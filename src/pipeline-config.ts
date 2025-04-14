// Define the base structure for the pipeline configuration
export interface PipelineConfigInterface {
	env?: Record<string, string>
	plugins: {
		[key: string]: Record<string, unknown>
	}
	[key: string]: unknown // Allow arbitrary additional data
}

// Default/empty configuration
const defaultConfig: PipelineConfigInterface = {
	env: {},
	plugins: {},
}

// Flag to track if config has been initialized
let isConfigInitialized = false

/**
 * Loads configuration from a file
 * @param configPath Path to the configuration file.
 */
export async function loadConfigFromFile(
	configPath: string,
): Promise<PipelineConfigInterface> {
	try {
		// Convert Windows path to file URL if needed
		const fileUrl = configPath.startsWith('file://') ? configPath : `file:///${configPath.replace(/\\/g, '/')}`

		// Dynamic import of the config file
		const configModule = await import(fileUrl)
		const loadedConfig = configModule.default || configModule.config
		if (!loadedConfig) {
			return { ...defaultConfig }
		}

		return { ...defaultConfig, ...loadedConfig }
	} catch (_err: unknown) {
		return { ...defaultConfig }
	}
}

// Exported config object with the default values
export const config: PipelineConfigInterface = { ...defaultConfig }

/**
 * Updates the exported config with values from a file.
 * This function should only be called once.
 * @param configPath Optional path to the config file
 */
export async function initConfig(configPath: string): Promise<void> {
	if (isConfigInitialized) {
		return
	}
	const loadedConfig = await loadConfigFromFile(configPath)

	// Update the exported config object with loaded values
	Object.assign(config, loadedConfig)
	isConfigInitialized = true
}
