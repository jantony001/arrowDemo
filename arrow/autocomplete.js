var storeCache = {};

var page, storeId;

var size = 20;

function getVal(elem, event) {
  /* @arrow :: (Elem, Event) ~> String */
  Globals.timestamp = Date.now();
  return $(elem).val();
}

function getSelection(elem, event) {
  /* @arrow :: (Elem, Event) ~> Number */
	startCounter();
	var row = event.target.textContent.split(' | ');
		
	Globals.timestamp = Date.now();
	if(row.length > 1) {
		$('#input').val(row[1]);
	}
	page = 1;
	storeId = JSON.parse(event.target.id);
	return storeId;
}

function pageSelection(elem, event) {
	/* @arrow :: (Elem, Event) ~> Number */
	startCounter();
	var target = event.target.parentNode.id
		if(event.target.parentElement.disabled === true) {
			throw "Navigation Unavailable";
		}
		if (target === 'next') {
			page = page + 1;
		} else if (target === 'prev') {
			if (Globals.page !== 1) {
				page = page - 1;
			}
		} else {
			throw "Navigation Unavailable";
		}
		return storeId;
}

function handle(results) {
  /* @arrow :: {items: [{ id : Number , name : String, street : String, city : String, state : String, country : String, zip : String }] } ~> _ */
  $('#results').html('<ol id="selectable"/>')
  results.items.forEach(function (result) {
  	var out = '';
  	for (var x in result) {
  		out += result[x] + " | ";
  	}
  	$('ol').append($('<li class="ui-widget-content result"  id ='+result.id +'>').text(out));
  });
}
function showGrid(response) {
  /* @arrow ::  {count : Number, page : Number, prev : Number, next : Number, size : Number, store : Number, items : [{ id : Number , name : String, catagory : String, subcatagory : String, container : String, price : String, margin : String }]} ~> { id : Number, page : Number, size : Number } */
	renderPlainHeader(response.store, response.page, size, response);
	renderTable(response.items);
	updateRenderTime();
	return { "id": response.store, "page": response.page, "size": response.size };
}

function renderGrid(response) {
  /* @arrow ::  {count : Number, page : Number, prev : Number, next : Number, size : Number, store : Number, items : [{ id : Number , name : String, catagory : String, subcatagory : String, container : String, price : String, margin : String }]} ~> { id : Number, page : Number, size : Number } */
    startCounter();
	return showGrid(response);
}


var storeAjax = new AjaxArrow(function (q) {
  /* @conf :: String
   * @resp :: { items: [{ id : Number , name : String, street : String, city : String, state : String, country : String, zip : String }] } */
  updateCounter();
  return {
    'url'     : '../api/store?limit=10&q=' + q,
    'dataType': 'json'
  };
});

var itemAjax = new AjaxArrow(function (arg) {
  /* @conf :: Number
   * @resp :: {count : Number, page : Number, prev : Number, next : Number, size : Number, store : Number, items : [{ id : Number , name : String, catagory : String, subcatagory : String, container : String, price : String, margin : String }]} */
  updateCounter();
  return {
    'url'     : '../api/item?pq_rpp=' + size + '&pq_curpage=' + arg + '&store=' + storeId,
    'dataType': 'json' 
  };
});


function storeLookup(key) {
    /* @arrow :: String ~> 'a \ ({}, { String }) */
    if (key in storeCache && ((Date.now() - storeCache[key].timestamp)  < cacheMs)) {
        return storeCache[key].value;
    }
    throw key;
}

function itemLookup(id) {
    /* @arrow :: Number ~> 'a \ ({}, { Number }) */
	var key = id + '-' + page + '-' + size;
     if (key in itemCache && ((Date.now() - itemCache[key].timestamp)  < cacheMs)) {
        return itemCache[key].value;
    }
    throw id;
}


function cacheStore(key, value) {
    /* @arrow :: (String, 'a) ~> _ */
    storeCache[key] = {
		value: value,
		timestamp: Date.now()
	};
}

function storeItem(id, value) {
    /* @arrow :: (Number, 'a) ~> _ */
	var key = id + '-' + page + '-' + size;
    itemCache[key] = {
		value: value,
		timestamp: Date.now()
	};
}

var extractPrev = new LiftedArrow(function (x) {
    /* @arrow :: {prev: Number} ~> Number */
    return x.prev;
});

var extractNext = new LiftedArrow(function (x) {
    /* @arrow :: {next: Number} ~> Number */
    return x.next;
});


var extractResults = new LiftedArrow(function (x) {
    /* @arrow :: {results: {count : Number, page : Number, prev : Number, next : Number, size : Number, store : Number, items : [{ id : Number , name : String, catagory : String, subcatagory : String, container : String, price : String, margin : String }]}} ~> [{ id : Number , name : String, catagory : String, subcatagory : String, container : String, price : String, margin : String }] */
    return x.items;
});

var init = new LiftedArrow(function () {
    /* @arrow :: _ ~> Number */
    return 1;
});

var cachedStoreAjax = Arrow.try(
    storeLookup.lift(),
    Arrow.id(),
    storeAjax.carry().seq(cacheStore.lift().remember()).seq(new NthArrow(2))
);

var cachedItemAjax = Arrow.try(
    itemLookup.lift(),
    Arrow.id(),
    itemAjax.carry().seq(storeItem.lift().remember()).seq(new NthArrow(2))
);

var arr = Arrow.fix(a => {
    return new ElemArrow('#input').seq(
        Arrow.seq([
            getVal.lift(),
			new Delay(400),
            cachedStoreAjax,
            handle.lift(),
			updateRenderTime.lift()
        ])
        .any(a)
        .on('keyup'),
        a
    );
});
arr.run();

var autoCompleteResult = new ElemArrow('#results').seq(
		Arrow.seq([
				getSelection.lift(),
				cachedItemAjax,
				startPrefetch.lift()
			])
		.on('click')).forever();
autoCompleteResult.run();


var runFirstIfPossible = function runFirstIfPossible(task, main) {
    return Arrow.any([task.noemit().remember().seq(main), main]);
};

function disableWhileLoading(arr) {
    var disable = new LiftedArrow(function () {
        return [$("#prev").button("option", "disabled", true),
				$("#next").button("option", "disabled", true)]
    });
    var enable = new LiftedArrow(function () {
        return [$("#prev").button("option", "disabled", false),
				$("#next").button("option", "disabled", false)]
    });

    return disable.remember().seq(arr.seq(enable.remember()));
}

var prefetch = init.seq(Arrow.fix(function (a) {
			return Arrow.seq([
					disableWhileLoading(cachedItemAjax),

					Arrow.fanout([extractPrev, extractNext, renderGrid.lift()]), runFirstIfPossible(

						Arrow.seq([new NthArrow(2).seq(cachedItemAjax)]),

						Arrow.any([new ElemArrow('#prev').seq(new EventArrow('click')).remember().nth(1), new ElemArrow('#next').seq(new EventArrow('click')).remember().nth(2)])),

					a]);
		}));

function startPrefetch() {
	prefetch.run();
}