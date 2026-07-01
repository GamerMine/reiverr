import {
	BaseEntity,
	Column,
	CreateDateColumn,
	Entity,
	IsNull,
	ManyToOne,
	Not,
	OneToMany,
	PrimaryGeneratedColumn
} from 'typeorm';
import { TaskExecutionEntity, UserSettingsEntity } from '../entities.js';
import { type MessageObject, TaskState, TaskStateType, TaskStatus, TaskType } from '../types.js';

@Entity({ name: 'tasks' })
export class TaskEntity extends BaseEntity {
	@PrimaryGeneratedColumn('uuid')
	uuid: string;

	@Column('enum', {
		enum: TaskType
	})
	type: TaskType;

	@ManyToOne(() => UserSettingsEntity, (entity) => entity.userId)
	user: UserSettingsEntity;

	@Column('simple-json', { nullable: true })
	data: unknown | null;

	@Column('text', { nullable: true })
	cron: string | null;

	@CreateDateColumn()
	created: Date;

	@Column('timestamptz', { nullable: true })
	canceled: Date | null;

	@Column('timestamptz', { nullable: true })
	scheduled: Date | null;

	@Column('timestamptz', { nullable: true })
	executed: Date | null;

	@OneToMany(() => TaskExecutionEntity, (execution) => execution.task)
	executions: TaskExecutionEntity[];

	@Column('simple-json', { nullable: true })
	error: MessageObject | null;

	public static async get(uuid: string) {
		return TaskEntity.findOne({
			where: { uuid },
			relations: { executions: true }
		});
	}

	public static async getPending(userId?: string | undefined) {
		const user = userId ? { user: { userId } } : {};

		return TaskEntity.find({
			where: [
				{
					...user,
					cron: Not(IsNull()),
					canceled: IsNull(),
					error: IsNull()
				},
				{
					...user,
					cron: IsNull(),
					canceled: IsNull(),
					executed: IsNull(),
					error: IsNull()
				}
			],
			order: {
				created: 'ASC'
			},
			relations: { executions: true, user: true }
		});
	}

	public static async getCompleted(userId?: string | undefined) {
		const user = userId ? { user: { userId } } : {};

		return TaskEntity.find({
			where: [
				{
					...user,
					executed: Not(IsNull())
				},
				{
					...user,
					error: Not(IsNull())
				}
			],
			order: {
				executed: 'ASC'
			},
			relations: { executions: true, user: true }
		});
	}

	public static toFormatted(task: TaskEntity): TaskStatus;
	public static toFormatted(tasks: TaskEntity[]): TaskStatus[];
	public static toFormatted(tasks: TaskEntity | TaskEntity[]): TaskStatus | TaskStatus[] {
		if (Array.isArray(tasks)) {
			return tasks.map((t) => TaskEntity.toFormatted(t));
		}
		let state: TaskStateType = TaskState.QUEUED;
		if (tasks.error || tasks.executions.find((e) => !!e.error)) {
			state = TaskState.ERROR;
		} else if (tasks.executed) {
			state = TaskState.COMPLETED;
		} else if (tasks.canceled) {
			state = TaskState.CANCELED;
		}

		return {
			userId: tasks.user.userId,
			type: tasks.type,
			data: tasks.data,
			state,
			completionDate: tasks.executed
		};
	}
}
