import './styles.css'

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('Missing #app root')
}

app.innerHTML = `
  <main class="shell">
    <section class="viewport" aria-label="game map">
      <div class="grid">
        <div class="base player">HQ</div>
        <div class="ore">Ore</div>
        <div class="unit">Scout</div>
        <div class="base enemy">AI</div>
      </div>
    </section>
    <aside class="panel">
      <h1>Command Grid</h1>
      <p>Original browser RTS prototype scaffold.</p>
      <dl>
        <div><dt>Credits</dt><dd>500</dd></div>
        <div><dt>Power</dt><dd>Stable</dd></div>
        <div><dt>Units</dt><dd>1</dd></div>
      </dl>
      <button type="button">Build Refinery</button>
      <button type="button">Train Scout</button>
    </aside>
  </main>
`
