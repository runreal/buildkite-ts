export interface BuildkitePipeline {
	env?: Record<string, string>
	agents?: AgentsConfig
	notify?: NotifyConfig[]
	steps: Step[]
	priority?: number
}

export type AgentsConfig = Record<string, string> | string[]

export type NotifyConfig =
	| 'github_check'
	| 'github_commit_status'
	| { email: string; if?: string }
	| { basecamp_campfire: string; if?: string }
	| { slack: string | { channels: string[]; message: string }; if?: string }
	| { webhook: string; if?: string }
	| { pagerduty_change_event: string; if?: string }
	| { github_commit_status: { context: string }; if?: string }
	| { github_check: { context: string }; if?: string }

export type Step =
	| BlockStep
	| InputStep
	| CommandStep
	| WaitStep
	| TriggerStep
	| GroupStep

export interface CommonStepOptions {
	allow_dependency_failure?: boolean
	branches?: string | string[]
	depends_on?: string | string[] | { step: string; allow_failure: boolean }[]
	id?: string
	identifier?: string
	if?: string
	key?: string
	label?: string
	name?: string
	skip?: boolean | string
}

export interface BlockStep extends CommonStepOptions {
	block: string
	blocked_state?: 'passed' | 'failed' | 'running'
	fields?: Field[]
	prompt?: string
	type?: 'block'
}

export interface InputStep extends CommonStepOptions {
	input: string
	fields?: Field[]
	prompt?: string
	type?: 'input'
}

export interface CommandStep extends CommonStepOptions {
	agents?: AgentsConfig
	artifact_paths?: string | string[]
	command?: string | string[]
	commands?: string | string[]
	concurrency?: number
	concurrency_group?: string
	concurrency_method?: 'ordered' | 'eager'
	env?: Record<string, string>
	matrix?: string[] | MatrixConfig
	parallelism?: number
	plugins?: (string | Record<string, unknown>)[]
	soft_fail?: boolean | SoftFailConfig[]
	retry?: RetryConfig
	timeout_in_minutes?: number
	type?: 'script' | 'command' | 'commands'
	priority?: number
}

export interface WaitStep extends CommonStepOptions {
	continue_on_failure?: boolean
	type?: 'wait' | 'waiter'
	wait?: null | ''
	waiter?: null | ''
}

export interface TriggerStep extends CommonStepOptions {
	async?: boolean
	build?: {
		branch?: string
		commit?: string
		env?: Record<string, string>
		message?: string
		meta_data?: Record<string, unknown>
		trigger?: string
	}
	trigger: string
	soft_fail?: boolean | SoftFailConfig[]
}

export interface GroupStep extends CommonStepOptions {
	group: string | null
	steps: Step[]
	type: 'group'
}

export interface Field {
	text?: string
	select?: string
	key: string
	hint?: string
	required?: boolean
	default?: string | string[]
	options?: { label: string; value: string; hint?: string }[]
	multiple?: boolean
}

export interface MatrixConfig {
	setup: string[] | Record<string, (string | number | boolean)[]>
	adjustments?: MatrixAdjustment[]
}

export interface MatrixAdjustment {
	with: string[] | Record<string, string>
	skip?: boolean | string
	soft_fail?: boolean | SoftFailConfig[]
}

export interface SoftFailConfig {
	exit_status: number | '*'
}

export interface RetryConfig {
	automatic?: boolean | string | AutomaticRetryConfig | AutomaticRetryConfig[]
	manual?: boolean | string | ManualRetryConfig
}

export interface AutomaticRetryConfig {
	exit_status?: number | '*'
	limit?: number
	signal?: string
	signal_reason?: 'agent_refused' | 'agent_stop' | 'cancel' | 'process_run_error' | 'signature_rejected'
}

export interface ManualRetryConfig {
	allowed?: boolean | string
	permit_on_passed?: boolean | string
	reason?: string
}
