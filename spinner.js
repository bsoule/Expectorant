// -----------------------------------------------------------------------------
const max = Math.max
const min = Math.min
const abs = Math.abs
const sin = Math.sin
const cos = Math.cos
const TAU = 2*Math.PI

// Shortcut to get the best animationFrame function
window.requestAnimFrame = (function() {
  return window.requestAnimationFrame       ||
         window.webkitRequestAnimationFrame ||
         window.mozRequestAnimationFrame    ||
         function(callback) { window.setTimeout(callback, 1000 / 60) }
})()

// Javascript's % operator is not actually mod but remainder so we have to
// force it to be positive. We use this to keep degrees in [0, 360).
function mod(x, m) { return (x % m + m) % m }

// Convert Polar to Cartesian coordinates
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = (angleInDegrees-90) * TAU / 360.0
  return { x: centerX + (radius * cos(angleInRadians)),
           y: centerY + (radius * sin(angleInRadians)) }
}

// Draw a pie slice that is one section of the spinner
function arcPath(x, y, radius, endradius, startAngle, endAngle) {
  const start  = polarToCartesian(x, y, radius, endAngle)
  const end    = polarToCartesian(x, y, radius, startAngle)
  const start2 = polarToCartesian(x, y, endradius, endAngle)
  const end2   = polarToCartesian(x, y, endradius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1"
  ASSERT(!isNaN(start.x), `start.x is NaN: ${start.x}`)
  return [
    "M", start.x, start.y, 
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    "L", end2.x, end2.y,
    "A", endradius, endradius, 0, largeArcFlag, 1, start2.x, start2.y,
    "Z",
  ].join(' ')
}

/* 
The following describes motion as a function of time, t, such that the
distance is 0 when t=0 and is B when t=T:

DIST:      (2*T*t - t^2) * B/T^2
SPEED:     2*B*(T-t)/T^2
INITSPEED: 2*B/T          (that's twice the average speed of B/T)

In other words, the speed drops linearly over an amount of time T covering a 
distance B. That's what a projectile thrown in the air does as it comes to a 
stop at the apex due to gravity.

But the following may be more suspenseful, with the spinner asymptotically 
coming to rest but never quite doing so, until the movement is imperceptible:

DIST:      B*(1 - d^(t/T))
SPEED:     -B/T * log(d) * d^(t/T)
INITSPEED: -B * log(d) / T

where d>0 is a parameter giving the tolerance -- something like 0.01 -- for how
close to B the distance function gets by time T. In other words, d is like the
tolerance on what counts as stopped.


And for posterity, here's a sine-based easing function we found on the internet
but it's pretty annoying to work with:

function computeRotation(duration, startTime, startSpeed, currentTime) {
  const t = currentTime - startTime
  return startSpeed * 
    (duration*cos(TAU/4 * t / duration)/(TAU/4) + duration + t) - 
      startSpeed * duration * (4/TAU + 1)
}

function computeSpeed(duration, startTime, startSpeed, currentTime) {
  const t = currentTime - startTime
  return -cos((1 - t/duration) * TAU/4) * startSpeed + startSpeed
}
*/

// Stop a tiny bit before the real target so it snaps into place?
function computeTotalRotation(duration, startTime, startSpeed) {
  const currentTime = startTime + duration - 0.01
  return computeRotation(duration, startTime, startSpeed, currentTime)
}

// Compute rotation as a function of current time
function computeRotation(duration, startTime, startSpeed, currentTime) {
  const t = currentTime - startTime
  return -startSpeed/(2.5*duration)*(t-duration)**2 + startSpeed*duration/2.5

  const T = duration
  const B = startSpeed*T/2 // implies startSpeed = 2*B/T
  return (2*T*t - t**2) * B/T**2
  // ORIG: -startSpeed/(2.5*duration)*(t-duration)**2 + startSpeed*duration/2.5
}

// I'm confused; time as a function of distance should be messier than this...
function computeTimeFromRotation(duration, startSpeed, rotation) {
  return 2.5*rotation / startSpeed

  const T = duration
  const B = startSpeed*T/2
  return T + T/B*Math.sqrt(B*(B-rotation))
  // ORIG: 2.5*rotation / startSpeed
}

// Derivative of the distance function
function computeSpeed(duration, startTime, startSpeed, currentTime) {
  const t = currentTime - startTime
  return 0.8 * startSpeed * (duration - t) / duration
  
  const T = duration
  const B = startSpeed*T/2
  return 2*B*(T-t)/T**2
  // ORIG: 0.8 * startSpeed * (duration - t) / duration
}

// Execute the animation frame using css
function spin_anim(spin) {
  if (spin.speed < 0.01) { setTimeout(spin_stop(spin), 0); return true }
  const t = Date.now()
  spin.speed = computeSpeed(spin.duration, spin.startTime, spin.spinSpeed, t)
  // the spin is being eased, but what we want is the current location
  spin.degree = computeRotation(spin.duration, spin.startTime,spin.spinSpeed,t)
	spin.degree = mod(spin.degree, 360)
  spin.obj.style.transform = `rotate(-${spin.degree}deg)`
	requestAnimFrame(() => spin_anim(spin)) // curried version of spin_anim? why?
}

// Take a spin object and the index of the slot destined to win, start spinning
function spin_start(spin, winner) {
  ASSERT(winner >= 0 && winner < spin.slots.length, 
    `Can't take slot ${winner} of ${JSON.stringify(spin.slots)}`)
  spin.degree = 0
  spin.winner = winner
  spin.obj.style.transform = `rotate(-${spin.degree}deg)`
  spin.startTime = Date.now()
	spin.rand_speed = Math.random()
  spin.speed = spin.spinSpeed
  spin.duration = spin.min_duration + 
    (spin.max_duration - spin.min_duration) * spin.rand_speed

  // Compute the total rotation, and figure out if it is landing on the winner.
  // If not, adjust the duration so that we do land on the winner by 
  // determining a position and then computing the time at that position and
  // updating the duration to match.

  // 1 - Figure out the min and max angle/rotation for the winner
  const win = spin.slots[winner] //start/endAngle
  // 2 - Compute the rotation angles for the given duration
  const rotationTot = 
    computeTotalRotation(spin.duration, spin.startTime, spin.spinSpeed)
  const oneRot = mod(rotationTot, 360)
  // 3 - Figure out if we're already there, or if we need to move things around
  if (oneRot < win.startAngle || oneRot > win.endAngle) {
    // not inside the winner, so determine how much more we need by finding
    // a random value between start and end
    const ranAngle = 
                Math.random() * (win.endAngle - win.startAngle) + win.startAngle
    // decide how much to add to oneRot to get to ranAgnle, then do that to
    // rotationTot instead
    const newTot = rotationTot + (ranAngle - oneRot)
    // newTot should now be valid, so we need to compute a duration that can 
    // get us to this total.
    // Hmm, but shouldn't duration always be the length of the sound clip?
    const newTime = 
      computeTimeFromRotation(spin.duration, spin.spinSpeed, newTot)
    spin.duration = newTime
  }
	spin_anim(spin)
}

// Snap to the final destination (which should be close enough to where the 
// animation is that there's no visible snapping) and draw a bolder outline 
// around the winning pie slice.
function spin_stop(spin) {
  spin.degree = mod(
       computeTotalRotation(spin.duration, spin.startTime, spin.spinSpeed), 360)
  spin.obj.style.transform = `rotate(-${spin.degree}deg)`
  const win = spin.slots[spin.winner]
  const p = win.weight
  let [a, b] = [win.startAngle, win.endAngle]
  if (p > 1-1e-4) { a = 0; b = 360 - 1e-4 }
  spin.obj.innerHTML += `<path d="${arcPath(50,50, 5, 50, a, b)}" ` +
                           `fill="#00000000" stroke="white" stroke-width="2" />`
}

function setSpinnerNaN(spin) {
  const slots = compute2Slots(1)
  slots[0].color = "black"
  slots[0].value = "🍌"  // why a banana? idk, could use confused-emoji instead?
  updateSpinner(spin, slots)
}

// Take the weight (probability) of the pie slice and make the font blurb
function fontblurb(x) {
  const MAXF = 16            // biggest font size that looks good on the spinner
  const fs = min(MAXF, max(0, x*100 - 1))  // eg, p=10% displayed at font size 9
  return `font-family="Arial" font-style="bold" font-size="${fs}" `
}

const alignblurb = 'alignment-baseline="central" text-anchor="middle" '
const strokeblurb = 'stroke="#000000" stroke-width="1" opacity="0.3" '

// Take start angle a, end angle b, the color, and the probability; return svg 
// blurb for wedge
function arcblurb(a, b, color, p) {
  //CLOG(`DEBUG: arcblurb: a=${a}, b=${b}, color=${color}, p=${p}`)
  if (a === b && color === 'black') { a = 0; b = 360 - 1e-5 }
  if (p > 1-1e-4) { a = 0; b = 360 - 1e-4 } // weirdness with middle dot...
  return `<path d="${arcPath(50,50, 5,50, a, b)}" fill="${color}" />`
  // We can just make an arc from 0 to almost-360 degrees so no need for this
  // special case:
  // `<circle cx="50" cy="50" r="50" fill="${color}"/>` +
  // `<circle cx="50" cy="50" r="5"  fill="white"/>`
}

// Take angle in degrees and x,y coordinates, return svg blurb for the rotation
function rotateblurb(d, x, y) { return `transform="rotate(${d}, ${x}, ${y})"` }

function redrawSpinner(spin) {
  const totweight = spin.slots.reduce((a, b) => a + b.weight, 0)
  if (abs(totweight - 1) > 1e-9) {
    CLOG(`TODO: ASSERT: slot weights sum to ${totweight} (should be 1)`)
    alert(`Slot weights sum to ${totweight} (should be 1)`)
  }
  const weights = spin.slots.map(i => i.weight)
  const textOffset = spin.slots.length <= 4 ? 35 : 45

  let svg = ''
  for (let i = 0, ang = 0; i < spin.slots.length; i++) {
    const p = weights[i]            // probability of this slot
    if (p === 0) continue
    const degDelta = 360*p          // number of degrees in this wedge
    const midAngle = ang+degDelta/2 // draw the text in the middle of the arc
    const tc = polarToCartesian(50, 50, textOffset, midAngle) // text coords
    const rotateblurb = `transform="rotate(${midAngle}, ${tc.x}, ${tc.y})"`
    spin.slots[i]["startAngle"] = ang
    spin.slots[i]["endAngle"] = ang + degDelta
    svg += arcblurb(ang, ang + degDelta, spin.slots[i].color, p) +
           `<text x="${tc.x}" y="${tc.y}" fill="white" ` +
                  fontblurb(p) + alignblurb + rotateblurb + '>' +
              spin.slots[i].value + '</text>'
    ang += degDelta
  }
  spin.obj.innerHTML = svg
}

function updateSpinner(spin, slots) {
  spin.slots = slots
  if (spin.slots.length < 2) throw "You must specify at least two options"
  redrawSpinner(spin)
}

// Create an svg directly in the div and initialize the spinner object
function spinner(div, slots) {
  div.innerHTML += '<svg xmlns="http://www.w3.org/2000/svg" ' +
          'class="spin" width="100%" height="100%" viewbox="0 0 100 100"></svg>'

  const spin = {
    slots: slots,
    obj: div.querySelector('svg'),
    winner: -1,
    startTime: Date.now(), // initial time
    
    speed: 0,
    spinSpeed: 1,
    degree: 0,
    min_duration: 3000,
    max_duration: 5000,
    rand_speed: 0,
    duration: 0,

    // trying a new thing here with fixed duration and only tracking position
    //dur: 4500, // total duration of the spin
    //pos: 0, 
  }

  updateSpinner(spin, slots)
  return spin
}

// computes two slots given a probability
function compute2Slots(p) {
  if (p < 0 || p > 1) throw `Probability (${p}) must be between 0 and 1`
  return [
    // Or we could label the slices with 'YES/💰/⬆️' and 'NO/🆓/⬇️'
    { value: percentify(p),   weight: p,   color: 'green' },
    { value: percentify(1-p), weight: 1-p, color: 'red'   },
  ]
}

window.spinner = {
  create: spinner,
  start: spin_start,
  compute2Slots: compute2Slots,
  update: updateSpinner,
  setNaN: setSpinnerNaN,
  redraw: redrawSpinner,
}

// -----------------------------------------------------------------------------
