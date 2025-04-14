import { configure, getConsoleSink, getLogger } from '@logtape/logtape'

await configure({
	sinks: {
		console: getConsoleSink(),
	},
	loggers: [
		{
			category: 'buildkite-ts',
			lowestLevel: 'debug',
			sinks: ['console'],
		},
		{
			category: ['logtape', 'meta'],
			lowestLevel: 'error',
			sinks: ['console'],
		},
	],
})

export const logger = getLogger(['buildkite-ts'])
