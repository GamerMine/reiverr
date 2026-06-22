import {
	BaseEntity,
	Column,
	CreateDateColumn,
	Entity,
	ManyToOne,
	PrimaryGeneratedColumn
} from 'typeorm';
import { TaskEntity } from './Task.js';
import type { MessageObject } from '../types.js';

@Entity({ name: 'taskExecutions' })
export class TaskExecutionEntity extends BaseEntity {
	@PrimaryGeneratedColumn('uuid')
	uuid: string;

	@ManyToOne(() => TaskEntity, (recurringTask) => recurringTask.executions)
	task: TaskEntity;

	@Column('simple-json', { nullable: true })
	data: unknown | null;

	@CreateDateColumn()
	created: Date;

	@Column('date', { nullable: true })
	started: Date | null;

	@Column('date', { nullable: true })
	finished: Date | null;

	@Column('date', { nullable: true })
	canceled: Date | null;

	@Column('simple-json', { nullable: true })
	error: MessageObject | null;

	public static async get(uuid: string) {
		return await this.findOne({ where: { uuid }, relations: { task: true } });
	}
}
