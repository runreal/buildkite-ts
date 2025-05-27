import { BasePipeline } from '../../src/base-pipeline.ts'
import type { CommandStep } from '../../src/buildkite-interface.ts'

export class ExamplePipeline extends BasePipeline {
	constructor() {
		super()
	}

	build() {
		this.addExampleStep1()
		this.addExampleStep2()
		return this.pipeline
	}

	private addExampleStep1() {
		const step: CommandStep = {
			label: ':hammer: example step 1',
			command: "echo 'Hello, world!'",
		}
		this.addStep(step)
		this.addCommonPlugins(step)
	}

	private addExampleStep2() {
		const step: CommandStep = {
			label: ':hammer: example step 2',
			command: "echo 'Hello, parallel world!'",
			parallelism: 5,
		}
		this.addStep(step)
		this.addCommonPlugins(step)
	}
}
