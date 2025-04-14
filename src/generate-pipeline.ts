#!/usr/bin/env -S deno run --allow-all
import $ from '@david/dax'
import { ensureDir } from '@std/fs'
import { join, resolve, toFileUrl } from '@std/path'
import { parseArgs } from '@std/cli/parse-args'
import { registry } from './pipeline-registry.ts'
import { initConfig } from './pipeline-config.ts'
import { logger } from './utils.ts'

const generatedDir = './.buildkite/.generated'

// Parse command line arguments
const flags = parseArgs(Deno.args, {
	string: ['dir', 'type'],
	default: {
		dir: '.buildkite/pipelines', // Default directory to search for pipeline files
		type: 'pipeline', // Default file type (pipeline or steps)
	},
	alias: {
		d: 'dir', // Allow -d as a shorthand for --dir
		t: 'type', // Allow -t as a shorthand for --type
	},
})

// Get the pipeline name and base directory
const pipelineName = flags._[0]
const baseDirArg = flags.dir
const fileType = flags.type

async function generatePipeline(
	pipelineName: string,
	baseDirArg: string,
	fileType: string,
	filename?: string,
) {
	try {
		// Resolve the base directory relative to the current working directory
		const baseDir = resolve(Deno.cwd(), baseDirArg)

		// Set file extension based on type
		const fileExtension = fileType === 'steps' ? '.steps.ts' : '.pipeline.ts'
		const outputFileName = filename || `${pipelineName}.pipeline.json`
		const pipelineFileName = `${pipelineName}${fileExtension}`
		const pipelineFile = join(baseDir, pipelineFileName)
		const configPath = join(baseDir, 'config.ts')

		logger.debug(`[${pipelineName}] Resolved base directory: ${baseDir}`)
		logger.debug(`[${pipelineName}] Looking for pipeline file: ${pipelineFile}`)
		logger.debug(`[${pipelineName}] Looking for config file: ${configPath}`)

		// 1. Initialize the config (attempt to load from the resolved base directory)
		try {
			await initConfig(configPath)
			logger.debug(`[${pipelineName}] Configuration loaded successfully from ${configPath}`)
		} catch (err) {
			logger.error(
				`[${pipelineName}] Could not load configuration from ${configPath}. Proceeding without it. Error: ${
					err instanceof Error ? err.message : String(err)
				}`,
			)
		}

		// 2. Check if the pipeline file exists and register it
		try {
			await Deno.stat(pipelineFile)
			logger.debug(`[${pipelineName}] Found pipeline file. Registering...`)
			const pipelineUrl = toFileUrl(pipelineFile).href
			await registry.registerFromFile(pipelineUrl)
			logger.debug(`[${pipelineName}] Pipeline registered successfully from ${pipelineUrl}`)
		} catch (err) {
			if (err instanceof Deno.errors.NotFound) {
				logger.error(`[${pipelineName}] Pipeline file not found at: ${pipelineFile}`)
			} else {
				logger.error(
					`[${pipelineName}] Error accessing pipeline file ${pipelineFile}: ${
						err instanceof Error ? err.message : String(err)
					}`,
				)
			}
			Deno.exit(1)
		}

		// 3. Generate the pipeline (it must have been registered in step 2)
		const jsonString = JSON.stringify(await registry.generatePipeline(pipelineName), null, 2)

		await ensureDir(generatedDir)
		const outputFile = join(generatedDir, outputFileName)
		await Deno.writeTextFile(outputFile, jsonString)

		logger.info(`[${pipelineName}] Pipeline JSON written to ${outputFile}`)

		if (Deno.env.get('CI') === 'true') {
			await $`cat ${outputFile} | buildkite-agent pipeline upload`
		}
	} catch (error: unknown) {
		logger.error(`Error generating pipeline: ${error instanceof Error ? error.message : String(error)}`)
		Deno.exit(1)
	}
}

if (!pipelineName) {
	logger.error('Please specify a pipeline name')
	logger.error('Usage: generate-pipeline.ts <pipeline_name> [--dir=<base_directory>] [--type=pipeline|steps]')
	if (registry.getPipelineNames().length > 0) {
		logger.info(`Available pipelines: ${registry.getPipelineNames().join(', ')}`)
	}
	Deno.exit(1)
} else {
	await generatePipeline(
		pipelineName as string,
		baseDirArg,
		fileType as string,
		`${pipelineName}.${fileType}.json`,
	)
}
