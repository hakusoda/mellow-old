import { serve } from 'sift';

import logging from './logging.ts';
import interactions from './interactions.ts';
import signupFinish from './signup-finish.ts';
serve({
	'/logging': logging,
	'/interactions': interactions,
	'/signup-finished': signupFinish
});

export function json(data: any, status: number = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'content-type': 'application/json' }
	});
}

export function status(status: number = 200) {
	return new Response(undefined, { status });
}

export function error(message: string, status: number) {
	return json({ error: true, message }, status);
}