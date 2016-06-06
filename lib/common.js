Globals = {
	initTime : Date.now(),
	savedTimes : [],
	timestamp: undefined,
}
var itemCache = {};
var cacheMs = 60000;

function updateCounter() {
	$('#count').text(JSON.parse($('#count').text()) + 1);
}
function startCounter() {
	Globals.timestamp = Date.now();
}
function updateRenderTime() {
	/* @arrow :: _ ~> _ */
	var time = Date.now() - Globals.timestamp,
	avg;
	Globals.currTimeStamp = time;
	Globals.savedTimes.push(time);
	avg = Globals.savedTimes.reduce(function (x, y) {
			return x + y
		}) / Globals.savedTimes.length;
	$('#time').text(time + ' ms');
	$('#average').text(avg.toFixed(2) + ' ms');
}

function itemLookupLegacy(id, page, size) {
	var key = id + '-' + page + '-' + size;
     if (key in itemCache && ((Date.now() - itemCache[key].timestamp)  < cacheMs)) {
        return itemCache[key].value;
    }
    return undefined;
}

function storeItemLegacy(id, page, size, value) {
	var key = id + '-' + page + '-' + size;
    itemCache[key] = {
		value: value,
		timestamp: Date.now()
	};
}

function showInventory(id, page, size) {
	var page = id.page || page,
		size = id.size || size,
		id = id.id || id;
		
	sendItemRequest(id, page, size, function(id, page, size, response) {
			startCounter();
			renderHeader(id, page, size, response);
			renderTable(response.items || []);
			updateRenderTime();
	});
	if(page!=1) {
		sendItemRequest(id, page-1, size);
	}
	sendItemRequest(id, page + 1, size);
}

function sendItemRequest(id, page, size, handlerFn, callback) {
    var xhttp = new XMLHttpRequest(),
		response;
	var lookup = itemLookupLegacy(id, page, size);
	if(lookup) {
        if(handlerFn) {
			handlerFn(id, page, size, lookup);
		}
	} else {
		xhttp.onreadystatechange = function () {
			if (xhttp.readyState == 4 && xhttp.status == 200) {
				response = JSON.parse(xhttp.responseText);
				storeItemLegacy(id,page,size,response);
				if(handlerFn) {
					handlerFn(id, page, size, response);
				}
			}
		};
		xhttp.open("GET", '../api/item?store=' + id + '&pq_curpage=' + page + '&pq_rpp=' + size, true);
		xhttp.send();
		updateCounter();
	}
}

function renderHeader(id, page, size, response) {
	var start = 1 + (size * (page - 1)),
	psize = page * size,
	response, prev,	next;
	
	psize = response.count < psize ? response.count : psize;
	start = (response.count === 0) ? 0 : start;
	$('#results').html('');
	$('#resultGrid').html('</br>');
	$('#resultGrid').append('<button id="prev" onclick="showInventory(' + id + ',' + (page - 1) + ',' + size + ')"/> Showing store inventory ' +
		start + '-' + psize + ' of ' + response.count + ' <button id="next" onclick="showInventory(' + id + ',' + (page + 1) + ',' + size + ')"/>');

	prev = $("#prev").button({
			icons : {
				primary : "ui-icon-circle-triangle-w"
			},
			text : false
		});
	if (page === 1) {
		prev.button("option", "disabled", true);
	}
	next = $("#next").button({
			icons : {
				primary : "ui-icon-circle-triangle-e"
			},
			text : false
		});
	if (psize >= response.count) {
		next.button("option", "disabled", true);
	}
}

function renderPlainHeader(id, page, size, response) {
	var start = 1 + (size * (page - 1)),
	psize = page * size,
	response, prev, next;

	psize = response.count < psize ? response.count : psize;
	start = (response.count === 0) ? 0 : start;
	$('#results').html('');
	$('#resultGrid').html('');
	$('#resultGrid').append(' Showing store inventory ' + start + '-' + psize + ' of ' + response.count);

	prev = $("#prev").show().button({icons : { primary : "ui-icon-circle-triangle-w" }, text : false });
	prev.button("option", "disabled", page===1);
	next = $("#next").show().button({ icons : { primary : "ui-icon-circle-triangle-e" }, text : false });
	next.button("option", "disabled", (page * size) >= response.count); 
}

function renderTable(results) {
	$('#resultGrid').append('<div id="grid">  \
											<table style="font-size:11"> \
												<tr> \
													<th style="width:5%">ID</th> \
													<th style="width:30%">Product Name</th> \
													<th style="width:15%">Product Category</th> \
													<th style="width:20%">Product Sub-Category</th> \
													<th style="width:10%">Container Type</th> \
													<th style="width:10%">Price Per Unit</th> \
													<th style="width:10%">Margin %</th> \
												</tr> \
											<table>');
	results.forEach(function (result) {
		var out = '';
		var row = $('#resultGrid #grid tbody').append($('<tr>'));
		row.append($('<td>').text(result.id));
		row.append($('<td>').text(result.name));
		row.append($('<td>').text(result.catagory));
		row.append($('<td>').text(result.subcatagory));
		row.append($('<td>').text(result.container));
		row.append($('<td>').text(result.price));
		row.append($('<td>').text(result.margin));
	});
}

function getResultElement() {
	return document.getElementById('results');
}
