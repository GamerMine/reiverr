import * as v from 'valibot';

// Inbound Messages

export const NewTaskMessageSchema = v.object({
	type: v.literal('newTask'),
	uuid: v.pipe(v.string(), v.uuid())
});
export type NewTaskMessage = v.InferOutput<typeof NewTaskMessageSchema>;

export const TaskCanceledMessageSchema = v.object({
	type: v.literal('taskCanceled'),
	uuid: v.pipe(v.string(), v.uuid())
});
export type TaskCanceledMessage = v.InferOutput<typeof TaskCanceledMessageSchema>;

export const InboundMessageSchema = v.variant('type', [
	NewTaskMessageSchema,
	TaskCanceledMessageSchema
]);
export type InboundMessage = v.InferOutput<typeof InboundMessageSchema>;

// Outbound Messages

export const TaskExecutionQueuedMessageSchema = v.object({
	type: v.literal('taskQueued'),
	uuid: v.pipe(v.string(), v.uuid())
});
export type TaskExecutionQueuedMessage = v.InferOutput<typeof TaskExecutionQueuedMessageSchema>;

export const TaskExecutionStartedMessageSchema = v.object({
	type: v.literal('taskExecutionStarted'),
	uuid: v.pipe(v.string(), v.uuid())
});
export type TaskExecutionStartedMessage = v.InferOutput<typeof TaskExecutionStartedMessageSchema>;

export const TaskExecutionProgressMessageSchema = v.object({
	type: v.literal('taskExecutionProgress'),
	uuid: v.pipe(v.string(), v.uuid()),
	current: v.number(),
	total: v.number()
});
export type TaskExecutionProgressMessage = v.InferOutput<typeof TaskExecutionProgressMessageSchema>;

export const TaskExecutionFinishedMessageSchema = v.object({
	type: v.literal('taskExecutionFinished'),
	uuid: v.pipe(v.string(), v.uuid()),
	error: v.optional(v.string())
});
export type TaskExecutionFinishedMessage = v.InferOutput<typeof TaskExecutionFinishedMessageSchema>;

export const TaskExecutionCanceledMessageSchema = v.object({
	type: v.literal('taskExecutionCanceled')
});
export type TaskExecutionCanceledMessage = v.InferOutput<typeof TaskExecutionCanceledMessageSchema>;

export const OutboundMessageSchema = v.variant('type', [
	TaskExecutionQueuedMessageSchema,
	TaskExecutionStartedMessageSchema,
	TaskExecutionProgressMessageSchema,
	TaskExecutionFinishedMessageSchema,
	TaskExecutionCanceledMessageSchema
]);
export type OutboundMessage = v.InferOutput<typeof OutboundMessageSchema>;
