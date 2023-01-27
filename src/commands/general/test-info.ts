import { text } from '../response.ts';
import { command } from '../mod.ts';
export default command(({ locale }) => text(`locale: ${locale}`));