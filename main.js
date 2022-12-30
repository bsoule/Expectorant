/* The Expectorant website

This uses expectorant.js for the business logic and spinner.js for visually
spinning the spinner.
*/

const INITPROB = .5 // the probability the spinner is preloaded with

const VITTLES = [
  "easter egg salad",
  "5-spice fudge fajitas",
  "celeriac sundae",
  "celery sundae",
  "nightshade nutmeg nachos",
  "marshmallow mustard m&m muffins",
  "marshmallow mustard muffins",
  "apple vanilla nachos",
  "chelation cheeze",
  "garlic fudge nachos",
  "kraken quesadillas",
  "wasabi waffles",
  "banana and mustard sliders",
  "apple and liver pâté panini",
  "blueberry and beef jerky parfait",
  "tofu teriyaki tater tots",
  "crusty creamy croissant crumpet crumble",
]

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
  
document.addEventListener('DOMContentLoaded', () => { // -------- document-ready

$('expr').focus() // this can be annoying when developing cuz it steals focus
$('prob').innerHTML = INITPROB
$('vittle').innerHTML = spinpick(VITTLES)
const spob = spinit(document.querySelector('#spinneroo'), genslots(INITPROB))
spindraw(spob)
  
// Update the slots and redraw the spinner on every keystroke in the input field
$('expr').addEventListener('input', e => {
  const p = probabilify(e.target.value)
  $('prob').innerHTML = roundp(p, 8) // max 17; make it big for debugging
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

}) // ------------------------------------------------------- end document-ready
