<script lang="ts">
	import { activeRegionId } from '$lib/stores/editor';
	import type { TextRegion } from './types';

	interface Props {
		regions: TextRegion[];
		onUpdateRegion: (regionId: string, patch: Partial<TextRegion>) => void;
	}

	let { regions, onUpdateRegion }: Props = $props();
	let selectedId = $state<string | null>(null);

	$effect(() => {
		const unsubscribe = activeRegionId.subscribe((regionId) => {
			selectedId = regionId;
		});
		return () => unsubscribe();
	});
</script>

<div class="table-shell">
	<div class="table-head">
		<strong>Translation Script</strong>
		<span>{regions.length} regions</span>
	</div>
	<div class="table-scroll">
		<table>
			<thead>
				<tr>
					<th>ID</th>
					<th>Source</th>
					<th>Target</th>
					<th>Conf.</th>
					<th>OK</th>
				</tr>
			</thead>
			<tbody>
				{#each regions as region (region.id)}
					<tr
						class:selected={selectedId === region.id}
						onclick={() => activeRegionId.set(region.id)}
					>
						<td>#{region.bubbleIndex}</td>
						<td>{region.originalText}</td>
						<td>
							<textarea
								value={region.translatedText}
								onclick={(event) => {
									event.stopPropagation();
									activeRegionId.set(region.id);
								}}
								oninput={(event) =>
									onUpdateRegion(region.id, {
										translatedText: (event.currentTarget as HTMLTextAreaElement).value
									})}
							></textarea>
						</td>
						<td><span class="chip">{region.confidence}%</span></td>
						<td>
							<input
								type="checkbox"
								checked={region.isApproved}
								onclick={(event) => {
									event.stopPropagation();
									activeRegionId.set(region.id);
								}}
								onchange={(event) =>
									onUpdateRegion(region.id, {
										isApproved: (event.currentTarget as HTMLInputElement).checked
									})}
							/>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<style>
	.table-shell {
		height: 100%;
		display: grid;
		grid-template-rows: auto 1fr;
		border-radius: 0;
		overflow: hidden;
		background: var(--panel-light);
		border: 2px solid var(--border-line);
	}

	.table-head {
		display: flex;
		justify-content: space-between;
		padding: 0.75rem 0.9rem;
		background: var(--manga-navy);
		color: var(--cream-paper);
		font-family: 'Shippori Mincho B1', serif;
		font-size: 0.95rem;
	}

	.table-scroll {
		overflow: auto;
	}

	table {
		width: 100%;
		border-collapse: separate;
		border-spacing: 0;
	}

	th,
	td {
		padding: 0.6rem;
		border-bottom: 1px solid var(--border-line);
		font-size: 0.85rem;
		vertical-align: top;
	}

	th {
		position: sticky;
		top: 0;
		background: var(--panel-light);
		color: var(--ink-muted);
		text-align: start;
		font-family: 'DM Mono', monospace;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	tr {
		cursor: pointer;
	}

	tr.selected {
		background: rgba(192, 57, 43, 0.15);
		border-left: 3px solid var(--panel-red);
	}

	tr:nth-child(even) {
		background: var(--cream-paper);
	}

	tr:hover {
		background: rgba(212, 168, 83, 0.1);
	}

	textarea {
		width: 100%;
		min-height: 5rem;
		background: var(--cream-paper);
		border: 2px solid var(--border-line);
		border-radius: 0;
		padding: 0.55rem;
		font: inherit;
		font-family: 'Noto Serif', 'Noto Serif Thai', serif;
	}

	textarea:focus-visible {
		outline: 2px solid var(--panel-red);
		outline-offset: 2px;
		border-color: var(--panel-red);
	}

	.chip {
		display: inline-flex;
		padding: 0.2rem 0.55rem;
		border-radius: 0;
		background: var(--manga-navy);
		color: var(--cream-paper);
		font-family: 'DM Mono', monospace;
		font-size: 0.75rem;
	}
</style>
