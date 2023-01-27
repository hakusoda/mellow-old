import { text } from '../response.ts';
import { command } from '../mod.ts';
export default command(() => text('roll.content', [Math.floor(Math.random() * 6) + 1]));