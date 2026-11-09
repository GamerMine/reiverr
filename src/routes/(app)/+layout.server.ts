import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({
	locals: {
		user: { isOidc },
		error
	}
}) => {
	return {
		isOidc,
		error
	};
};
