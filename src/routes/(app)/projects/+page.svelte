<script lang="ts">
	import { projectCards } from '$lib/mock/app-data';
</script>

<svelte:head>
	<title>Projects</title>
</svelte:head>

<main class="manga-page">
	<section class="manga-content">
		<header class="manga-header">
			<div>
				<h1 class="manga-title">Projects</h1>
				<p class="manga-subtitle">Track translation workspaces and chapter progress.</p>
			</div>
			<a class="btn-primary" href="/projects/new">New project</a>
		</header>

		<section class="manga-grid">
			{#each projectCards as project}
				<a class="manga-card" href={`/projects/${project.id}`}>
					<strong>{project.title}</strong>
					<span class="lang-pair">{project.sourceLang} → {project.targetLang}</span>
					<span>{project.chapterCount} chapters</span>
				</a>
			{/each}
		</section>
	</section>
</main>
