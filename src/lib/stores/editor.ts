import { writable } from 'svelte/store';

export const activeRegionId = writable<string | null>(null);
