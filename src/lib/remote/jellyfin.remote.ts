import { getRequestEvent, query } from '$app/server';
import { assertUserAuth } from '$lib/server/utils.server';
import { BaseSync } from '$lib/server/tasks/baseSync.server';

export const jellyfinGetItems = query(async () => {
	const { cookies } = getRequestEvent();
	const userId = await assertUserAuth(cookies);
	if (!userId) return { success: false, error: 'general.connectionRequired' };

	return {
		success: true,
		data: (await (await BaseSync.getInstance()).jellyfinConnector.getItems(userId)).data?.Items
	};
});
