import { DB_TYPE, DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE } from '$app/env/private';

import TypeOrm from '@reiverr/db';
import type { Handle, ServerInit } from '@sveltejs/kit/hooks';
import { assertUserAuth, getUser } from '#lib/server/auth/auth.ts';

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
	const user = await getUser(event.cookies);
	event.locals.user = user;

	await assertUserAuth(user, event.url, event.isRemoteRequest);

	return await resolve(event);
};
