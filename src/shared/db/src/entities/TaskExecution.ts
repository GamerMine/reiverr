import {
	BaseEntity,
	Column,
	CreateDateColumn,
	Entity,
	ManyToOne,
	PrimaryGeneratedColumn
} from 'typeorm';
import { TaskEntity } from './Task.js';

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

	@Column('timestamptz', { nullable: true })
	started: Date | null;

	@Column('timestamptz', { nullable: true })
	finished: Date | null;

	@Column('timestamptz', { nullable: true })
	canceled: Date | null;

	public static async get(uuid: string) {
		return await this.findOne({ where: { uuid }, relations: { task: true } });
	}
}
