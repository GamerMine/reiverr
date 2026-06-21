import { env } from '$env/dynamic/private';
import TypeOrm from '@reiverr/db';

const databaseTypes = [
	'postgres',
	'aurora-postgres',
	'cockroachdb',
	'mariadb',
	'mysql',
	'aurora-mysql'
];
if (!databaseTypes.includes(env.DB_TYPE)) {
	throw new Error(`Invalid database type, possible types are: ${databaseTypes}`);
}
TypeOrm.init({
	DB_TYPE: env.DB_TYPE as
		| 'postgres'
		| 'aurora-postgres'
		| 'cockroachdb'
		| 'mariadb'
		| 'mysql'
		| 'aurora-mysql',
	DB_HOST: env.DB_HOST,
	DB_PORT: Number.parseInt(env.DB_PORT),
	DB_USERNAME: env.DB_USERNAME,
	DB_PASSWORD: env.DB_PASSWORD,
	DB_DATABASE: env.DB_DATABASE
});
await TypeOrm.getDb();
import('./tasksWorker/scheduler.server');
