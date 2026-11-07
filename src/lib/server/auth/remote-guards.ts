import { command, form, getRequestEvent, query } from '$app/server';
import { error } from '@sveltejs/kit';

function requireUser() {
	const {
		locals: { user }
	} = getRequestEvent();

	if (!user.userId) error(401, 'general.connectionRequired');
	return user;
}

function requireAdmin() {
	const user = requireUser();

	if (!user.isAdmin) error(403, 'general.unauthorizedAction');
	return user;
}

/**
 * Wraps the handler (always the last argument of a remote function factory)
 * so that `check` runs before it, on every call.
 */
function guard(check: () => void, args: unknown[]): unknown[] {
	const handler = args[args.length - 1] as (...a: unknown[]) => unknown;

	return [
		...args.slice(0, -1),
		(...a: unknown[]) => {
			check();
			return handler(...a);
		}
	];
}

/* eslint-disable @typescript-eslint/no-explicit-any */
// The wrappers keep the exact signatures of the SvelteKit factories.

export const protectedQuery = ((...args: unknown[]) =>
	(query as any)(...guard(requireUser, args))) as unknown as typeof query;

export const protectedQueryLive = ((...args: unknown[]) =>
	(query.live as any)(...guard(requireUser, args))) as unknown as typeof query.live;

export const protectedCommand = ((...args: unknown[]) =>
	(command as any)(...guard(requireUser, args))) as unknown as typeof command;

export const protectedForm = ((...args: unknown[]) =>
	(form as any)(...guard(requireUser, args))) as unknown as typeof form;

export const adminQuery = ((...args: unknown[]) =>
	(query as any)(...guard(requireAdmin, args))) as unknown as typeof query;

export const adminQueryLive = ((...args: unknown[]) =>
	(query.live as any)(...guard(requireAdmin, args))) as unknown as typeof query.live;

export const adminCommand = ((...args: unknown[]) =>
	(command as any)(...guard(requireAdmin, args))) as unknown as typeof command;

export const adminForm = ((...args: unknown[]) =>
	(form as any)(...guard(requireAdmin, args))) as unknown as typeof form;
