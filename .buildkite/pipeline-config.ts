import type { PipelineConfigInterface } from '../src/pipeline-config.ts'

export const config: PipelineConfigInterface = {
	env: {},
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
