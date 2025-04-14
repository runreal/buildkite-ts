import type { BuildkitePipeline, CommandStep, Step } from './buildkite-interface.ts'
import { config } from './pipeline-config.ts'

export abstract class BasePipeline {
	protected pipeline: BuildkitePipeline

	constructor() {
		this.pipeline = {
			env: { ...config.env },
			steps: [],
		}
	}

	protected addStep(step: Step) {
		this.pipeline.steps.push(step)
	}

	protected addCommonPlugins(step: CommandStep) {
		step.plugins = [
			...Object.values(config.plugins || []),
			...(step.plugins || []),
		]
	}

	abstract build(): BuildkitePipeline | Promise<BuildkitePipeline>

	async generateJSON(): Promise<string> {
		const builtPipeline = await this.build()
		return JSON.stringify(builtPipeline, null, 2)
	}
}
