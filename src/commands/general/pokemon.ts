// deno-lint-ignore-file ban-types
import { command } from '../mod.ts';
export default command(async () => {
	let id = Math.floor(Math.random() * 1279) + 1;
	if (id > 1008)
		id += 8992;

	const data: Pokemon = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then(r => r.json());
	return {
		embeds: [{
			title: data.name,
			description: `it is a ${data.types[0].type.name} type with ${data.abilities.length} abilities`,
			author: {
				name: `number ${id}`
			},
			image: {
				url: data.sprites.other['official-artwork'].front_default
			},
			thumbnail: {
				url: data.sprites.front_default
			}
		}]
	};
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