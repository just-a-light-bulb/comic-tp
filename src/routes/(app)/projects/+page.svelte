<script lang="ts">
	import { projectCards } from '$lib/mock/app-data';
</script>

<svelte:head>
	<title>Projects</title>
</svelte:head>

<main class="md3-page">
	<section class="md3-content">
		<header class="md3-surface md3-header">
			<div>
				<h1 class="md3-title">Projects</h1>
				<p class="md3-subtitle">Track translation workspaces and chapter progress.</p>
			</div>
			<a class="md3-link-button" href="/projects/new">New project</a>
		</header>

		<section class="md3-grid">
			{#each projectCards as project}
				<a class="md3-card" href={`/projects/${project.id}`}>
					<strong>{project.title}</strong>
					<span>{project.sourceLang} → {project.targetLang}</span>
					<span class="md3-metric">{project.chapterCount} chapters</span>
				</a>
			{/each}
		</section>
	</section>
</main>
