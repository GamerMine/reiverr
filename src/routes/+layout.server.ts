import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({
	locals: {
		user: { isOidc },
		settings
	}
}) => {
	return {
		settings,
		isOidc,
		error: undefined
	};
};
