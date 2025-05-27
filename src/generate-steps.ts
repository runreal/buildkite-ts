#!/usr/bin/env -S deno run --allow-all
import { parseArgs } from '@std/cli/parse-args'
import { generatePipeline } from './generate.ts'
import { registry } from './pipeline-registry.ts'
import { logger } from './utils.ts'

const flags = parseArgs(Deno.args, {
	string: ['dir'],
	default: {
		dir: Deno.env.get('BUILDKITE_TS_DIR') || '.buildkite',
	},
	alias: {
		d: 'dir',
	},
})

const pipelineName = flags._[0]
const baseDirArg = flags.dir

if (!pipelineName) {
	logger.error('Please specify steps name')
	logger.error('Usage: generate-steps.ts <step_name> [--dir=<base_directory>]')
	if (registry.getPipelineNames().length > 0) {
		logger.info(`Available pipelines: ${registry.getPipelineNames().join(', ')}`)
	}
	Deno.exit(1)
} else {
	await generatePipeline(
		pipelineName as string,
		baseDirArg,
		'steps',
		`${pipelineName}.steps.json`,
	)
}
