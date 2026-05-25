import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { GlobalSettingsEntity } from './entities/GlobalSettings.server';
import { UserSettingsEntity } from '$lib/entities/UserSettings.server';
import {FilteringProfilesEntity} from "$lib/entities/FilteringProfiles.server";
import {CustomProfilesEntity} from "$lib/entities/CustomProfiles.server";

// FIXME: Should not be used in production...

class TypeOrm {
	private static instance: Promise<DataSource | null> | null = null;
	public static getDb(): Promise<DataSource | null> {
		if (!TypeOrm.instance) {
			TypeOrm.instance = new DataSource({
				type: 'better-sqlite3',
				database: 'config/reiverr.sqlite',
				synchronize: true,
				entities: [GlobalSettingsEntity, UserSettingsEntity, FilteringProfilesEntity, CustomProfilesEntity],
				logging: false,
			})
				.initialize()
				.then((fulfilled) => {
					console.info('Data Source has been initialized!');
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
