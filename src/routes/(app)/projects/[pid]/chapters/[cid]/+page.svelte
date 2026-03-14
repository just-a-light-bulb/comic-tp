<script lang="ts">
	import { chapterPages } from '$lib/mock/app-data';
	let { params } = $props();
</script>

<svelte:head>
	<title>Chapter dashboard</title>
</svelte:head>

<main class="manga-page">
	<section class="manga-content">
		<header class="manga-header">
			<div>
				<h1 class="manga-title">Chapter #{params.cid}</h1>
				<p class="manga-subtitle">Thumbnail grid with page statuses and editor shortcuts.</p>
			</div>
			<div class="manga-actions">
				<button class="btn-secondary" type="button">Batch process</button>
				<a class="btn-primary" href={`/projects/${params.pid}/chapters/${params.cid}/edit`}
					>Edit chapter</a
				>
			</div>
		</header>

		<section class="manga-grid">
			{#each chapterPages.filter((page) => String(page.chapterId) === params.cid) as page}
				<a class="manga-card" href={`/editor/${page.id}`}>
					<img class="manga-thumbnail" src={page.imageUrl} alt="Page thumbnail" />
					<strong>Page {page.pageNumber}</strong>
					<span class="status-badge status-badge--{page.status}">{page.status}</span>
				</a>
			{/each}
		</section>
	</section>
</main>
