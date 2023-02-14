import { serve } from 'sift';
import interactions from './interactions.ts';

serve({
	'/interactions': interactions
});