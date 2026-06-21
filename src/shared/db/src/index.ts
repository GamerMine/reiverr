import 'reflect-metadata';
import { DataSource, type DataSourceOptions } from 'typeorm';
import { GlobalSettingsEntity } from './entities/GlobalSettings.js';
import { UserSettingsEntity } from './entities/UserSettings.js';
import { FilteringProfilesEntity } from './entities/FilteringProfiles.js';
import { CustomFormatsEntity } from './entities/CustomFormats.js';
import { QualityProfilesEntity } from './entities/QualityProfiles.js';
import { TaskEntity } from './entities/Task.js';
import { TaskExecutionEntity } from './entities/TaskExecution.js';
import type { DbConfig } from './types.js';

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
		if (!TypeOrm.config.DB_TYPE) {
			throw new Error(`Unknown database type: ${TypeOrm.config.DB_TYPE}`);
		}
		if (!TypeOrm.instance) {
			TypeOrm.instance = new DataSource({
				type: TypeOrm.config.DB_TYPE as DataSourceOptions['type'],
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
			} as DataSourceOptions)
				.initialize()
				.then((fulfilled) => {
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
