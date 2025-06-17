import { GlobalSettingsEntity } from '$lib/entities/GlobalSettings.server';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
	return json(await GlobalSettingsEntity.getClient());
};

export const POST: RequestHandler = async ({ request }) => {
	const values = await request.json();
	return json(await GlobalSettingsEntity.set('default', values));
};
