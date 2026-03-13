<svelte:head>
	<title>Create project</title>
</svelte:head>

<main class="md3-page">
	<section class="md3-content">
		<div class="md3-surface">
			<h1 class="md3-title">Create project</h1>
			<p class="md3-subtitle">Define source/target language and translation style presets.</p>
			<form class="md3-form">
				<label>
					Title
					<input placeholder="Project title" />
				</label>
				<label>
					Source language
					<select><option>JA</option><option>KO</option></select>
				</label>
				<label>
					Target language
					<select><option>TH</option><option>EN</option></select>
				</label>
				<label>
					Translation style
					<select><option>Natural</option><option>Formal</option><option>Literal</option></select>
				</label>
				<button class="md3-button" type="button">Create project</button>
			</form>
		</div>
	</section>
</main>
