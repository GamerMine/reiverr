import {
	BaseEntity,
	Column,
	CreateDateColumn,
	Entity,
	IsNull,
	Not,
	OneToMany,
	PrimaryGeneratedColumn
} from 'typeorm';
import { TaskExecutionEntity } from '$lib/entities/TaskExecution.server';
import type { MessageObject } from '$lib/types';
import { TaskType } from '$lib/service/scheduler.server';

@Entity({ name: 'tasks' })
export class TaskEntity extends BaseEntity {
	@PrimaryGeneratedColumn('uuid')
	uuid: string;

	@Column('enum', {
		enum: TaskType
	})
	type: TaskType;

	@Column('simple-json', { nullable: true })
	data: unknown | null;

	@Column('text', { nullable: true })
	cron: string | null;

	@CreateDateColumn()
	created: Date;

	@Column('date', { nullable: true })
	canceled: Date | null;

	@Column('date', { nullable: true })
	scheduled: Date | null;

	@Column('date', { nullable: true })
	executed: Date | null;

	@OneToMany(() => TaskExecutionEntity, (execution) => execution.task)
	executions: TaskExecutionEntity[];

	@Column('simple-json', { nullable: true })
	error: MessageObject | null;

	public static async get(uuid: string) {
		return TaskEntity.findOne({
			where: { uuid }
		});
	}

	public static async getPending() {
		return TaskEntity.find({
			where: [
				{
					cron: Not(IsNull()),
					canceled: IsNull()
				},
				{
					cron: IsNull(),
					canceled: IsNull(),
					executed: IsNull()
				}
			]
		});
	}

	public static async getRecurring() {
		return TaskEntity.find({
			where: {
				cron: Not(IsNull()),
				canceled: IsNull()
			}
		});
	}
}
