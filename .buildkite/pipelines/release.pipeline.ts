import { BasePipeline } from '../../src/base-pipeline.ts'
import type { CommandStep } from '../../src/buildkite-interface.ts'

export class ReleasePipeline extends BasePipeline {
	constructor() {
		super()
	}

	build() {
		this.addLintStep()
		this.addFmtStep()
		this.addReleaseStep()
		return this.pipeline
	}

	private addLintStep() {
		const step: CommandStep = {
			label: ':deno: Lint',
			command: 'deno lint',
			id: 'deno-lint',
		}
		this.addStep(step)
		this.addCommonPlugins(step)
	}

	private addFmtStep() {
		const step: CommandStep = {
			label: ':deno: Format',
			command: 'deno fmt --check',
			id: 'deno-fmt',
		}
		this.addStep(step)
		this.addCommonPlugins(step)
	}

	private addReleaseStep() {
		const step: CommandStep = {
			label: ':deno: Publish to JSR',
			command: `./.buildkite/scripts/release-jsr.sh`,
			id: 'release-jsr',
			if: 'build.tag != null',
			depends_on: ['deno-lint', 'deno-fmt'],
		}
		this.addStep(step)
		this.addCommonPlugins(step)
	}
}
