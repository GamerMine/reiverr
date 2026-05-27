import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { GlobalSettingsEntity } from './entities/GlobalSettings.server';
import { UserSettingsEntity } from '$lib/entities/UserSettings.server';
import { FilteringProfilesEntity } from '$lib/entities/FilteringProfiles.server';
import { TaskEntity } from '$lib/entities/Task.server';
import { TaskExecutionEntity } from '$lib/entities/TaskExecution.server';
import { CustomFormatsEntity } from '$lib/entities/CustomFormats.server';
import { env } from '$env/dynamic/private';

class TypeOrm {
	private static instance: Promise<DataSource | null> | null = null;
	public static getDb(): Promise<DataSource | null> {
		if (!TypeOrm.instance) {
			TypeOrm.instance = new DataSource({
				// @ts-expect-error: Variable from environment
				type: env.DB_TYPE,
				host: env.DB_HOST,
				// @ts-expect-error: Variable from environment
				port: env.DB_PORT,
				username: env.DB_USERNAME,
				password: env.DB_PASSWORD,
				database: env.DB_DATABASE,
				synchronize: true, // FIXME: Should not be used in production...
				entities: [
					GlobalSettingsEntity,
					UserSettingsEntity,
					FilteringProfilesEntity,
					CustomFormatsEntity,
					TaskEntity,
					TaskExecutionEntity
				],
				logging: false
			})
				.initialize()
				.then((fulfilled) => {
					console.log('Data Source has been initialized!');
					return fulfilled;
				})
				.catch((err) => {
					console.error('Error during Data Source initialization', err);
					return null;
				});
		}
		return TypeOrm.instance;
	}
}

export default TypeOrm;
