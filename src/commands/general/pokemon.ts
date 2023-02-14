// deno-lint-ignore-file ban-types
import { embed2 } from '../../helpers/interaction.ts';
import { command } from '../mod.ts';
import { author, attachment } from '../../helpers/embed.ts';
export default command(async ({ t }) => {
	let id = Math.floor(Math.random() * 1279) + 1;
	if (id > 1008)
		id += 8992;

	const data: Pokemon = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then(r => r.json());
	return embed2(data.name, t('pokemon.embed.summary', [data]), {
		image: attachment(data.sprites.other['official-artwork'].front_default),
		author: author(t('pokemon.embed.id', [data])),
		thumbnail: attachment(data.sprites.front_default)
	});
});

export interface Pokemon {
	id: number
	name: string
	forms: {}[]
	moves: {}[]
	stats: {}[]
	types: {
		slot: number
		type: {
			url: string
			name: string
		}
	}[]
	order: number
	height: number
	weight: number
	species: {
		url: string
		name: string
	}
	sprites: {
		other: {
			'official-artwork': {
				front_shiny: string
				front_default: string
			}
		}
		back_shiny: string
		front_shiny: string
		back_female?: string
		back_default: string
		front_female?: string
		front_default: string
		back_shiny_female?: string
		front_shiny_female?: string
	}
	abilities: {}[]
	past_types: {}[]
	held_items: {}[]
	is_default: boolean
	game_indices: {}[]
	base_experience: number
	location_area_encounters: string
}