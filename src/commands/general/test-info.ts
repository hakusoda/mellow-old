import { text } from '../response.ts';
import { command } from '../mod.ts';
export default command(({ locale }) => {
	console.log(Deno.env.toObject());
	return text(`locale: ${locale}\ndeployment: ${Deno.env.get('DENO_DEPLOYMENT_ID')}`);
});