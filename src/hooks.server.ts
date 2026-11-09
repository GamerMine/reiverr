import { DB_TYPE, DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE } from '$app/env/private';

import TypeOrm from '@reiverr/db';
import type { Handle, ServerInit } from '@sveltejs/kit/hooks';
import { getUser, guestUser, isProtected } from '#lib/server/auth/auth.ts';
import { GlobalSettingsEntity, UserSettingsEntity } from '@reiverr/db/entities';
import { redirect } from '@sveltejs/kit';
import { defaultUserSettings } from '@reiverr/db/types';
import Logger from '@reiverr/logging';
import { LogLevel } from '@reiverr/logging';
import { getUserSettings } from '#lib/remote/settings.remote.ts';

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

const LOGGER = Logger.getLogger('Filter');

export const handle: Handle = async ({ event, resolve }) => {
	const globalSettings = await GlobalSettingsEntity.getClient();

	event.locals.user = guestUser();
	event.locals.settings = { globalSettings, userSettings: defaultUserSettings };

	if (globalSettings.jellyfin.baseUrl) {
		const user = await getUser(event.cookies);
		event.locals.user = user;

		if (!user.userId) {
			if (isProtected(event.url)) {
				if (event.isRemoteRequest) {
					return await resolve(event);
				} else {
					LOGGER.log(LogLevel.INFO, 'User is not logged in: redirected to login page');
					return redirect(302, '/auth/login');
				}
			} else {
				return await resolve(event);
			}
		} else {
			await getUserSettings();
			return await resolve(event);
		}
	} else if (event.url && !event.url.pathname.match(/^\/setup.*/) && !event.isRemoteRequest) {
		LOGGER.log(LogLevel.INFO, 'Server is not configured: redirected to setup page');
		return redirect(302, '/setup');
	} else {
		return await resolve(event);
	}
};
