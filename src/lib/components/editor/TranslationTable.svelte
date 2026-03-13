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
								onclick={(event) => event.stopPropagation()}
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
								onclick={(event) => event.stopPropagation()}
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
		border-radius: 16px;
		overflow: hidden;
		background: #f3edf7;
	}

	.table-head {
		display: flex;
		justify-content: space-between;
		padding: 0.75rem 0.9rem;
		background: #e8def8;
		color: #1d192b;
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
		border-bottom: 1px solid rgb(121 116 126 / 24%);
		font-size: 0.85rem;
		vertical-align: top;
	}

	th {
		position: sticky;
		top: 0;
		background: #f8f2fb;
		color: #49454f;
		text-align: start;
	}

	tr {
		cursor: pointer;
	}

	tr.selected {
		background: rgb(103 80 164 / 14%);
	}

	textarea {
		width: 100%;
		min-height: 5rem;
		background: #e7e0ec;
		border: none;
		border-bottom: 2px solid #79747e;
		border-radius: 14px 14px 0 0;
		padding: 0.55rem;
		font: inherit;
	}

	textarea:focus-visible {
		outline: 2px solid #6750a4;
		outline-offset: 2px;
	}

	.chip {
		display: inline-flex;
		padding: 0.2rem 0.55rem;
		border-radius: 999px;
		background: #e8def8;
		font-weight: 600;
	}
</style>
