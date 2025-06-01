import { Settings } from '$lib/entities/Settings.server';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
	return json(await Settings.getClient());
};

export const POST: RequestHandler = async ({ request }) => {
	const values = await request.json();
	return json(await Settings.set('default', values));
};
