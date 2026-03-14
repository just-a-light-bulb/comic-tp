<script lang="ts">
	import { chapterCards } from '$lib/mock/app-data';
	let { params } = $props();
</script>

<svelte:head>
	<title>Project detail</title>
</svelte:head>

<main class="manga-page">
	<section class="manga-content">
		<header class="manga-header">
			<div>
				<h1 class="manga-title">Project #{params.pid}</h1>
				<p class="manga-subtitle">Chapter dashboard and translation status tracking.</p>
			</div>
			<div class="manga-actions">
				<a class="btn-secondary" href={`/projects/${params.pid}/edit`}>Edit metadata</a>
				<a class="btn-primary" href={`/projects/${params.pid}/chapters/new`}>New chapter</a>
			</div>
		</header>

		<section class="manga-grid">
			{#each chapterCards.filter((chapter) => String(chapter.projectId) === params.pid) as chapter}
				<a class="manga-card" href={`/projects/${params.pid}/chapters/${chapter.id}`}>
					<strong>Ch. {chapter.chapterNumber} · {chapter.title}</strong>
					<span>{chapter.translatedCount}/{chapter.pageCount} translated pages</span>
				</a>
			{/each}
		</section>
	</section>
</main>
