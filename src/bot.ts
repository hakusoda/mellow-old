import { startBot, createBot } from 'discordeno';
const bot = createBot({
	token: Deno.env.get("DISCORD_TOKEN")!,
	//intents: Intents.Guilds | Intents.GuildMessages,
	events: {
		
	}
});

await startBot(bot);
export default bot;