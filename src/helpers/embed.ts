// deno-lint-ignore-file no-inferrable-types
export function author(name: string, url?: string, icon_url?: string) {
	return { url, name, icon_url };
}

export function field(name: string, value: string, inline: boolean = false) {
	return { name, value, inline };
}

export function footer(text: string, icon_url?: string) {
	return { text, icon_url };
}

export function attachment(url: string, width?: number, height?: number) {
	return { url, width, height };
}