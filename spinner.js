
// Shortcut to get the best animationFrame function
window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        function(callback){window.setTimeout(callback, 1000 / 60);};
})();

// Keeps dregrees within 0-360
function filter_degree(d) {
	while (d<0){
		d += 360;
	}
	return (d%360);
}

// Converts Polar to Cartesian coordinates
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    var angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
}

// Draws a pie slice that is one section of the spinner
function arcPath(x, y, radius, endradius, startAngle, endAngle) {
    var start = polarToCartesian(x, y, radius, endAngle);
    var end = polarToCartesian(x, y, radius, startAngle);
    var start2 = polarToCartesian(x, y, endradius, endAngle);
    var end2 = polarToCartesian(x, y, endradius, startAngle);
    var largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    var d = [
        "M", start.x, start.y, 
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
        "L", end2.x, end2.y,
        "A", endradius, endradius, 0, largeArcFlag, 1, start2.x, start2.y,
        "Z"
    ].join(" ");
    return d;
}


function computeRotation(duration, speed) {
    const dr = duration;// / 1000.0;
    return (2*dr*speed- speed*dr*(2/Math.PI + 1));
}

// Executes the animation frame using css
var spin_anim = function(spin){
	if ( spin.stop ) { return true; }
	spin.degree = filter_degree(spin.degree + spin.speed);
	spin.obj.css('transform', 'rotate(' + spin.degree + 'deg)');
    // curry this.
    var sa = function() {
        spin_anim(spin);
    }
	requestAnimFrame(sa);
};

// Starts the Spinner
// spin is the spin object, winner is the index for the slot that wins.
function spin_start(spin, winner) {
    // Reset to zero
    spin.degree = 0;
    spin.obj.css('transform', 'rotate(' + spin.degree + 'deg)');
    // start the spinner
	spin.stop = false;
	spin_anim(spin);
	spin.rand_speed = Math.random();
    spin.speed = spin.spinSpeed;
    var duration = spin.min_duration + (spin.max_duration-spin.min_duration)*spin.rand_speed;
    //duration = 6873;
    //duration = 10;
    const rotationTot = computeRotation(duration, spin.spinSpeed);
    console.log("rotationTot ", rotationTot);
    const oneRot = filter_degree(rotationTot);
    console.log("rotation ", oneRot);
	//$( spin ).animate({speed: spin.spinSpeed}, 0.15*spin.min_duration, "easeInBack", function(){
		$( spin ).animate({speed: 0}, duration, "easeOutSine", function(){
			spin_stop(spin, winner);
		});
	//});
}

// Stops the Spinner
function spin_stop(spin, winner) {
	spin.stop = true;
    console.log("deg:", spin.degree);
    // The winner is the index of the slot that wins, so we want to figure out
    // what slot that is, and draw a new outline pie over it to show that's the winner!
    const total_weight = spin.slots.map(i => i.weight).reduce((p, c) => p+c);
    const normals = spin.slots.map(i => i.weight / total_weight);
    var startAngle = 0;
    var svg = spin.obj.html();
    for (var i=0; i<spin.slots.length; i++) {
        const endAngle = startAngle + 360*normals[i];
        if (i === winner) {
            svg = svg + '<path d="' + arcPath(50,50, 5, 50, (startAngle), (endAngle)) + '" fill="#00000000" stroke="#ffffff" stroke-width="2" />';
            spin.obj.html(svg);
            return;
        }
        startAngle = endAngle;
    }

}

function setSpinnerNaN(spin) {
    const slots = compute2Slots(1);
    slots[0].color = "black";
    slots[0].value = "🍌"
    updateSpiner(spin, slots);
}

function redrawSpinner(spin) {
    // draw the spinner
    var total_weight = spin.slots.map(i => i.weight).reduce((p, c) => p+c);
    var normals = spin.slots.map(i => i.weight / total_weight);
    const textOffset = spin.slots.length <= 4 ? 35 : 45;

    var svg = '';
    // check to see if one of the normals is at 1, if it is we want to draw the 
    // special case for just that index (i).
    var iAtOne = normals.findIndex((i) => i == 1);
    if (iAtOne > -1) {
        // we are drawing wedges with arcs, and arcs can't draw full circles, so if
        // we are in the special case of one item has full probability (360 deg)
        // then we have to opt out of the arc and draw a circle.
        svg = svg + '<circle cx="50" cy="50" r="50" fill="' + spin.slots[iAtOne].color + '"/>';
        svg = svg + '<circle cx="50" cy="50" r="5" fill="white"/>';
        const t = polarToCartesian(50, 50, textOffset, 0);
        svg = svg + '<text font-size="10" x="' + t.x + '" y="' + t.y + '" fill="#000000" font-style="bold" font-family="Arial" alignment-baseline="central" text-anchor="middle" transform="rotate(' + (0) + ' ' + t.x + ',' + t.y + ')" stroke="#000000" stroke-width="1" opacity="0.3">' + spin.slots[iAtOne].value + '</text>';
        svg = svg + '<text font-size="10" x="' + t.x + '" y="' + t.y + '" fill="#ffffff" font-style="bold" font-family="Arial" alignment-baseline="central" text-anchor="middle" transform="rotate(' + (0) + ' ' + t.x + ',' + t.y + ')">' + spin.slots[iAtOne].value + '</text>';
        

        spin.obj.html( svg );
        return spin;
    }
    // draw the pie parts
    var startAngle = 0;
    for (var i=0; i<spin.slots.length; i++) {
        const endAngle = startAngle + 360*normals[i];
        svg = svg + '<path d="' + arcPath(50,50, 5, 50, (startAngle), (endAngle)) + '" fill="' + spin.slots[i].color + '" stroke="#ffffff" stroke-width="0" />';
        startAngle = endAngle;
    }
    // draw the text on top of the pie parts
    for (var i=0; i<spin.slots.length; i++) {
        const endAngle = startAngle + 360*normals[i];
        // compute the location of the text
        const midAngle = startAngle + (endAngle - startAngle)/2;
        const t = polarToCartesian(50, 50, textOffset, midAngle);
        svg = svg + '<text font-size="6" x="' + t.x + '" y="' + t.y + '" fill="#000000" font-style="bold" font-family="Arial" alignment-baseline="central" text-anchor="middle" transform="rotate(' + (midAngle) + ' ' + t.x + ',' + t.y + ')" stroke="#000000" stroke-width="1" opacity="0.3">' + spin.slots[i].value + '</text>';
        svg = svg + '<text font-size="6" x="' + t.x + '" y="' + t.y + '" fill="#ffffff" font-style="bold" font-family="Arial" alignment-baseline="central" text-anchor="middle" transform="rotate(' + (midAngle) + ' ' + t.x + ',' + t.y + ')">' + spin.slots[i].value + '</text>';
        startAngle = endAngle;

    }
    spin.obj.html( svg );

    return spin;
}

function updateSpiner(spin, slots) {
    spin.slots = slots;
    if (spin.slots.length < 2)
        throw "You must specify at least two options";

    return redrawSpinner(spin);
}

function spinner(div, slots) {
    // create an svg directly in the div 
    div.append('<svg xmlns="http://www.w3.org/2000/svg" class="spin" width="100%" height="100%" viewbox="0 0 100 100"></svg>');

    // generate the spin object
    var spin = {
        slots: slots,
        speed: 0,
        spinSpeed: 10,
        degree: 0,
        obj: div.children("svg"),
        stop: false,
        min_duration: 3000,
        max_duration: 8000,
        rand_speed: 0,
    };

    updateSpiner(spin, slots);


    return spin;

}

// computes two slots given a probability
function compute2Slots(p) {
    if (p < 0 || p >1)
        throw "Probability must be between 0 and 1";
    return [
        {value:'YES/💰/⬆️', color: 'green', weight: p},
        {value:'NO/🆓/⬇️', color: 'red', weight: 1-p},
    ]
}

window.spinner = {
    create: spinner,
    start: spin_start,
    compute2Slots: compute2Slots,
    update: updateSpiner,
    setNan: setSpinnerNaN,
    redraw: redrawSpinner
};
