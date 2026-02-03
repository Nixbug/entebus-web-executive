/**
 * Tile Provider Store
 * Manages loading, saving, and accessing map tile providers.
 * Providers are loaded from both a built-in config file and user-saved providers in localStorage.
 */

import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import type { TileProvider } from '$lib/types/type';
import defaultProvidersConfig from '$lib/configs/tile-providers.json';

const STORAGE_KEY = 'userTileProviders';

/**
 * Load user-saved providers from localStorage
 */
function loadUserProviders(): TileProvider[] {
	if (!browser) return [];
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw) {
			const parsed = JSON.parse(raw);
			if (Array.isArray(parsed)) {
				return parsed.map((p) => ({
					name: p.name || 'Unnamed',
					url: p.url || '',
					attribution: p.attribution || '',
					maxZoom: p.maxZoom ?? 19,
					isBuiltIn: false
				}));
			}
		}
	} catch (e) {
		console.warn('[TileProviders] Failed to load user providers from localStorage:', e);
	}
	return [];
}

/**
 * Save user-added providers to localStorage
 */
function saveUserProviders(providers: TileProvider[]): void {
	if (!browser) return;
	try {
		// Only save non-built-in providers
		const userProviders = providers.filter((p) => !p.isBuiltIn);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(userProviders));
	} catch (e) {
		console.warn('[TileProviders] Failed to save user providers to localStorage:', e);
	}
}

/**
 * Load built-in providers from the config file
 */
function loadBuiltInProviders(): TileProvider[] {
	try {
		const config = defaultProvidersConfig as { providers?: TileProvider[] };
		if (config && Array.isArray(config.providers)) {
			return config.providers.map((p) => ({
				...p,
				isBuiltIn: true
			}));
		}
	} catch (e) {
		console.warn('[TileProviders] Failed to load built-in providers:', e);
	}
	// Fallback: return basic OSM if config fails
	return [
		{
			name: 'OpenStreetMap',
			url: '',
			attribution: '© OpenStreetMap contributors',
			maxZoom: 19,
			isBuiltIn: true
		}
	];
}

/**
 * Merge built-in and user providers, avoiding duplicates by name
 */
function mergeProviders(builtIn: TileProvider[], user: TileProvider[]): TileProvider[] {
	const merged: TileProvider[] = [...builtIn];
	const existingNames = new Set(builtIn.map((p) => p.name.toLowerCase()));

	for (const provider of user) {
		if (!existingNames.has(provider.name.toLowerCase())) {
			merged.push(provider);
			existingNames.add(provider.name.toLowerCase());
		}
	}

	return merged;
}

/**
 * Create the tile providers store
 */
function createTileProvidersStore() {
	const builtIn = loadBuiltInProviders();
	const user = loadUserProviders();
	const initial = mergeProviders(builtIn, user);

	const { subscribe, set, update } = writable<TileProvider[]>(initial);

	return {
		subscribe,

		/**
		 * Reload providers from config and localStorage
		 */
		reload: () => {
			const builtIn = loadBuiltInProviders();
			const user = loadUserProviders();
			set(mergeProviders(builtIn, user));
		},

		/**
		 * Add a new custom provider
		 */
		addProvider: (provider: Omit<TileProvider, 'isBuiltIn'>): boolean => {
			const current = get({ subscribe });
			const nameLower = provider.name.toLowerCase().trim();

			// Check for duplicate name
			if (current.some((p) => p.name.toLowerCase() === nameLower)) {
				return false;
			}

			const newProvider: TileProvider = {
				name: provider.name.trim(),
				url: provider.url.trim(),
				attribution: provider.attribution?.trim() || '',
				maxZoom: provider.maxZoom ?? 19,
				isBuiltIn: false
			};

			update((providers) => {
				const updated = [...providers, newProvider];
				saveUserProviders(updated);
				return updated;
			});

			return true;
		},

		/**
		 * Remove a custom provider by name (cannot remove built-in providers)
		 */
		removeProvider: (name: string): boolean => {
			const current = get({ subscribe });
			const provider = current.find((p) => p.name === name);

			if (!provider || provider.isBuiltIn) {
				return false;
			}

			update((providers) => {
				const updated = providers.filter((p) => p.name !== name);
				saveUserProviders(updated);
				return updated;
			});

			return true;
		},

		/**
		 * Update an existing custom provider
		 */
		updateProvider: (
			originalName: string,
			updates: Partial<Omit<TileProvider, 'isBuiltIn'>>
		): boolean => {
			const current = get({ subscribe });
			const idx = current.findIndex((p) => p.name === originalName);

			if (idx === -1 || current[idx].isBuiltIn) {
				return false;
			}

			// Check for name conflict if name is being changed
			if (updates.name && updates.name !== originalName) {
				const nameLower = updates.name.toLowerCase().trim();
				if (current.some((p, i) => i !== idx && p.name.toLowerCase() === nameLower)) {
					return false;
				}
			}

			update((providers) => {
				const updated = [...providers];
				updated[idx] = {
					...updated[idx],
					...updates,
					isBuiltIn: false
				};
				saveUserProviders(updated);
				return updated;
			});

			return true;
		},

		/**
		 * Import providers from a JSON file content
		 */
		importProviders: (jsonContent: string): { added: number; skipped: number } => {
			let added = 0;
			let skipped = 0;

			try {
				const parsed = JSON.parse(jsonContent);
				let items: any[] = [];

				if (Array.isArray(parsed)) {
					items = parsed;
				} else if (parsed && Array.isArray(parsed.providers)) {
					items = parsed.providers;
				} else if (parsed && parsed.name && parsed.url) {
					items = [parsed];
				}

				const current = get({ subscribe });

				for (const item of items) {
					if (!item || !item.name || typeof item.url !== 'string') {
						skipped++;
						continue;
					}

					const nameLower = item.name.toLowerCase().trim();
					if (current.some((p) => p.name.toLowerCase() === nameLower)) {
						skipped++;
						continue;
					}

					const newProvider: TileProvider = {
						name: item.name.trim(),
						url: item.url.trim(),
						attribution: item.attribution?.trim() || '',
						maxZoom: item.maxZoom ?? 19,
						isBuiltIn: false
					};

					update((providers) => {
						const updated = [...providers, newProvider];
						saveUserProviders(updated);
						return updated;
					});

					added++;
				}
			} catch (e) {
				console.warn('[TileProviders] Failed to parse import JSON:', e);
			}

			return { added, skipped };
		},

		/**
		 * Export all user-added providers as JSON string
		 */
		exportProviders: (): string => {
			const current = get({ subscribe });
			const userProviders = current
				.filter((p) => !p.isBuiltIn)
				.map((p) => ({
					name: p.name,
					url: p.url,
					attribution: p.attribution,
					maxZoom: p.maxZoom
				}));
			return JSON.stringify({ providers: userProviders }, null, 2);
		},

		/**
		 * Get a provider by name
		 */
		getProvider: (name: string): TileProvider | undefined => {
			const current = get({ subscribe });
			return current.find((p) => p.name === name);
		},

		/**
		 * Get the default provider (first built-in, typically OSM)
		 */
		getDefaultProvider: (): TileProvider => {
			const current = get({ subscribe });
			return (
				current.find((p) => p.isBuiltIn) || {
					name: 'OpenStreetMap',
					url: '',
					attribution: '© OpenStreetMap contributors',
					maxZoom: 19,
					isBuiltIn: true
				}
			);
		}
	};
}

export const tileProviders = createTileProvidersStore();
