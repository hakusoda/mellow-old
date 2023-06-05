import { serve } from 'sift';
import interactions from './interactions.ts';
import signupFinish from './signup-finish.ts';

serve({
	'/interactions': interactions,
	'/signup-finished': signupFinish
});

export function json(data: any, status: number = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'content-type': 'application/json' }
	});
}

export function error(message: string, status: number) {
	return json({ error: true, message }, status);
}