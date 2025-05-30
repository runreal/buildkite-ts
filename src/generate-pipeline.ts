#!/usr/bin/env -S deno run --allow-all
import { parseArgs } from '@std/cli/parse-args'
import { generatePipeline } from './generate.ts'
import { registry } from './pipeline-registry.ts'
import { logger } from './utils.ts'

const flags = parseArgs(Deno.args, {
	string: ['dir', 'type'],
	default: {
		dir: Deno.env.get('BUILDKITE_TS_DIR') || '.buildkite',
		type: 'pipeline',
	},
	alias: {
		d: 'dir',
		t: 'type',
	},
})

const pipelineName = flags._[0]
const baseDirArg = flags.dir
const fileType = flags.type

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
