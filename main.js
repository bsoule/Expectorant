// -----------------------------------------------------------------------------
const INITPROB = .5 // the probability the spinner is preloaded with

const CLOG = console.log
const ASSERT = console.assert
function $(id) { return document.getElementById(id) } // to be jQuery-esque

let lastp = null    // Just some global variables to track the fraction of yeses
let yeses = 0       // for all the spins we've done since we last changed the
let trials = 0      // probability.

// Take a probability and a spin object, pick the winner and spin that puppy
function expectorize(spob) {
  $('audiotag1').play()
  spindraw(spob)
  const p = spob.slots[0].weight // probability for first slot ie YES
  //CLOG("WARNING: Flipped the probs from [p,1-p] to [1-p,p] for testing!")
  const windex = spinpick([0, 1], [p, 1-p]) // land on slot 0 with probability p
  if (p === lastp) {
    yeses += windex === 0 ? 1 : 0
    trials += 1
  } else { 
    lastp = p
    yeses = windex === 0 ? 1 : 0
    trials = 1 
  }
  CLOG(`🥁 Gonna land on slot ${windex} ie ${['YES','NO'][windex]} ` +
    `bringing us to ` + 
    `${yeses}/${trials} = ${percentify(yeses/trials)} yeses so far w/ p=${p}`)
  spingo(spob, windex)
}
  
document.addEventListener('DOMContentLoaded', () => {          // document-ready

$('expr').focus()
$('prob').innerHTML = INITPROB
const spob = spinit(document.querySelector('#spinneroo'), genslots(INITPROB))
spindraw(spob)
  
// Update the slots and redraw the spinner on every keystroke in the input field
$('expr').addEventListener('input', e => {
  const p = parsefrac(desugar(e.target.value))
  // avoid rounding to exactly 0 or 1:
  $('prob').innerHTML = conservaround(p, 1e-8, p<1e-8 ? +1 : p>1-1e-8 ? -1 : 0)
  spob.slots = genslots(p)
  spindraw(spob)
})

$('expectorize').addEventListener('click', e => expectorize(spob))
$('spinneroo')  .addEventListener('click', e => expectorize(spob))
$('expr').addEventListener('keyup', e => {
  if (e.key==="Enter") expectorize(spob)
})
$('expr').addEventListener('keydown', e => {
  if (e.metaKey && e.key === "Enter") expectorize(spob)
})

})                                                         // end document-ready
// -----------------------------------------------------------------------------
