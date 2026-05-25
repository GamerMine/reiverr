import TypeOrm from '$lib/db';
import 'reflect-metadata';
import {initWorker} from "$lib/service/scheduler.server";

await TypeOrm.getDb();
initWorker()