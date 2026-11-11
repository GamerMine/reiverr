import { DB_TYPE, DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE } from '$app/env/private';

import TypeOrm from '@unifarr/db';
import type { Handle, ServerInit } from '@sveltejs/kit/hooks';
import { getUser, isProtected } from '#lib/server/auth/auth.ts';
import { GlobalSettingsEntity, UserSettingsEntity } from '@unifarr/db/entities';
import { redirect } from '@sveltejs/kit';
import { defaultUserSettings } from './shared/db/src/types';

const databaseTypes = [
	'postgres',
	'aurora-postgres',
	'cockroachdb',
	'mariadb',
	'mysql',
	'aurora-mysql'
];

export const init: ServerInit = async () => {
	if (!databaseTypes.includes(DB_TYPE)) {
		throw new Error(`Invalid database type, possible types are: ${databaseTypes}`);
	}
	TypeOrm.init({
		DB_TYPE: DB_TYPE as
			'postgres' | 'aurora-postgres' | 'cockroachdb' | 'mariadb' | 'mysql' | 'aurora-mysql',
		DB_HOST,
		DB_PORT: Number.parseInt(DB_PORT),
		DB_USERNAME,
		DB_PASSWORD,
		DB_DATABASE
	});
	await TypeOrm.getDb();
	import('./tasksWorker/scheduler.server');
};

export const handle: Handle = async ({ event, resolve }) => {
	const globalSettings = await GlobalSettingsEntity.getClient();

	event.locals.settings = { globalSettings, userSettings: defaultUserSettings };

	if (globalSettings.jellyfin.baseUrl) {
		const user = await getUser(event.cookies);
		event.locals.user = user;

		if (!user.userId) {
			if (isProtected(event.url)) {
				if (event.isRemoteRequest) {
					await resolve(event);
				} else {
					redirect(302, '/auth/login');
				}
			}
		} else {
			const userSettings = await UserSettingsEntity.getUserSettings(user.userId);
			event.locals.settings.userSettings = userSettings;
		}
	} else if (event.url && !event.url.pathname.match(/^\/setup.*/) && event.isRemoteRequest) {
		return redirect(302, '/setup');
	}

	return await resolve(event);
};
