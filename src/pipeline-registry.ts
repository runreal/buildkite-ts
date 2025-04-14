import { fromFileUrl, parse } from '@std/path'
import { BasePipeline } from './base-pipeline.ts'
import type { BuildkitePipeline } from './buildkite-interface.ts'

export type PipelineConstructor = new () => BasePipeline

export class PipelineRegistry {
	private static instance: PipelineRegistry
	private pipelines: Map<string, PipelineConstructor> = new Map()

	private constructor() {}

	static getInstance(): PipelineRegistry {
		if (!PipelineRegistry.instance) {
			PipelineRegistry.instance = new PipelineRegistry()
		}
		return PipelineRegistry.instance
	}

	register(name: string, pipelineClass: PipelineConstructor): void {
		this.pipelines.set(name, pipelineClass)
	}

	async registerFromFile(fileUrl: string): Promise<void> {
		try {
			const module = await import(fileUrl)

			// Find the first class that extends BasePipeline
			const pipelineClass = Object.values(module).find(
				(exported) =>
					typeof exported === 'function' &&
					exported.prototype instanceof BasePipeline,
			) as PipelineConstructor | undefined

			if (pipelineClass) {
				const parsedName = parse(fromFileUrl(fileUrl)).name // e.g., "my-pipeline.pipeline", "my-steps.steps"
				const pipelineSuffix = '.pipeline'
				const stepsSuffix = '.steps'
				let name = 'unknown'

				if (parsedName.endsWith(pipelineSuffix)) {
					name = parsedName.slice(0, -pipelineSuffix.length)
				} else if (parsedName.endsWith(stepsSuffix)) {
					name = parsedName.slice(0, -stepsSuffix.length)
				} else {
					// Fallback if no known suffix is found (e.g., just 'myconfig.ts')
					name = parsedName || 'unknown'
				}
				this.register(name, pipelineClass)
			} else {
				throw new Error(
					`No valid pipeline class found in ${fileUrl}. ` +
						`Expected a class that extends BasePipeline. ` +
						`Found exports: ${Object.keys(module).join(', ')}`,
				)
			}
		} catch (error) {
			throw error
		}
	}

	getPipeline(name: string): PipelineConstructor | undefined {
		return this.pipelines.get(name)
	}

	getPipelineNames(): string[] {
		return Array.from(this.pipelines.keys())
	}

	async generatePipeline(name: string): Promise<BuildkitePipeline> {
		const PipelineClass = this.getPipeline(name)
		if (!PipelineClass) {
			throw new Error(`Pipeline '${name}' not found`)
		}
		// pass in the common config to the pipeline constructor
		// we just for look for common config in whatever default location
		const pipeline = new PipelineClass()
		const result = pipeline.build()
		return result instanceof Promise ? await result : result
	}
}

export const registry: PipelineRegistry = PipelineRegistry.getInstance()
