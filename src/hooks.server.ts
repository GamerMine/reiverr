import TypeOrm from '@reiverr/db';
import { initWorker } from '$lib/service/scheduler.server';
import { env } from '$env/dynamic/private';

TypeOrm.init({
	DB_TYPE: env.DB_TYPE,
	DB_HOST: env.DB_HOST,
	DB_PORT: Number.parseInt(env.DB_PORT),
	DB_USERNAME: env.DB_USERNAME,
	DB_PASSWORD: env.DB_PASSWORD,
	DB_DATABASE: env.DB_DATABASE
});
await TypeOrm.getDb();
initWorker();
