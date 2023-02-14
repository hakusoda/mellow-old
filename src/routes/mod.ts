import { serve } from 'sift';
import interactions from './interactions.ts';

serve({
	'/interactions': interactions
});

// deno-lint-ignore no-explicit-any no-inferrable-types
export function json(data: any, status: number = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'content-type': 'application/json' }
	});
}

export function error(message: string, status: number) {
	return json({ error: true, message }, status);
}