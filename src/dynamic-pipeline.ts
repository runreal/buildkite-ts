import $ from '@david/dax'
import { BasePipeline } from './base-pipeline.ts'
import type { BuildkitePipeline, CommandStep } from './buildkite-interface.ts'

// Convert a string to an environment variable name
const toEnvVar = (key: string) => `${key.toUpperCase().replace(/[- ./\\,:;(){}[\]]+/g, '_')}`

export abstract class DynamicPipeline extends BasePipeline {
	private inputParams: Record<string, string[]> = {}

	constructor() {
		super()
		this.pipeline = {
			steps: [],
		}
	}

	async loadInputParams(params: string[]) {
		for (const param of params) {
			const value = await this.getMetaData(param)
			this.inputParams[param] = value.includes('\n') || value.includes(',')
				? value.split(/[\n,]/).map((v) => v.trim()).filter(Boolean)
				: [value]
		}
	}

	private async getMetaData(key: string): Promise<string> {
		if (Deno.env.get('CI') !== 'true') {
			return Deno.env.get(toEnvVar(key)) || ''
		}
		try {
			await $`buildkite-agent meta-data exists "${key}"`
			return (await $`buildkite-agent meta-data get "${key}"`.text()).trim()
		} catch {
			return ''
		}
	}

	getInputParam(key: string): string[] {
		return this.inputParams[key]
	}

	addDynamicStep(stepConfig: (param: string) => CommandStep, paramKey: string) {
		const param = this.getInputParam(paramKey)
		for (const value of param) {
			const step = stepConfig(value)
			this.addCommonPlugins(step)
			this.addStep(step)
		}
	}

	abstract override build(): Promise<BuildkitePipeline>
}
