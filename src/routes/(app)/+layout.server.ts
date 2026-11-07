import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({
	locals: {
		user: { isOidc },
		settings,
		error
	}
}) => {
	return {
		settings,
		isOidc,
		error
	};
};
