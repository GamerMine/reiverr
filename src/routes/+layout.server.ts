import { Settings } from '$lib/entities/Settings.server';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
	const settings = await Settings.getClient();

	return {
		settings
	};
};
