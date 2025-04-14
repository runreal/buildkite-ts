import type { PipelineConfigInterface } from '../src/pipeline-config.ts'

export const config: PipelineConfigInterface = {
	env: {
		// Environment variables shared across all pipeline steps
		PROJECT_VERSION: '1.0.0',
		ENGINE_PATH: './engine',
		PROJECT_PATH: './project',
		BUILD_PATH: './build',
	},
	// Common plugins used by pipeline steps
	plugins: {
		deno: {
			'docker#v5.12.0': {
				image: 'denoland/deno:alpine-2.2.8',
				'mount-buildkite-agent': true,
				'propagate-environment': true,
			},
		},
	},
}
