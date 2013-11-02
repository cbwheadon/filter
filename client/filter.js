function barChart() {
    if (!barChart.id) barChart.id = 0;

    var margin = {top: 10, right: 10, bottom: 20, left: 30},
    x,
    y = d3.scale.linear().range([100, 0]),
    id = barChart.id++,
    axis = d3.svg.axis().orient("bottom"),
    yaxis = d3.svg.axis().scale(y).ticks(4).orient("left"),
    xaxis = true,
    brush = d3.svg.brush(),
    brushDirty,
    dimension,
    group,
    ordinal = false,
    addText = false,
    round;

    function chart(div) {
	console.log("domain")
	console.log(x.domain())
	if(!ordinal){
	    var width = x.range()[1]
	} else {
	    var width = x.rangeExtent()[1]
	}
        height = y.range()[0];

	var yval = group.top(1)[0].value;
	//Fixed for average
	if(yval.hasOwnProperty('total')){
	    y.domain([-3,3]);
	} else {
	    y.domain([0, yval]);		    
	}

	div.each(function() {
            var div = d3.select(this),
            g = div.select("g");

            // Create the skeletal chart.
            if (g.empty()) {
		div.select(".title").append("a")
		    .attr("href", "javascript:reset(" + id + ")")
		    .attr("class", "reset")
		    .text("reset")
		    .style("display", "none");

		g = div.append("svg")
		    .attr("width", width + margin.left + margin.right)
		    .attr("height", height + margin.top + margin.bottom)
		    .append("g")
		    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		g.append("clipPath")
		    .attr("id", "clip-" + id)
		    .append("rect")
		    .attr("width", width)
		    .attr("height", height);

		g.selectAll(".bar")
			.data(["background", "foreground"])
			.enter().append("path")
			.attr("class", function(d) {return d + " bar"; })
			.datum(group.all())

		if(addText){
		    //console.log('Add text to this one...')
		    g.selectAll(".txt")
			.data(group.all())
			.enter().append("text")
			.attr("class", "notation")
			.text(function(d) {if (d.key==1) {return "You" } else {return "All"}})
			.attr("dy", ".3em")
			.attr("dx", 6)
			.attr("y", 10)
			.attr("x", function(d) {return x(d.key)-10})
			.style("text-anchor", "end")
		}

		g.selectAll(".foreground.bar")
		    .attr("clip-path", "url(#clip-" + id + ")");

		if(xaxis){
		    g.append("g")
			.attr("class", "axis")
			.attr("transform", "translate(0," + height + ")")
			.call(axis);
		} else {
		    g.append("g")
			.attr("class", "y axis")
			.call(yaxis)
		}

		if(!ordinal){
		    // Initialize the brush component with pretty resize handles.
		    var gBrush = g.append("g").attr("class", "brush").call(brush);
		    gBrush.selectAll("rect").attr("height", height);
		    gBrush.selectAll(".resize").append("path").attr("d", resizePath);
		}
            }

            // Only redraw the brush if set externally.
            if (brushDirty) {
		brushDirty = false;
		g.selectAll(".brush").call(brush);
		div.select(".title a").style("display", brush.empty() ? "none" : null);
		if (brush.empty()) {
		    g.selectAll("#clip-" + id + " rect")
			.attr("x", 0)
			.attr("width", width);
		} else {
		    var extent = brush.extent();
		    g.selectAll("#clip-" + id + " rect")
			.attr("x", x(extent[0]))
			.attr("width", x(extent[1]) - x(extent[0]));
		}
            }

            g.selectAll(".bar").attr("d", barPath);
	});

	function barPath(groups) {
            var path = [],
            i = -1,
            n = groups.length,
            d;
	    console.log(groups);
            while (++i < n) {
		d = groups[i];
		if(d.value.hasOwnProperty('count')){
		    if(d.value.count>0) {
			vl = d.value.total / d.value.count;
		    } else { vl = -100 };
		    path.push('M',x(d.key),',',y(vl) ,'m -2.5, 0 a 2.5,2.5 0 1,0 5,0 a 2.5,2.5 0 1,0 -5,0');
		    path.push('M',x(d.key)-0.5, ',',y(vl)+20,' H ',x(d.key)+1,' V ',y(vl)-20,' H ',x(d.key)-0.5,' Z');
		    
		} else {
		    if(!ordinal){
			path.push("M", x(d.key), ",", height, "V", y(d.value), "h9V", height);
		    } else {
			path.push("M", x(d.key), ",", height, "V", y(d.value), "h" ,x.rangeBand(), "V", height);
		    }
		}
            }
            return path.join("");
	}

	function resizePath(d) {
            var e = +(d == "e"),
            x = e ? 1 : -1,
            y = height / 3;
            return "M" + (.5 * x) + "," + y
		+ "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6)
		+ "V" + (2 * y - 6)
		+ "A6,6 0 0 " + e + " " + (.5 * x) + "," + (2 * y)
		+ "Z"
		+ "M" + (2.5 * x) + "," + (y + 8)
		+ "V" + (2 * y - 8)
		+ "M" + (4.5 * x) + "," + (y + 8)
		+ "V" + (2 * y - 8);
	}
    }

    brush.on("brushstart.chart", function() {
	var div = d3.select(this.parentNode.parentNode.parentNode);
	div.select(".title a").style("display", null);
    });

    brush.on("brush.chart", function() {
	var g = d3.select(this.parentNode),
        extent = brush.extent();
	if (round) g.select(".brush")
            .call(brush.extent(extent = extent.map(round)))
            .selectAll(".resize")
            .style("display", null);
	g.select("#clip-" + id + " rect")
            .attr("x", x(extent[0]))
            .attr("width", x(extent[1]) - x(extent[0]));
	dimension.filterRange(extent);
    });

    brush.on("brushend.chart", function() {
	if (brush.empty()) {
            var div = d3.select(this.parentNode.parentNode.parentNode);
            div.select(".title a").style("display", "none");
            div.select("#clip-" + id + " rect").attr("x", null).attr("width", "100%");
            dimension.filterAll();
	}
    });

    chart.margin = function(_) {
	if (!arguments.length) return margin;
	margin = _;
	return chart;
    };

    chart.x = function(_) {
	if (!arguments.length) return x;
	x = _;
	axis.scale(x);
	brush.x(x);
	return chart;
    };

    chart.y = function(_) {
	if (!arguments.length) return y;
	y = _;
	return chart;
    };

    chart.addText = function(_){
	if(!arguments.length) return addText;
	addText = _;
	return chart;
    };

    chart.dimension = function(_) {
	if (!arguments.length) return dimension;
	dimension = _;
	return chart;
    };

    chart.filter = function(_) {
	if (_) {
            brush.extent(_);
            dimension.filterRange(_);
	} else {
            brush.clear();
            dimension.filterAll();
	}
	brushDirty = true;
	return chart;
    };

    chart.group = function(_) {
	if (!arguments.length) return group;
	group = _;
	return chart;
    };

    chart.round = function(_) {
	if (!arguments.length) return round;
	round = _;
	return chart;
    };

    chart.xaxis = function(_){
	if (!arguments.length) return xaxis;
	xaxis = _;
	return chart;
    };

    chart.ordinal = function(_){
	if (!arguments.length) return ordinal;
	ordinal = _;
	return chart;
    };

    return d3.rebind(chart, brush, "on");
}

drawBarChart = function(values,subjectArray) {

    var formatNumber = d3.format(",d")

    reduceAdd = function(p, v) {
	/*
	console.log('adding');
	console.log('initial state');
	console.log(p);
	console.log('new item');
	console.log(v);
	*/
	++p.count;
	p.total += v.difference;
	/*
	console.log('post adding');
	console.log(p);
	*/
	return p;
    }

    reduceRemove = function(p, v) {
	/*
	console.log('removing');
	console.log('initial state');
	console.log(p);
	console.log('new item');
	console.log(v);
	*/
	--p.count;
	p.total -= v.difference;
	/*
	console.log('post removing');
	console.log(p);
	*/
	return p;
    }
    
    reduceInitial =function() {
	return {count: 0, total: 0};
    }

    orderValue = function(p) {
	return p.total / p.count;
    }
    //console.log(values[0]);
    var dt = crossfilter(values);

    all = dt.groupAll();
    //Set dimension
    ks2 = dt.dimension(function(d) {return d.mKS;});
    ks2s = ks2.group(function(d) { return d });

    subject = dt.dimension(function(d) {return d.subject});
    subjects = subject.group(function(d) {return d});

    va = dt.dimension(function(d) {return +d.difference});
    vas = va.group(function(d) {return d});

    centre = dt.dimension(function(d) {return d.centre});
    centres = centre.group(function(d) {return d});
    
    centreVA = centres.reduce(reduceAdd,reduceRemove,reduceInitial).order(orderValue);
    console.log("setting domain")
    var charts = [
	barChart()
            .dimension(ks2)
            .group(ks2s)
	    .x(d3.scale.linear()
	       .domain([0,6])
	       .rangeRound([0,200])),
	barChart()
            .dimension(va)
            .group(vas)
	    .x(d3.scale.linear()
	       .domain([-7,7])
	       .rangeRound([0,200])),
	barChart()
            .dimension(centre)
            .group(centreVA)
	    .xaxis(false)
	    .addText(true)
	    .x(d3.scale.linear()
	       .domain([-1,2])
	       .rangeRound([0,100])),
	barChart()
	    .ordinal(true)
	    .group(subjects)
	    .x(d3.scale.ordinal()
	       .domain(subjectArray)
	       .rangeBands([0,400],0.25,1))
    ]
    
    var chart = d3.selectAll(".chart")
	.data(charts)
	.each(function(chart) { chart.on("brush", renderAll).on("brushend", renderAll); });

    // Render the initial lists.
    var list = d3.selectAll(".list")
	.data([studentList]);

    // Render the total.
    d3.selectAll("#total")
      .text(formatNumber(dt.size()));

    renderAll();

    // Renders the specified chart or list.
    function render(method) {
	d3.select(this).call(method);
    }

    function va_calc(obj){
	if(obj.count>0){
	    return ((obj.total/obj.count).toFixed(2));
	} else {
	    return 0
	}
    }

    // Whenever the brush moves, re-rendering everything.
    function renderAll() {
	chart.each(render);
	list.each(render);
	d3.select("#active").text(formatNumber(all.value()));
	var vl = centreVA.all()[1].value;
	d3.select('#va').text(va_calc(vl));
	d3.select('#vn').text(vl.count);
	var vl = centreVA.all()[0].value;
	d3.select('#ava').text(va_calc(vl));
	d3.select('#avn').text(vl.count);
    }


    window.filter = function(filters) {
	filters.forEach(function(d, i) { charts[i].filter(d); });
	renderAll();
    };

    window.reset = function(i) {
	charts[i].filter(null);
	renderAll();
    };


    function studentList(div){
	
	numberOrder = function(a, b) {
	    var a = +a;
	    var b = +b;
	    return b > a ? -1 : b < a ? 1 : 0;
	}
	studentsByDiff = d3.nest().key(function(d){return +d.difference}).sortKeys(numberOrder).entries(centre.filter(1).top(Infinity));

	div.each(function(){
	    var diff = d3.select(this).selectAll(".diff")
		.data(studentsByDiff, function(d) {return d.key});

	    diff.enter().append("div")
	        .attr("class", "diff")
		.append("div")
		.attr("class","title")
		.text(function(d) { return 'Difference: ' + d.values[0].difference});

	    diff.exit().remove();
	    
	    var result = diff.order().selectAll(".result")
		.data(function(d) {return d.values; });

	    var resultEnter = result.enter().append("div")
		.attr("class", "result");

	    resultEnter.append("div")
		.attr("class", "candidate")
		.text(function(d) {return d.candidate});

	    resultEnter.append("div")
		.attr("class", "subject")
		.text(function(d) {return d.subject});

	    resultEnter.append("div")
		.attr("class", "ks2")
		.text(function(d){return d.mKS});

	    resultEnter.append("div")
		.attr("class", "predicted")
		.text(function(d) { return d.predicted; });

	    resultEnter.append("div")
		.attr("class", "achieved")
		.text(function(d) { return d.achieved; });

	    resultEnter.append("div")
		.attr("class", "difference")
		.text(function(d) { return d.difference; });

	    result.exit().remove();
	    
	    result.order();


	});
	
    }

}



Predictions = new Meteor.Collection("predictions");
Meteor.subscribe("Predictions");

Template.example.rendered = function(){
    var self = this;
    self.node = self.find("svg");
    if (!self.handle){
	self.handle = Deps.autorun(function() {
	    //console.log("Running");
	    var centre = Session.get('centre');
	    var year = Session.get('year');
	    var ready = Meteor.subscribe("Predictions");
	    if (ready.ready()){
		//console.log("ready");
		data = Predictions.find({},{}).fetch();
		//data = Predictions.find({},{limit:100}).fetch();
		//recode ids
		var subjectCodes = {};
		for (var i=0; i< data.length; i++){
		    if(data[i].centre==centre){
			data[i].centre=1;
			subjectCodes[data[i].subject] = true;
		    } else {
			data[i].centre=0;
		    }
		}
		subjectCodeArray = Object.keys(subjectCodes);
		console.log(subjectCodeArray);
		drawBarChart(data,subjectCodeArray);
	    };
	});
    }
}


Meteor.startup(function () {
  // code to run on server at startup
    Meteor.subscribe("Predictions");
    Session.set("centre","10102");
    Session.set("year", 2011);
});
