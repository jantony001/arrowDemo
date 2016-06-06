$(document).ready(function () {
	$(".js-store-data").select2({
		ajax : {
			url : "api/store",
			dataType : 'json',
			delay : 250,
			data : function (params) {
				return {
					q : params.term, // search term
					page : params.page
				};
			},
			processResults : function (data, params) {
				// parse the results into the format expected by Select2
				// since we are using custom formatting functions we do not need to
				// alter the remote JSON data, except to indicate that infinite
				// scrolling can be used
				params.page = params.page || 1;

				return {
					results : data.items,
					pagination : {
						more : (params.page * 10) < data.count
					}
				};
			},
			cache : true
		},
		minimumInputLength : 1,
		escapeMarkup : function (markup) {
			return markup;
		}, // let our custom formatter work
		templateResult : formatStoreRepo,
		templateSelection : formatStoreRepoSelection
	});

	$(".js-item-data").select2({
		ajax : {
			url : generateItemUrl,
			dataType : 'json',
			delay : 250,
			data : function (params) {
				return {
					q : params.term, // search term
					page : params.page
				};
			},
			processResults : function (data, params) {
				// parse the results into the format expected by Select2
				// since we are using custom formatting functions we do not need to
				// alter the remote JSON data, except to indicate that infinite
				// scrolling can be used
				params.page = params.page || 1;

				return {
					results : data.items,
					pagination : {
						more : (params.page * 10) < data.count
					}
				};
			},
			cache : true
		},
		escapeMarkup : function (markup) {
			return markup;
		}, // let our custom formatter work
		minimumInputLength : 1,
		templateResult : formatItemRepo,
		templateSelection : formatItemRepoSelection
	});

	$(".js-store-data").change(
		function () {
		        var colM = [
            { title: "ID", width:10, dataIndx: "id" },            
            { title: "Product Name",  width:200, dataIndx: "name" },
            { title: "Product Category",  width:110, dataIndx: "catagory"},
            { title: "Product Sub-Category", width:140, dataIndx: "subcatagory"},            
		    { title: "Container Type", width:100, dataIndx: "container"},
		    { title: "Price Per Unit", width:90, dataIndx: "price" },
		    { title: "Margin %", width:70, dataIndx: "margin" }
		];
        var dataModel = {
            location: "remote",            
            dataType: "JSON",
            method: "GET",
            url: "api/item?store=" + $(".js-store-data").select2('data')[0].id,
            getData: function (dataJSON) {                
                return { 
				curPage: dataJSON.curPage, totalRecords: dataJSON.count, data: dataJSON.items };                
            }
        }
		//$("#grid_paging").html('<div id="grid_paging" style="margin:5px"></div>');
        var grid1 = $("div#grid_paging").pqGrid({ width:'auto', height: 560,
            dataModel: dataModel,
            colModel: colM,
			collapsible: true,
            pageModel: { type: "remote", rPP: 20, strRpp: "{0}" },
            sortable: true,
            wrap: false, hwrap: false,    
            numberCell:{resizable:true, width:30, title:"#", show: false},
            title: "Items in the store: " + $(".js-store-data").select2('data')[0].name,
            resizable: true,
			editable:false,
			flexWidth: true,
			scrollModel:{autoFit:true, theme:true}
		});
		$( ".grid_paging" ).pqGrid( "refresh" );
		/*var html = "<table><tr><th class='fivep'>id</th><th>name</th><th>price</th><th>category</th><th>sub category</th><th>container</th><th class='fivep'>margin</th></tr>",
		data = $(".js-store-data").select2('data')[0];
		html += "<tr><td>" + data.id + "</td>";
		html += "<td>" + data.name + "</td>";
		html += "<td>" + data.price + "</td>";
		html += "<td>" + data.catagory + "</td>";
		html += "<td>" + data.subcatagory + "</td>";
		html += "<td>" + data.container + "</td>";
		html += "<td>" + data.margin + "</td></tr>";
		$("#result").html(html + "</table>");*/
	});
	$(function() {
    $( "#radio" ).buttonset();
    $( "#home" ).buttonset();
  });
  $("#radio1").click(function () {
  	location.reload();
  });
	$("#radio2").click(function () {
  	location.href='arrow/jquery.html'

  });
  $("#radio3").click(function () {
  	location.href='arrow/arrow.html'

  });
});

function generateItemUrl() {
	var store = Number($(".js-store-data").select2('data')[0].id);
	return "api/item" + (store ? ("?store=" + encodeURIComponent(store)) : "");
}

function formatStoreRepoSelection(store) {
	return store.name || store.id;
}
function formatStoreRepo(store) {
	if (store.loading)
		return store.name;

	var markup = "<div class='select2-result-repository clearfix'>" +
		"<div class='select2-result-repository__avatar'><img src='" + 'res/warehouse.png' + "' /></div>" +
		"<div class='select2-result-repository__meta'>" +
		"<div class='select2-result-repository__title'>" + store.name + "</div>";

	if (store.street) {
		markup += "<div class='select2-result-repository__description'>" + store.street + "</div>";
	}

	markup += "<div class='select2-result-repository__statistics'>" +
	"<div class='select2-result-repository__forks'><i class='fa fa-flash'></i> " + store.city + " </div>" +
	"<div class='select2-result-repository__stargazers'><i class='fa fa-star'></i> " + store.state + " </div>" +
	"<div class='select2-result-repository__watchers'><i class='fa fa-eye'></i> " + store.zip + "</div>" +
	"</div>" +
	"</div></div>";

	return markup;
}

function formatItemRepoSelection(item) {
	return item.name || item.id;
}
function formatItemRepo(item) {
	var store = $(".js-store-data").select2('data')[0].name;
	if (item.loading)
		return item.name;

	var markup = "<div class='select2-result-repository clearfix'>" +
		"<div class='select2-result-repository__avatar'><img src='" + 'res/item.png' + "' /></div>" +
		"<div class='select2-result-repository__meta'>" +
		"<div class='select2-result-repository__title'>" + item.name + "</div>";

	if (item.catagory) {
		markup += "<div class='select2-result-repository__description'>" + item.catagory + " | " + item.subcatagory + "</div>";
	}

	markup += "<div class='select2-result-repository__statistics'>" +
	"<div class='select2-result-repository__forks'><i class='fa fa-flash'></i> $" + item.price + " </div>";
	if (store) {
		markup += "<div class='select2-result-repository__watchers'><i class='fa fa-eye'></i> in stock @ [" + store + "]</div>";
	}
	markup += "</div>" +
	"</div></div>";

	return markup;
}
