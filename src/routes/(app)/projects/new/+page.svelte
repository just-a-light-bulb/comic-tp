<svelte:head>
	<title>Create project</title>
</svelte:head>

<main class="manga-page">
	<section class="manga-content">
		<div class="panel-frame">
			<h1 class="manga-title">Create project</h1>
			<p class="manga-subtitle">Define source/target language and translation style presets.</p>
			<form class="manga-form">
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
				<button class="btn-primary" type="button">Create project</button>
			</form>
		</div>
	</section>
</main>
