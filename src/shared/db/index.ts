import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { GlobalSettingsEntity } from './entities/GlobalSettings.server';
import { UserSettingsEntity } from './entities/UserSettings.server';
import { FilteringProfilesEntity } from './entities/FilteringProfiles.server';
import { CustomFormatsEntity } from './entities/CustomFormats.server';
import { QualityProfilesEntity } from './entities/QualityProfiles.server';
import { TaskEntity } from './entities/Task.server';
import { TaskExecutionEntity } from './entities/TaskExecution.server';
import type { DbConfig } from './types';

class TypeOrm {
	private static config: DbConfig | undefined = undefined;
	private static instance: Promise<DataSource | null> | null = null;

	public static init(config: DbConfig) {
		TypeOrm.config = config;
	}

	public static getDb(): Promise<DataSource | null> {
		if (!TypeOrm.config) {
			throw new Error('Please initialize database config using TypeOrm.init()');
		}
		if (!TypeOrm.instance) {
			TypeOrm.instance = new DataSource({
				type: TypeOrm.config.DB_TYPE,
				host: TypeOrm.config.DB_HOST,
				port: TypeOrm.config.DB_PORT,
				username: TypeOrm.config.DB_USERNAME,
				password: TypeOrm.config.DB_PASSWORD,
				database: TypeOrm.config.DB_DATABASE,
				synchronize: true, // FIXME: Should not be used in production...
				entities: [
					GlobalSettingsEntity,
					UserSettingsEntity,
					FilteringProfilesEntity,
					CustomFormatsEntity,
					QualityProfilesEntity,
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
