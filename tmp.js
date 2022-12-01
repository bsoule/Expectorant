window.requestAnimFrame = (function(){
  return window.requestAnimationFrame       ||
         window.webkitRequestAnimationFrame ||
         window.mozRequestAnimationFrame    ||
         function(callback){window.setTimeout(callback, 1000/60)}
})();

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    var angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
}
function arcPath(x, y, radius, endradius, startAngle, endAngle) {
    var start  = polarToCartesian(x, y, radius, endAngle);
    var end    = polarToCartesian(x, y, radius, startAngle);
    var start2 = polarToCartesian(x, y, endradius, endAngle);
    var end2   = polarToCartesian(x, y, endradius, startAngle);
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

var spin = {
	slots: [
		{value:'YES', color: '#7CB247'},
		{value:'NO', color: '#DD1050'},
	],
	speed: 0,
	spinSpeed: 10,
	degree: 0,
	obj: null,
	min_duration: 3000,
	max_duration: 8000,
	rand_speed: 0,
};

var spin_anim = function(){
	spin.degree = filter_degree(spin.degree + spin.speed);
	spin.obj.css('transform', 'rotate(' + spin.degree + 'deg)');
	requestAnimFrame(spin_anim);
};

function filter_degree(d) {
	while (d < 0) { d += 360 }
	return (d % 360)
}

function spin_start() {
	spin_anim();
	spin.rand_speed = Math.random();
	$( spin ).animate({speed: spin.spinSpeed}, 0.15*spin.min_duration, "easeInBack", function(){
		$( spin ).animate({speed: 0}, (spin.min_duration + (spin.max_duration-spin.min_duration)*spin.rand_speed), "easeOutSine", function(){});
	});
}

$(document).ready(function(){
	spin.obj = $('#spin');
	
	var slot_count = spin.slots.length;
	var svg = '';
	var t = 0;
	for (var i=0; i<slot_count; i++) {
		t = polarToCartesian(50, 50, 45, ((i+0.5)*(360/slot_count)) );
		svg += '<path d="' + arcPath(50,50, 5, 50, (i*(360/slot_count)), ((i+1)*(360/slot_count))) + '" fill="' + spin.slots[i].color + '" stroke="#ffffff" stroke-width="0" />';
		svg = svg + '<text font-size="6" x="' + t.x + '" y="' + t.y + '" fill="#000000" font-style="bold" font-family="Arial" alignment-baseline="central" text-anchor="middle" transform="rotate(' + (1*((i+0.5)*(360/slot_count))) + ' ' + t.x + ',' + t.y + ')" stroke="#000000" stroke-width="1" opacity="0.3">' + spin.slots[i].value + '</text>';
		svg = svg + '<text font-size="6" x="' + t.x + '" y="' + t.y + '" fill="#ffffff" font-style="bold" font-family="Arial" alignment-baseline="central" text-anchor="middle" transform="rotate(' + (1*((i+0.5)*(360/slot_count))) + ' ' + t.x + ',' + t.y + ')">' + spin.slots[i].value + '</text>';
	}
	$('#spin').html( svg );
	
	spin.degree = Math.random()*360;
	spin.obj.css('transform', 'rotate(' + spin.degree + 'deg)');

	$('#start').click(function(e){
		e.preventDefault();
		spin_start();
	});
});
