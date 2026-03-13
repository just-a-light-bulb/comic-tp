<script lang="ts">
	import { chapterPages } from '$lib/mock/app-data';
	let { params } = $props();
</script>

<svelte:head>
	<title>Chapter dashboard</title>
</svelte:head>

<main class="md3-page">
	<section class="md3-content">
		<header class="md3-surface md3-header">
			<div>
				<h1 class="md3-title">Chapter #{params.cid}</h1>
				<p class="md3-subtitle">Thumbnail grid with page statuses and editor shortcuts.</p>
			</div>
			<div class="md3-actions">
				<button class="md3-chip" type="button">Batch process</button>
				<a class="md3-link-button" href={`/projects/${params.pid}/chapters/${params.cid}/edit`}
					>Edit chapter</a
				>
			</div>
		</header>

		<section class="md3-grid">
			{#each chapterPages.filter((page) => String(page.chapterId) === params.cid) as page}
				<a class="md3-card" href={`/editor/${page.id}`}>
					<img class="md3-thumb" src={page.imageUrl} alt="Page thumbnail" />
					<strong>Page {page.pageNumber}</strong>
					<span class="md3-chip">{page.status}</span>
				</a>
			{/each}
		</section>
	</section>
</main>
