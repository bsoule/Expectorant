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
  "banana n' mustard sliders", // GPT
  "apple n' liver pâté panini", // GPT
  "blueberry n' beef jerky parfait", // GPT
  "tofu teriyaki tater tots", // GPT
  "crusty creamy croissant crumpet crumble", // bluastelo
  "cabbage kabobs", // danny
  "ketchup n' mustard spaghetti ice cream", // cantor
  "deep fried mustard seed n' cricket soup", // faire
  "lady n' tramp spaghetti", // danny & cantor
  "peanut butter n' jelly jalapeño jambalaya", // christopher/GPT
  "bubble gum n' butter sauce buffalo wings", // christopher/GPT
  "pineapple pickle pizza", // christopher/GPT
  "deep-fried gazpacho", // danny
  "pickled mayonnaise lemonade", // melanie & eric
  "cucumber n' chocolate chip cookies", // christopher/GPT
  "glazed eel partially dipped in white chocolate with ketchup", // ryan
  "flaming hot cheetos n' marshmallow fluff milkshake", // christopher/GPT
  "apple skin n' sugared watermelon tacos", // ryan
  "avocado n' gummy bear salad", // christopher/GPT
  "lime peel n' watermelon seed stir fry", // christopher/GPT
  "deep-fried green tea n' coca-cola gummies", // ryan
  "deep-fried beet-flavored twinkies", // ryan
  // the following aren't in Faire's poll yet
  // https://forms.gle/QrRRuRm2PqH3U4KY6
  "jellyfish jelly doughnuts", // GPT
  "pickle n' potato chip milkshake", // GPT
  "honey mustard ice cream sundae", // GPT
  "chocolate-covered chicken nuggets", // GPT
  "bacon-wrapped pickle n' cream cheese bites", // GPT
  "sardine n' marshmallow kabobs", // GPT
  "peanut butter n' jelly milkshake", // GPT
  "cold beet with mustard ice cream soup", // dreiley, real thing
  "pulled pork n' mashed potato parfait", // the internet
  "avocado milkshake", // the internet
  "lobster ice cream", // the internet
  "mac n' cheetos", // real thing
  "marmite milkshake", // danny
]), "easter egg salad"]

let vindex = 0 // which vittle to use as an example in the instructions

const CLOG = console.log
const ASSERT = console.assert
function $(id) { return document.getElementById(id) } // to be jQuery-esque

let spincount = 0   // We show this under the input field
let lastp = null    // Just some global variables to track the fraction of yeses
let yeses = 0       // for all the spins we've done since we last changed the
let trials = 0      // probability.

// Take a probability and a spin object, pick the winner and spin that puppy
function expectorize(spob) {
  $('theanswer').innerHTML = '&nbsp;'
  $('counter').innerHTML = ++spincount
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
  
function expectorizeRepay(spob) {
  expectorize(spob)
}

document.addEventListener('DOMContentLoaded', () => { // -------- document-ready
$('expr').focus() // this can be annoying when developing cuz it steals focus
$('prob').innerHTML = INITPROB
$('vittle').innerHTML = VITTLES[vindex]
const spob = spinit(document.querySelector('#spinneroo'), genslots(INITPROB))
spindraw(spob)

function redrawSlots() {
  const p = probabilify($('expr').value)
  $('prob').innerHTML = roundp(p, 8) // max 17; make it big for debugging
  spob.slots = genslots(p)
  spindraw(spob)
}

// Update the slots and redraw the spinner on every keystroke in the input field
$('expr').addEventListener('input', e => {
  redrawSlots()
})

$('expectorize').addEventListener('click', e => expectorize(spob))
$('spinneroo')  .addEventListener('click', e => expectorize(spob))
$('expr').addEventListener('keyup', e => {
  if (e.key==="Enter") expectorize(spob)
})
$('expr').addEventListener('keydown', e => {
  if (e.metaKey && e.key === "Enter") expectorize(spob)
})

const fieldNames = ['expr-repay-note1', 'expr-repay-note2', 'expr-repay-owe']
fieldNames.forEach((fieldName) => {
  // Make any input update the main input field and redraw the spinner
  $(fieldName).addEventListener('input', e => {
    const notes = []
    if ($('expr-repay-note1').value) {
      notes.push($('expr-repay-note1').value)
    }
    if ($('expr-repay-note2').value) {
      notes.push($('expr-repay-note2').value)
    }
    if (notes.length == 2) {
      if (parseInt(notes[0]) > parseInt(notes[1])) {
        var swap = notes[0]
        notes[0] = notes[1]
        notes[1] = swap
      }

      // 8.27@5,20 means I owe 8.27 but have a $5 note and a $20 note
      $('expr').value = `${$('expr-repay-owe').value}@${notes[0]},${notes[1]}`
    } else {
      // 7/20 means I owe 7 but have a $20 note
      $('expr').value = `${$('expr-repay-owe').value}/${notes[0]}`
    }

    redrawSlots()
  })
  $(fieldName).addEventListener('keyup', e => {
    if (e.key==="Enter") expectorizeRepay(spob)
  })
  $(fieldName).addEventListener('keydown', e => {
    if (e.metaKey && e.key === "Enter") expectorizeRepay(spob)
  })
})

}) // ------------------------------------------------------- end document-ready

function shuffle(l) {
  for (let i = l.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [l[i], l[j]] = [l[j], l[i]]
  }
  return l
}
