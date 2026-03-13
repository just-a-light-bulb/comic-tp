<script lang="ts">
	import { chapterCards } from '$lib/mock/app-data';
	let { params } = $props();
</script>

<svelte:head>
	<title>Project detail</title>
</svelte:head>

<main class="md3-page">
	<section class="md3-content">
		<header class="md3-surface md3-header">
			<div>
				<h1 class="md3-title">Project #{params.pid}</h1>
				<p class="md3-subtitle">Chapter dashboard and translation status tracking.</p>
			</div>
			<div class="md3-actions">
				<a class="md3-chip" href={`/projects/${params.pid}/edit`}>Edit metadata</a>
				<a class="md3-link-button" href={`/projects/${params.pid}/chapters/new`}>New chapter</a>
			</div>
		</header>

		<section class="md3-grid">
			{#each chapterCards.filter((chapter) => String(chapter.projectId) === params.pid) as chapter}
				<a class="md3-card" href={`/projects/${params.pid}/chapters/${chapter.id}`}>
					<strong>Ch. {chapter.chapterNumber} · {chapter.title}</strong>
					<span class="md3-metric"
						>{chapter.translatedCount}/{chapter.pageCount} translated pages</span
					>
				</a>
			{/each}
		</section>
	</section>
</main>
