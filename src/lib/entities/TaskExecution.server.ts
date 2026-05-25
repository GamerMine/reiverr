import {
	BaseEntity,
	Column,
	CreateDateColumn,
	Entity,
	ManyToOne,
	PrimaryGeneratedColumn
} from 'typeorm';
import { TaskEntity } from './Task.server';
import type { MessageObject } from '$lib/types';

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

	@CreateDateColumn({ nullable: true })
	started: Date | null;

	@CreateDateColumn({ nullable: true })
	finished: Date | null;

	@CreateDateColumn({ nullable: true })
	canceled: Date | null;

	@Column('simple-json', { nullable: true })
	error: MessageObject | null;
}
