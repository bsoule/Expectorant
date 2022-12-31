/* The Expectorant website

This uses expectorant.js for the business logic and spinner.js for visually
spinning the spinner.
*/

const INITPROB = .5 // the probability the spinner is preloaded with

const VITTLES = [...shuffle([
  "five-spice fudge fajitas", // bluastelo
  "celery sundae", // bluastelo & danny
  "celeriac sundae", // bluastelo
  "nightshade nutmeg nachos", // bluastelo
  "marshmallow mustard muffins", // bluastelo
  "marshmallow mustard m&m muffins", // bluastelo
  "chili cheese cotton candy", // GPT
  "apple vanilla nachos", // bluastelo
  "chelation cheeze", // bluastelo
  "garlic fudge nachos", // bluastelo & danny
  "kraken quesadillas", // GPT
  "wasabi waffles", // GPT
  "banana and mustard sliders", // GPT
  "apple and liver pâté panini", // GPT
  "blueberry and beef jerky parfait", // GPT
  "tofu teriyaki tater tots", // GPT
  "crusty creamy croissant crumpet crumble", // bluastelo
  "cabbage kabobs", // danny
  "ketchup'n'mustard spaghetti ice cream", // cantor
  "deep fried mustard seed and cricket soup", // faire
  "lady'n'tramp spaghetti", // danny & cantor
  "peanut butter and jelly jalapeño jambalaya", // christopher
  "bubble gum and butter sauce buffalo wings", // christopher
  "pineapple pickle pizza", // christopher
  "deep-fried gazpacho", // danny
  "pickled mayonnaise lemonade", // melanie & eric
  "cucumber and chocolate chip cookies", // christopher
  "glazed eel partially dipped in white chocolate with ketchup", // ryan
  "flaming hot cheetos 'n' marshmallow fluff milkshake", // christopher
  "apple skin 'n' sugared watermelon tacos", // ryan
  "avocado and gummy bear salad", // christopher
  "lime peel and watermelon seed stir fry", // christopher
  "deep-fried green tea 'n' coca-cola gummies", // ryan
  "deep-fried beet-flavored twinkies", // ryan
]), "easter egg salad"]

let vindex = 0 // which vittle to use as an example in the instructions

const CLOG = console.log
const ASSERT = console.assert
function $(id) { return document.getElementById(id) } // to be jQuery-esque

let lastp = null    // Just some global variables to track the fraction of yeses
let yeses = 0       // for all the spins we've done since we last changed the
let trials = 0      // probability.

// Take a probability and a spin object, pick the winner and spin that puppy
function expectorize(spob) {
  $('theanswer').innerHTML = '&nbsp;'
  $('vittle').innerHTML = VITTLES[++vindex % VITTLES.length]
  $('audiotag1').play()
  spindraw(spob)
  const p = spob.slots[0].prob // probability for first slot ie YES
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
$('vittle').innerHTML = VITTLES[vindex]
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

function shuffle(l) {
  for (let i = l.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [l[i], l[j]] = [l[j], l[i]]
  }
  return l
}