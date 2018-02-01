var graph_ABC_toggle = false;
var toggle_axis_price = true;
function axis_price(change_axis,linearScaleX,linearScaleY){
  if(toggle_axis_price){
    //add axis to svg
    var gx = change_axis.append('g')
      .attr('class','axis_x_price')
      .attr("transform", "translate(0," + (window.innerHeight -25) + ")")
      .call(customXAxis)
      .transition().duration(10/2)
      .style("opacity", 0)
      .transition()
      .ease(d3.easeQuad)
      .duration(4000)
      .style("opacity", 1)
    function customXAxis(g) {
        g.call(d3.axisTop(linearScaleX).tickValues([13, 27]));
        g.selectAll('.tick line').attr('y2','-'+(window.innerHeight -100)).attr("stroke-dasharray", "2,10").style('z-index',3);
        g.selectAll(".tick text").attr("x", 10).attr("dy", 4);

        g.append('text')
          .attr('y',15)
          .attr('x',parseFloat(g.select('path').attr('d').match(/[^M].+,/g)))
          .attr('text-anchor','start')
          .style('font-size','0.558rem')
          .text('Sanitation Score')
      }

    var gy = change_axis.append('g')
      .attr('class','axis_y_price')
      .attr("transform", "translate("+25 +",0)")
      .call(customYAxis)
      .transition().duration(10/2)
      .style("opacity", 0)
      .transition()
      .ease(d3.easeQuad)
      .duration(4000)
      .style("opacity", 1)
    function customYAxis(g){
        g.call(d3.axisLeft(linearScaleY)
          .tickValues([0,1,2,3,4])
        )
        g.select(".domain").remove();

        g.selectAll(".tick text").attr("y", -10).attr("x", 0).style('font-size','.438rem').selectAll(function(d,i){
          d3.select(this).attr('text-anchor','start').style('font-size',12)
          if(i == 0){d3.select(this).text("unknown price tier")}
          if(i == 1){d3.select(this).text("$")}
          if(i == 2){d3.select(this).text("$$")}
          if(i == 3){d3.select(this).text("$$$")}
          if(i == 4){d3.select(this).text("$$$$")}
        });
        g.selectAll(".tick line").remove();
    }
    toggle_axis_price = false;
  }
}

var third_button_clicked = false;

var temp_svg_search, temp_svg_search_g,gradient,click_t = true,toggle_stroke = false,
svg_search_toggle = true,
toogle_axis_search = false,
total_point_voronoi=[];
var options,fuse;
var current_scale;
// var button_back_to_wheel = false;
var grid = false, normal = true;
var tick_increment = 0;
mapboxgl.accessToken = 'pk.eyJ1IjoiamlhaGFvMDExMjEiLCJhIjoiY2l6bjI5ZHI1MDJkYzJxbzg1NXJmYWxvMSJ9.AhMpv-yiSAvqlo7bi2UBig';
var map_toggle = true,
	map_setup_toggle = false,
	map_ready = false,
	map;

var graph,
    data,
    code_correspond_description;

var canvas,
    svg,
    context,
    width,
    height,
    transform;

var simulation,tooltip;

var node_pointed,
    link_associated  = [],
    node_associated = [],
    node_for_text = {id : "arbitrary"},
    node_for_violation = '',
    node_pointed_previous = {id : "__arbitrary"},
    node_associated_previous = [{id:'arbitrary'}];

var toggle_color_for_last_inspect = false,
    toggle_mv = true;

var rating_max = 9.7,
    rating_min = 4.5,
    color_for_rating = d3.scaleLinear()
    .domain([rating_min, rating_max])
    .range(["#FF6701", "#00B551"]);
var add_search_exit = _.once(function (){
  d3.select('#infoPanel_container')
      .append('button')
      .attr('class','search_exit_button')
      .style('opacity','1')
      .text('X')
})
function p5_map(n, start1, stop1, start2, stop2) {
  return ((n-start1)/(stop1-start1))*(stop2-start2)+start2;
};
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  if (typeof stroke == 'undefined') {
    stroke = true;
  }
  if (typeof radius === 'undefined') {
    radius = 5;
  }
  if (typeof radius === 'number') {
    radius = {tl: radius, tr: radius, br: radius, bl: radius};
  } else {
    var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
    for (var side in defaultRadius) {
      radius[side] = radius[side] || defaultRadius[side];
    }
  }
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
  if (fill) {
    ctx.fill();
  }
}

function jquery(){
  $('#infoPanel_vio_analyze').css('display','none');
  $('#infoPanel_vio_analyze_num').css('display','none');
  $('#infoPanel_vio_code').css('display','none');
  $('#infoPanel_vio_des').css('display','none');
  $('.mousemover_violation').css('display','none');

  $('.dark_side').css('display','block')
  $('.rating').css('display','')
  $('#mapbox').css('display','block')

  d3.select("#infoPanel_Data_name").transition().duration(10/2)
    .style("opacity", 0)
    .transition().duration(1000/2)
    .style("opacity", 1)
  $('#infoPanel_Data_name').text(node_for_text.name).css('display','')
  $('#restaurant_link_url').attr('href',node_for_text.url)
  $('#restaurant_link').css('display','block')
  d3.select("#price_tier").transition().duration(10/2)
    .style("opacity", 0)
    .transition().duration(1000/2)
    .style("opacity", 1)
  if(node_for_text.price == 1){
      $('#price_tier').text("$").css('display','')
  }else if (node_for_text.price == 2) {
      $('#price_tier').text("$$").css('display','')
  }else if (node_for_text.price == 3) {
      $('#price_tier').text("$$$").css('display','')
  }else if (node_for_text.price == 4) {
      $('#price_tier').text("$$$$").css('display','')
  }else if (node_for_text.price == 5) {
      $('#price_tier').text("$$$$$").css('display','')
  }else if (node_for_text.price == null || node_for_text.price == undefined) {
      $('#price_tier').text("unknown").css('display','')
  }
  d3.select("#likes").transition().duration(10/2)
    .style("opacity", 0)
    .transition().duration(1000/2)
    .style("opacity", 1)
  $('#likes').text(node_for_text.likes+ " likes").css('display','')


  d3.select("#infoPanel_Location").transition().duration(10/2)
    .style("opacity", 0)
    .transition().duration(1000/2)
    .style("opacity", 1)
  $('#infoPanel_Location').text("Address:   "+node_for_text.address+", "+node_for_text.boro+", "+node_for_text.postcode).css('visibility','visible')

  d3.select("#infoPanel_Category").transition().duration(10/2)
    .style("opacity", 0)
    .transition().duration(1000/2)
    .style("opacity", 1)
  $('#infoPanel_Category').text("Category:   "+node_for_text.categories).css('visibility','visible')

  var ago = moment.duration(moment().diff(node_for_text.violation.recentTime)).humanize() + " ago";
  d3.select("#infoPanel_LastInspect").transition().duration(10/2)
    .style("opacity", 0)
    .transition().duration(1000/2)
    .style("opacity", 1)
  $('#infoPanel_LastInspect').text("last time sanitary inspection:   "+ago).css('visibility','visible')
  /*****************************************************************
  * overflow dark_side;
  *
  *****************************************************************/
  d3.select(".dark_side_list")
    .selectAll('li')
    .remove()
  var item = d3.select('.dark_side_list')
    .selectAll('li')
    .data(node_for_text.violation.historyVCode)
    .enter()
    .append('li')
    .transition().duration(10/2)
    .style("opacity", 0)
    .transition().duration(1000/2)
    .style("opacity", 1)
    .attr('class','dark_item')
    .text(function(d){ return "problem code: "+ d +" -- "+ code_correspond_description[d]})
  /*****************************************************************
  * overflow rating;
  *
  *rating indicator;
  *****************************************************************/
  var pdl="";
  if(Number.isInteger(node_for_text.rating)){pdl = "15px" }else{ pdl = "12px"};
      d3.select("#rating_score_text").text(node_for_text.rating + " / 10")
        .style('font-size','0.5em')
        .style('color','white')
        .style('text-align','center')
        .style('position','absolute')
        .style('margin-top','5px')
        .style('padding-left',pdl)

      d3.select('#rating_score_block')
        .style('background-color',color_for_rating(node_for_text.rating))
  /*****************************************************************
  * overflow rating;
  *
  * positive
  *****************************************************************/
  d3.select(".rating_list_positive")
    .selectAll('li')
    .remove()

  d3.select('.rating_list_positive')
    .selectAll('li')
    .data(_.where(node_for_text.text,{type:'liked'}))
    .enter()
    .append('li')
    .transition().duration(10/2)
    .style("opacity", 0)
    .transition().duration(1000/2)
    .style("opacity", 1)
    .attr('class','rating_pos_item')
    .text(function(d){
        if(d.type == "liked"){
          if(d.text_extract.length == 0){
            return "no key word for this positive review"
          }else{
            return d.text_extract.join(' - ');
          }
        }
    })
    $('#meh_button').click(function(){
        $('#meh_button').css('text-decoration','underline')
        $('#positive_button').css('text-decoration','none')
        $('#negative_button').css('text-decoration','none')
      d3.select(".rating_list_positive")
        .selectAll('li')
        .remove();
      d3.select('.rating_list_positive')
        .selectAll('li')
        .data(_.where(node_for_text.text,{type:'meh'}))
        .enter()
        .append('li')
        .transition().duration(10/2)
        .style("opacity", 0)
        .transition().duration(1000/2)
        .style("opacity", 1)
        .attr('class','rating_pos_item')
        .text(function(d){
            if(d.type == "meh"){
              if(d.text_extract.length == 0){
                return "no key word for this meh review"
              }else{
                return d.text_extract.join(' - ');
              }
            }
        })
    })
    $('#negative_button').click(function(){
        $('#meh_button').css('text-decoration','none')
        $('#positive_button').css('text-decoration','none')
        $('#negative_button').css('text-decoration','underline')
      d3.select(".rating_list_positive")
        .selectAll('li')
        .remove();
        console.log("negative act");

      d3.select('.rating_list_positive')
        .selectAll('li')
        .data(_.where(node_for_text.text,{type:'disliked'}))
        .enter()
        .append('li')
        .transition().duration(10/2)
        .style("opacity", 0)
        .transition().duration(1000/2)
        .style("opacity", 1)
        .attr('class','rating_pos_item')
        .text(function(d){
            if(d.type == "disliked"){
              if(d.text_extract.length == 0){
                return "no key words for this negative review"
              }else{
                return d.text_extract.join(' - ');
              }
            }
        })
    })
    $('#positive_button').click(function(){

        $('#meh_button').css('text-decoration','none')
        $('#positive_button').css('text-decoration','underline')
        $('#negative_button').css('text-decoration','none')
      d3.select(".rating_list_positive")
        .selectAll('li')
        .remove()

      d3.select('.rating_list_positive')
        .selectAll('li')
        .data(_.where(node_for_text.text,{type:'liked'}))
        .enter()
        .append('li')
        .transition().duration(10/2)
        .style("opacity", 0)
        .transition().duration(1000/2)
        .style("opacity", 1)
        .attr('class','rating_pos_item')
        .text(function(d){
            if(d.type == "liked"){
              if(d.text_extract.length == 0){
                return "no key word for this positive review"
              }else{
                return d.text_extract.join(' - ');
              }
            }
        })
    })



  	/********************************* Map start *********************************/
  	if(tick_increment > 20){
		if(map_toggle){
			$("#map_repleaser").css('display','none')
			 map = new mapboxgl.Map({
			  style: 'mapbox://styles/jiahao01121/cj1trhr1j001y2st2zso35lyp',
			  // attributionControl: false,
			  center: [-73.99746894836426, 40.714183527347096],
			  zoom: 12.366671128219522,
			  pitch: 45,
			  bearing: -17.6,
			  container: 'mapbox'
			});
			map_toggle = false;
			map.on('load', function () {
				console.log("done load base map");
				map_setup_toggle = true;
			})
		}
	}
	if(!map_toggle){
  		if(map_setup_toggle){
  			map.addSource('point', {
  			  "type": "geojson",
  			  "data": {"type": "Point","coordinates": [-73.98605346679688, 40.755222049021405]}
  					});
  			map.addLayer({
  			  "id": "point",
  			  "source": "point",
  			  "type": "circle",
  			  "paint": {
  				  "circle-radius": 3,
  				  "circle-color": "#fff",
  				  "circle-opacity": .8,
  				  "circle-pitch-scale": "map"}
  		  	});
  			map_setup_toggle = false;
  			map_ready = true;
  		};
  	if(map_ready){
  		map.getSource('point').setData({
  			"type": "Point",
  			"coordinates": [node_for_text.lng, node_for_text.lat]});
  		map.flyTo({
  			center: [node_for_text.lng,node_for_text.lat],
  			zoom:12});
  	}
	}
	/********************************* Map end *********************************/
};

function jquery_vio(){
  // console.log(node_for_violation);

  d3.select("#infoPanel_vio_code").transition().duration(10/2)
    .style("opacity", 0)
    .transition().duration(1000/2)
    .style("opacity", 1)
  $('#infoPanel_vio_code').text("Sanitation Problem Category: "+node_for_violation).css('display' , "inline")
  d3.select("#infoPanel_vio_des").transition().duration(10/2)
    .style("opacity", 0)
    .transition().duration(1000/2)
    .style("opacity", 1)
  $('#infoPanel_vio_des').text(code_correspond_description[node_for_violation]).css('display','inline');
  d3.select("#infoPanel_vio_analyze").transition().duration(10/2)
    .style("opacity", 0)
    .transition().duration(1000/2)
    .style("opacity", 1)
  $('#infoPanel_vio_analyze').text("Total number of restaurant contains this sanitation problem:").css('display','inline');
  d3.select("#infoPanel_vio_analyze_num").transition().duration(10/2)
    .style("opacity", 0)
    .transition().duration(1000/2)
    .style("opacity", 1)
  $('#infoPanel_vio_analyze_num').text(link_associated.length).css('display','block');
  $('.mousemover_violation').css('display','');

  /**************************************** restaurant list ************************************************/
  var partial;
  partial = _.compact(link_associated).splice(0,25);
  // console.log(link_associated);
  d3.select(".mousemover_violation_list")
    .selectAll('li')
    .remove()
  var item = d3.select('.mousemover_violation_list')
    .selectAll('li')
    .data(partial)
    .enter()
    .append('li')
    .transition().duration(10/2)
    .style("opacity", 0)
    .transition().duration(1000/2)
    .style("opacity", 1)
    .attr('class','mousemover_violation_item')
    .text(function(d){ return data[+d.target.id].name } )

    $('#mousemover_violation_button').click(function(){
      d3.select(".mousemover_violation_list")
        .selectAll('li')
        .remove()
      var item = d3.select('.mousemover_violation_list')
        .selectAll('li')
        .data(link_associated)
        .enter()
        .append('li')
        .transition().duration(10/2)
        .style("opacity", 0)
        .transition().duration(1000/2)
        .style("opacity", 1)
        .attr('class','mousemover_violation_item')
        .text(function(d){ return data[+d.target.id].name } )
    })
  /**************************************** restaurant list end ************************************************/
    $('#infoPanel_Data_name').css('display','none')
    $('#restaurant_link').css('display','none')
    $('#price_tier').css('display','none')
    $('#likes').css('display','none')
    $('#infoPanel_Location').css('visibility','hidden')
    $('#infoPanel_Category').css('visibility','hidden')
    $('#infoPanel_LastInspect').css('visibility','hidden')
    $('.dark_side').css('display','none')
    $('.rating').css('display','none')
    d3.select("#mapbox").transition().duration(10/2)
      .style("opacity", 0)
      .transition().duration(1000/2)
      .style("opacity", 1)
    $('#mapbox').css('display','none')
    // console.log(code_correspond_description[id]);
}

function drawLink(d){
  context.moveTo(d.source.x, d.source.y);
  context.lineTo(d.target.x,d.target.y);


};

function drawNode_inspc(d) {
  if(d.gr == 'v' ){
    context.fillStyle = "#970ac6";
    context.font = "900 22px Miller-DisplayItalic"; //Miller-DisplayItalic
    context.textAlign = "center";
    context.fillText(d.id,d.x,d.y+10);
    // context.moveTo(d.x + 10, d.y);
    // context.arc(d.x, d.y, 10, 0, 2 * Math.PI);
  }
};

function drawNode_button_last_inspect(d) {
  // console.log(data[d.id]);
  if(d.gr == 'r' ){
    if(data[d.id] !== undefined){
      context.beginPath();
      context.moveTo(d.x + 3, d.y);
      context.arc(d.x, d.y, 3, 0, 2 * Math.PI);
      if(data[d.id].violation.color_for_last_inspect){
          context.fillStyle = data[d.id].violation.color_for_last_inspect;
      }else
      {
          context.fillStyle = '#fff'
      }
      context.fill();
      context.strokeStyle = '#1b1f3a'
      context.stroke();
    }
  }
};

function drawNode_restaurant_A(d) {
  if(d.gr == 'r' ){
    if(d.gd <=13){
      context.moveTo(d.x + 3.3, d.y);
      context.arc(d.x, d.y, 3.3, 0, 2 * Math.PI);
    }
  }
};

function drawNode_restaurant_B(d) {
  if(d.gr == 'r' ){
    if(d.gd >13 && d.gd <=27){
      context.moveTo(d.x + 3.3, d.y);
      context.arc(d.x, d.y, 3.3, 0, 2 * Math.PI);
    }
  }
};

function drawNode_restaurant_C(d) {
  if(d.gr == 'r' ){
    if(d.gd >27 ){
      context.moveTo(d.x + 3.3, d.y);
      context.arc(d.x, d.y, 3.3, 0, 2 * Math.PI);
    }
  }
};

function drawNode_interact(d) {
  if(d.gr == 'r' ){
    // console.log(d)
    context.moveTo(d.x + 5, d.y);
    context.arc(d.x, d.y, 5, 0, 2 * Math.PI);
  }
  if(d.gr == 'v' ) {
    context.fillStyle = "#fff";
    context.font = "900 22px Miller-DisplayItalic"; //Miller-DisplayItalic
    context.fillText(d.id,d.x,d.y+10);
    // context.moveTo(d.x + 10, d.y);
    // context.arc(d.x, d.y, 10, 0, 2 * Math.PI);
  }
};

function removeDuplicates(originalArray, prop) {
  var newArray = [];
  var lookupObject  = {};
  for(var i in originalArray) {
    lookupObject[originalArray[i][prop]] = originalArray[i];
  }
  for(i in lookupObject) {
    newArray.push(lookupObject[i]);
  }
  return newArray;
};

function zoom_init(arg_k, arg_x, arg_y){
  d3.select(canvas).call(zoom.transform, function () {
    /****** MBP 13" ********/
    // {k: 0.36399738724977154, x: 595.7472039203636, y: 371.8993242226453}
    var k_value = 0.34099738724977154,
        w_value = window.innerWidth / (1440 / 595.7472039203636),
        h_value = window.innerHeight / ((748 -40) / 371.8993242226453);
    /****** deckshop" ********/
    if(window.innerHeight > 800 ){
    // {k: 0.48700213427162076, x: 759.3835143163928, y: 483.8403018687343}
      k_value =window.innerHeight / ((983 -40) / 0.44700213427162076);
      w_value = window.innerWidth / (1920 / 859.3835143163928);
      h_value = window.innerHeight / ((983 -40) / 483.8403018687343);
    };
    if(window.innerHeight > 1100 ){
      k_value = window.innerHeight / ((983 - 40) / 0.44700213427162076);
      w_value = window.innerWidth / (1920 / 859.3835143163928);
      h_value = window.innerHeight / ((983 -40) / 483.8403018687343);
    }
    current_scale = arg_k ? arg_k : k_value;

     return d3.zoomIdentity
       .translate(arg_x ? arg_x : w_value,arg_y ? arg_y : h_value)
       .scale(arg_k ? arg_k : k_value)
  })
}


function search_res_append(_data){
  d3.select('#header_filter_univ').transition().duration(500).style('color','rgba(255,255,255,1)')
  d3.select('#filtering_univ_container').style('display','none')
  d3.select('#header_MAP').transition().duration(500).style('color','rgba(255,255,255,1)')
  d3.select('#map_view_container').style('display','none')
  d3.select('#header_sorting').transition().duration(500).style('color','rgba(255,255,255,1)')
  d3.select('#GRAPH_CONTAINER').style('display','none')

  $('.popup_button').click(function(){
    $('.popup_button').css('display','none')
    $('.slide').css('right','-23.063rem')
    $('.popup_button').css('display','none')
    $('.slide').css('opacity',"")
    $('.slide').css('box-shadow',"")
    $('.slide').css('background-color',"")

    // toggle_mv = true;
    // $(".tgl-skewed").prop('checked',false);
  })
    /************************* search list ******************************/
    d3.select('#search_list').style('height','')
    d3.select('#search_list')
      .selectAll('li')
      .remove();

      if(_data){

        d3.select('#search_list').style('height','119px')
        if(_data.length == 0){
          // debugger
          console.log('success')
          d3.select('#search_list').style('height','0px')
        }

          d3.select('#search_list')
            .selectAll('li')
            .data(_data)
            .enter()
            .append('li')
            .attr('class','search_item')
            .text(function(d){return d.name;});

      $('#search_list li').hover(function(){
        $(this).css('background-color',"#ffffff");
        var cores = _data[$(this).index()];
        $(this).append( $( "<span>"+ " Address: "+cores.address +"</span>" ) );
        $(this).children().animate({opacity:1},500);
      },function(){
        $(this).css('background-color',"");
        $(this).children().remove();
      })
    /************************* line chart & click li ******************************/
    $('#search_list li').click(function(){

      var cores = _data[$(this).index()];
      var margin = 100;

      var y = d3.scaleLinear()
      .domain(d3.extent([0,80], function(d) { return d; }))
      .rangeRound([window.innerHeight - $('#tooltip_wheel').height() -80, margin -50])
      var x = d3.scaleLinear()
      .domain(d3.extent(cores.violation.historyScore, function(d,i) { return i; }))
      .rangeRound([28,   parseFloat(d3.select('svg').attr('width')) - margin/2 ])
      /************************* line chart line ******************************/

      var line = temp_svg_search_g
        .append('path')
        .attr('class','line_chart '+ "ID_"+cores.id)
        .datum(cores.violation.historyScore.slice().reverse())
        .attr("fill", "none")
        .attr("stroke", "url(#gradient)")
        .attr("stroke-width", 3)
        .attr("d", d3.line()
          .x(function(d,i) { return x(i); }) // d[0] or i
          .y(function(d) { return  y(d); })
        .curve(d3.curveBundle.beta(1)));
        /************************* line chart line text name ******************************/
        temp_svg_search_g
          .append('text')
          .attr('class','line_discription '+"ID_TEXT"+cores.id)
          .attr('x',x(cores.violation.historyScore.length-1))
          .attr('y',y(cores.violation.historyScore[0]) )
          .attr("text-anchor", "start")
          .attr('width','50')
          .text(cores.name);
        /************************* line chart line text score ******************************/
        temp_svg_search_g
          .append('text')
          .attr('class','line_discription_score  ID_SCORE'+cores.id)
          .attr('x',x(cores.violation.historyScore.length-1) )
          .attr('y',y(cores.violation.historyScore[0]) + 10)
          .attr("text-anchor", "end")
          .style('opacity',0)
          .text("Highest Sanitation Score: " +d3.max(cores.violation.historyScore) );
      /************************* line chart x y axis ******************************/
      if(toogle_axis_search){
          temp_svg_search_g
          .append("g")
          .attr("transform", "translate(0," +( window.innerHeight - $('#tooltip_wheel').height() -80) + ")")
          .call(d3.axisTop(x))
          .attr('class','axis_search_x')
          .selectAll(".tick")
          .remove();

          d3.select('.axis_search_x').append('text')
          .attr('x',parseFloat(d3.select('.axis_search_x path').attr('d').match(/[^M]+.,/g)))
          .attr('y',15)
          .attr("text-anchor", "start")
          .text("One Year Ago");

          var for_y_axis = d3.select('.axis_search_x path').attr('d').match(/H[1-9].{1,}V/g);
          d3.select('.axis_search_x').append('text')
          .attr('x',parseFloat(for_y_axis[0].split("H")[1]))
          .attr('y',15)
          .attr("text-anchor", "end")
          .text("Now");


          var y_ax = temp_svg_search_g
          .append("g")
          .attr("transform", "translate(" +parseFloat(d3.select('.axis_search_x path').attr('d').match(/[^M]+.,/g))+ ",0)")
          .call(d3.axisLeft(y).tickValues([0, 10, 13, 20, 27, 30, 40, 50, 60, 70, 80]))
          .attr('class','axis_search_y')
          .select('.domain')
          .remove();

          d3.select('.axis_search_y .tick')
          .remove();
          /******************** grade division *******************/
          d3.selectAll('.axis_search_y .tick').selectAll(function(d,i){

            if(i ==1 || i == 3){
              d3.select(this).select('line')
                .attr("stroke-dasharray", "2,10")
                .attr('x2',d3.select('.svg_search').attr('width') - 72)
                if(i ==1){grade_level = "A"}
                if(i ==3){grade_level = "B"}
              d3.select(this).select('text')
                  .text('GRADE ' + grade_level+ ' Level')
                  .attr('text-anchor','middle')
                  .attr('x',d3.select(this).select('line').attr('x2') / 2)
                  .attr('y',9)
                  .style('z-index',100000)
            }
            if(i == 9 ){
              d3.select(this).select('line')
                .attr("stroke-dasharray", "2,10")
                .attr('x2',d3.select('.svg_search').attr('width') - 72)
              d3.select(this).append('text')
                  .text('GRADE ' + "C"+ ' Level')
                  .attr('text-anchor','middle')
                  .attr('x',d3.select(this).select('line').attr('x2') / 2)
                  .attr('y',10)
                  .style('z-index',100000)
            }
          })

          d3.select('.axis_search_y')
          .append("text")
          .attr("fill", "#fff")
          // .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .attr("dy", "1.71em")
          .attr('x','-14')
          .attr("text-anchor", "start")
          .text("Sanitation Score");

          var text_off_chart = d3.select('.svg_search').append('g');
          text_off_chart.append('text')
              .attr("fill", "#fff")
              .attr('x',d3.select('.svg_search').attr('width') -50 )
              .attr('y',d3.select('.svg_search').attr('height') * 0.955 )
              .attr("font-family", "sans-serif")
              .attr("text-anchor", "end")
              .text('Select multiple restaurants to compare')

          text_off_chart.append('text')
              .attr("fill", "#fff")
              .attr('x',d3.select('.svg_search').attr('width') -50 )
              .attr('y',d3.select('.svg_search').attr('height') *0.955 +10 )
              .attr("font-family", "sans-serif")
              .attr('font-size',"10")
              .attr("text-anchor", "end")
              .text('the line chart shows historical inspection record with in one year')


          toogle_axis_search = false;
      }
      var voronoi_correct_array = cores.violation.historyScore.slice().reverse();
      console.log('diclear')
      var feed_voronoi= voronoi_correct_array.map(function(d,i){
        var obj = {};
        obj[i] = d;
        obj.id = cores.id;obj.xScale = x;
        return obj;
      })
      total_point_voronoi.push(feed_voronoi);
      d3.selectAll('.voronoi path').remove();
      d3.selectAll('.voronoi').remove();
      var voronoi = d3.voronoi()
          .x(function(d,i) {return d.xScale(+Object.keys(d)[0]);})
          .y(function(d) {return y(d[Object.keys(d)[0]]); })
          .extent([[50, 50], [$('.svg_search').width()-50, $('.svg_search').height()-100]]);
      var voronoiGroup = temp_svg_search_g.append("g")
          .attr("class", "voronoi");

      /************************* voronoi mouseover ******************************/
      voronoiGroup.selectAll("path")
          .data(voronoi.polygons(  d3.merge(total_point_voronoi.map(function(d) { return d; }))  ))
          .enter().append("path")
          .attr("d", function(d) { return d ? "M" + d.join("L") + "Z" : null; })
          .on("mouseover", function(d){
            // console.log("in");
            d3.selectAll('.line_chart').attr('stroke-opacity',0.15)
            d3.select(".ID_"+d.data.id).attr('stroke-opacity',1)

            d3.selectAll('.line_discription').style('opacity',.2)
            d3.select(".ID_TEXT"+d.data.id).style('opacity',1)
            d3.select('.ID_SCORE'+d.data.id).style('opacity',1)
            node_for_text = data[d.data.id];
            if(click_t){jquery()}
          })
          .on("mouseout", function(d){
            // console.log("out");
            d3.select('.ID_SCORE'+d.data.id).style('opacity',0)
            d3.selectAll(".line_chart").attr('stroke-opacity','1').attr('stroke-width','3')
            d3.selectAll('.line_discription').style('opacity',1);
            d3.select('line_discription_score').style('opacity',0)
          })
          .on('click',function(d){
            d3.select('#header_filter_univ').transition().duration(500).style('color','rgba(255,255,255,1)')
            d3.select('#filtering_univ_container').style('display','none')
            d3.select('#header_MAP').transition().duration(500).style('color','rgba(255,255,255,1)')
            d3.select('#map_view_container').style('display','none')
            d3.select('#header_sorting').transition().duration(500).style('color','rgba(255,255,255,1)')
            d3.select('#GRAPH_CONTAINER').style('display','none')

                if(!click_t){
                  $('.slide').css('right','-23.063rem');
                  console.log("dprese");
                  $('.popup_button').css('display','none');
                  $('.slide').css('opacity',"");
                  $('.slide').css('box-shadow',"")
                  $('.slide').css('background-color',"")
                  $('.slide').css('z-index',2)
                  click_t = true;
                }
                else if(click_t){
                  $('.slide').css('right','2rem')
              		$('.slide').css('background-color',"rgb(27, 31, 58)")
              		$('.slide').css('opacity',"0.92")
              		$('.slide').css('box-shadow',"-31px 8px 180px 2px rgba(14, 16, 33, 0.5)")
                  $('.slide').css('z-index',20)
                  $('.popup_button').css('display','block')
                  $('.popup_button').css('z-index',10000);
                  click_t = false;
                };
          })
    }) //click li on search list
  }
}



function setup(cb){
  /******************************* welcome page ***************************************/
  $('#intro_button').click(function(){
    setTimeout(zoom_init,500)
    d3.select('#intro_page').style('opacity',1)
      .transition()
      .duration(1000)
      .style('opacity',0).on('end',function(){
        d3.select('#intro_page').remove();
        d3.select('#tooltip_wheel').style('visibility','visible')
        d3.select('#nav_container').style('display','block')
        d3.select('#infoPanel_container').style('display','block')
      });
  })
  /******************************* nav bar stuff ***************************************/
    $('#header').mouseenter(function(){
      d3.select(this)
        .transition()
        .duration(350)
        .style('color','rgba(255,255,255,.66)')
    })
    $('#header').mouseleave(function(){
      d3.select(this)
        .transition()
        .duration(350)
        .style('color','rgba(255,255,255,1)')
    })
    $('#header').click(function(){
       location.reload();
    })

    $('#horizontal_header_container #header_filter_univ').mouseenter(function(){
      d3.select(this)
        .transition()
        .duration(500)
        .style('color','rgba(255,255,255,0.66)')
      $('#filtering_univ_container').css('display','block')

      d3.select('#header_MAP').transition().duration(500).style('color','rgba(255,255,255,1)')
      d3.select('#map_view_container').style('display','none')
      d3.select('#header_sorting').transition().duration(500).style('color','rgba(255,255,255,1)')
      d3.select('#GRAPH_CONTAINER').style('display','none')

      d3.selectAll('#filtering_univ_container span')
        .selectAll(function(d,i){
          d3.select(this)
            .style('opacity',0)
            .style('transform','translate(0, ' + '-20px' + ')')
            .transition()
            .duration(500)
            .delay(i*100)
            .style('transform','translate(0, ' + '0px' + ')')
              .style('opacity',1)
        })
    });
    $('#horizontal_header_container #header_filter_univ').mouseleave(function(){
      d3.selectAll('#filtering_univ_container span')
        .selectAll(function(d,i){
          $(this).mouseenter(function(){
            d3.select(this)
              .transition()
              .duration(200)
              .style('opacity',.8)
              .transition()
              .duration(200)
              .style('opacity',1)
            // console.log("hover_sub_item")
          })
          $(this).click(function(){
            d3.select('#filtering_univ_container')
              .style('display','none')
            d3.select('#header_filter_univ').style('color','rgba(255,255,255,1)');
          })
        })
    });

    $('#horizontal_header_container #header_sorting').mouseenter(function(){
      $('#GRAPH_CONTAINER').css('display','block');
      d3.select(this)
        .transition()
        .duration(500)
        .style('color','rgba(255,255,255,0.66)')
      d3.select('#header_filter_univ').transition().duration(500).style('color','rgba(255,255,255,1)')
      d3.select('#filtering_univ_container').style('display','none')
      d3.select('#header_MAP').transition().duration(500).style('color','rgba(255,255,255,1)')
      d3.select('#map_view_container').style('display','none')

      d3.selectAll('#GRAPH_CONTAINER h2').selectAll(function(d,i){
        d3.select(this)
          .style('opacity',0)
          .style('transform','translate(0, ' + '-20px' + ')')
          .transition()
          .duration(500)
          .delay(i*100)
          .style('transform','translate(0, ' + '0px' + ')')
          .style('opacity',1)
      })
      d3.selectAll('#GRAPH_CONTAINER div').selectAll(function(d,i){
        d3.select(this)
          .style('opacity',0)
          .style('transform','translate(0, ' + '-20px' + ')')
          .transition()
          .duration(500)
          .delay(i*100)
          .style('transform','translate(0, ' + '0px' + ')')
          .style('opacity',1)
      })
    });
    $('#horizontal_header_container #header_sorting').mouseleave(function(){
      d3.selectAll('#GRAPH_CONTAINER div')
        .selectAll(function(d,i){
          $(this).click(function(){
            d3.select('#GRAPH_CONTAINER').style('display','none')
            d3.select('#header_sorting').style('color','rgba(255,255,255,1)')
          })
        })
    })

    $('#horizontal_header_container #header_MAP').mouseenter(function(){
      $('#map_view_container').css('display','block')
      d3.select(this)
        .transition()
        .duration(500)
        .style('color','rgba(255,255,255,0.66)')

      d3.select('#header_sorting').transition().duration(500).style('color','rgba(255,255,255,1)')
      d3.select('#GRAPH_CONTAINER').style('display','none')
      d3.select('#header_filter_univ').transition().duration(500).style('color','rgba(255,255,255,1)')
      d3.select('#filtering_univ_container').style('display','none')

      d3.select('#map_view_container')
        .style('opacity',0)
        .style('transform','translate(0, ' + '-20px' + ')')
        .transition()
        .duration(500)
        .style('transform','translate(0, ' + '0px' + ')')
        .style('opacity',1)
    })
    $('#horizontal_header_container #header_MAP').mouseleave(function(){
      $('#map_view_container').click(function(){
        d3.select('#map_view_container').style('display','none')
        d3.select('#header_MAP').style('color','rgba(255,255,255,1)')
      })
    })

/******************************* slide stuff ***************************************/
    $('.slide').css('bottom',function(){
      return (window.innerHeight - parseFloat( $(".slide").css("height")) ) * (1-0.618)
    })
    $('#tooltip_wheel').css('bottom',function(){
      return 50;//(window.innerHeight - parseFloat( $(".slide").css("height")) ) * (1-0.618)
    })
    d3.select('body')
    	.append('canvas')
    	.attr('height',window.innerHeight)
      	.attr('width',window.innerWidth)
		.attr('class','main_visual')
      	.canvas(true);
    canvas = document.querySelector('.main_visual');
    context = canvas.getContext('2d');
    width = canvas.width;
    height = canvas.height;
    transform = d3.zoomIdentity;

    /******** nav bar universe *********/
    $('#plot_inspection').addClass('active');

    /*****************************************************************
    * configure simulation;
    *
    * use this configured simulation on draw_wheel.
    *****************************************************************/
    simulation = d3.forceSimulation()
      .force(  'link', d3.forceLink().id(function(d){ return d.id;})  )
      .force(  'charge', d3.forceManyBody().strength(-140).distanceMax(202).distanceMin(function(d){ return d3.randomUniform(3000)()})  )
      .force(  'Collision', d3.forceCollide(
          function(d){
            if(d.gr == "v"){
              return 25 //20 for circle
            }else{
              return null
            }
          })
      )
      .alpha(  .05  )
      .velocityDecay(  0.2  )
      // .stop();
    tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    /********************|     loading data     |**********************
    * use queue to load data
    *
    * @callback requestCallback
    * @param {number} responseCode
    * @param {string} responseMessage
    *****************************************************************/
    d3.queue()
      .defer(d3.json, 'n_l_v2.json')
      .defer(d3.json, 'mar_25_all_mahat_5233outOf9881.json')
      .defer(d3.json, 'code_correspond_description.json')
      .await(function(err, _graph, _data, _code_correspond_description){ if(err) throw err;
          graph  =  _graph;
          data  =  _data;
          code_correspond_description  =  _code_correspond_description;

          cb();
      }) // queue
};


function draw_wheel(){
  /********** come with random restaurant when load complete **********/
    node_for_text = data[Math.floor(Math.random() *1000)];
    jquery();
    /*****************************************************************
    * search;
    *
    * searching button.
    *****************************************************************/
    options = {shouldSort: true,tokenize: true,threshold: 0.2,location: 0,distance: 500,maxPatternLength: 32,minMatchCharLength: 1,keys: ["name",]};
    fuse = new Fuse(data, options);

    function expand() {
      $(".search").toggleClass("close");
      $(".input").toggleClass("square");
      if ($('.search').hasClass('close')){
              d3.select('#header_filter_univ').transition().duration(500).style('color','rgba(255,255,255,1)')
              d3.select('#filtering_univ_container').style('display','none')
              d3.select('#header_MAP').transition().duration(500).style('color','rgba(255,255,255,1)')
              d3.select('#map_view_container').style('display','none')
              d3.select('#header_sorting').transition().duration(500).style('color','rgba(255,255,255,1)')
              d3.select('#GRAPH_CONTAINER').style('display','none')

              $('.search_exit_button').css('display','block')
              add_search_exit(); //only once
              $('.search_exit_button').click(function(){

                expand();
              })

              $('.mask-on').css('background','-moz-linear-gradient(left,rgba(0, 0, 0, 0.7) 0%,rgba(0, 0, 0, 0.7) 37%,rgb(27, 31, 48) 80%)')
              $('.mask-on').css('background','-webkit-linear-gradient(left, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.7) 37%, rgb(27, 31, 48) 80%)')
              $('.mask-on').css('background','linear-gradient(to left, rgba(0, 0, 0, 0.7) 0%,rgba(0, 0, 0, 0.7) 37%,rgb(27, 31, 48) 80%)')
              $('.mask-on').css('z-index','1');
              $('#tooltip_wheel').css('display','none')
              $('#tooltip_search').css('display','block').css('bottom',function(){return 5;})
              d3.select(".mask-on")
                .transition()
                .ease(d3.easeQuad)
                .duration(100)
                .style("opacity", 1)


              $('input').focus();
              $('#search_list_container').css({'opacity': "1","visibility":''});
              $('#search_list').css('height','')
              toogle_axis_search = true;

              temp_svg_search = d3.select('body').append('svg').attr('width',window.innerWidth-(23*16)).attr('height',window.innerHeight - 60).attr('class','svg_search');
              function grai(){
                if(svg_search_toggle){
                gradient = temp_svg_search.append("defs").append("linearGradient")
                  .attr("id", "gradient")
                  .attr("x1", "0%")
                  .attr("y1", "0%")
                  .attr("x2", "0%")
                  .attr("y2", "100%");
                gradient.append("stop")
                  .attr("offset", "0%")
                  .attr("stop-opacity", "1")
                  .attr("stop-color", "#ff5bff");
                gradient.append("stop")
                  .attr("offset", "10%")
                  .attr("stop-opacity", "1")
                  .attr("stop-color", "#805bff");
                gradient.append("stop")
                  .attr("offset", "100%")
                  .attr("stop-opacity", "0.8")
                  .attr("stop-color", "#1b1f3a");
                svg_search_toggle = false;
                }
              }
              grai();
              temp_svg_search_g = temp_svg_search.append('g');
              search_res_append();
      }
      else{
              d3.select('#header_filter_univ').transition().duration(500).style('color','rgba(255,255,255,1)')
              d3.select('#filtering_univ_container').style('display','none')
              d3.select('#header_MAP').transition().duration(500).style('color','rgba(255,255,255,1)')
              d3.select('#map_view_container').style('display','none')
              d3.select('#header_sorting').transition().duration(500).style('color','rgba(255,255,255,1)')
              d3.select('#GRAPH_CONTAINER').style('display','none')

              $('input').blur();
              total_point_voronoi =[];
              $('.search_exit_button').css('display','none')

              d3.select(".mask-on")
                .transition()
                .duration(500)
                .style("opacity", -1)
                .on('end',function(){
                  $('.mask-on').css('background','');
                  $('.mask-on').css('z-index','-1');})
                $('#tooltip_wheel').css('display','block')
                $('#tooltip_search').css('display','none')

              $('#search_list_container').css({'opacity': "0","visibility":'hidden'});
              $('#search_list').css('height',0)
              d3.selectAll('.svg_search').remove();
              svg_search_toggle = true;
      }
    }

    $("#content").submit(function(e){e.preventDefault()});

    $('#search_button').on('click', expand);

    $('.input').keyup(function(e){
      var search_res = fuse.search(this.value);
      var trim = search_res.splice(0,15);
      // console.log(trim);
      search_res_append(trim);
    })
    /*****************************************************************
    * init wheel position;
    *
    * zoomLevel, position, etc.
    *****************************************************************/
    zoom = d3.zoom()
    	.scaleExtent([.25,1]) //.8
      	.on('zoom',function (){
          transform = d3.event.transform;
          ticked();
      	})
    // zoom_init()
    zoom_init(0.34099738724977154,window.innerWidth /2 ,window.innerHeight /2);
    /*****************************************************************
    * bind simulation;
    *
    * binding nodes & links
    *****************************************************************/
    simulation
    	.nodes(graph.nodes)
      	.on('tick',ticked);
    simulation.force('link')
      	.links(graph.links)
      	.distance(800);
    /*****************************************************************
    * bind drag;
    *
    * important: drag_subject
    *****************************************************************/
    select_canvas = d3.select(canvas)
      .call(d3.drag()
          .container(canvas)
          .subject()
      )
      .call(zoom)
	  // .on("wheel.zoom", null)
      .on('mousemove',mv)
      .on('click',clicked)
    /*****************************************************************
    * keyboard control
    *
    * bind keyboard for zoom;
    * @param {keyboard}
    *****************************************************************/
    Mousetrap.bind(['=', '+', 'pageup'], function() {
      select_canvas
      .call(zoom)
      .on("wheel.zoom", null)
      .call(zoom.scaleTo, transform.k +=.05)
    });
    Mousetrap.bind(['-', 'pagedown'], function() {
      select_canvas
      .call(zoom)
      .on("wheel.zoom", null)
      .call(zoom.scaleTo, transform.k -=.1);
    });

    function clicked(){
      d3.select('#header_filter_univ').transition().duration(500).style('color','rgba(255,255,255,1)')
      d3.select('#filtering_univ_container').style('display','none')
      d3.select('#header_MAP').transition().duration(500).style('color','rgba(255,255,255,1)')
      d3.select('#map_view_container').style('display','none')
      d3.select('#header_sorting').transition().duration(500).style('color','rgba(255,255,255,1)')
      d3.select('#GRAPH_CONTAINER').style('display','none')

      if(!$(".tgl-skewed").is(':checked')){
        $(".tgl-skewed").prop('checked',true)
    		$('.slide').css('right','2rem')
    		$('.slide').css('background-color',"rgb(27, 31, 58)")
    		$('.slide').css('opacity',"0.92")
    		$('.slide').css('box-shadow',"-31px 8px 180px 2px rgba(14, 16, 33, 0.5)")

        $('#positive_button').css('text-decoration','underline')
        $('#meh_button').css('text-decoration','none')
        $('#negative_button').css('text-decoration','none')

    		$('.mask-on').css('background-color','rgba(0, 0, 0, 0.17)')
        $('.mask-on').css('opacity','1')
    		$('.mask-on').css('z-index','1')
    		$('.popup_button').css('display','block')

    		$('.popup_button').click(function(){
          $('.mask-on').css('opacity','0')
    			$('.popup_button').css('display','none')
    			$('.mask-on').css('z-index','-1000');
    			$('.mask-on').css('background-color','')
    			$('.slide').css('right','-23.063rem')
    			$('.popup_button').css('display','none')
    			$('.slide').css('opacity',"")
    			$('.slide').css('box-shadow',"")
    			$('.slide').css('background-color',"")
    			toggle_mv = true;
    			$(".tgl-skewed").prop('checked',false)
    		})
    		$('.mask-on').click(function() {
          $('.mask-on').css('opacity','0')
      		$('.mask-on').css('z-index','-1000');
    			$('.mask-on').css('background-color','')
    			$('.slide').css('right','-23.063rem')
    			$('.popup_button').css('display','none')
    			$('.slide').css('opacity',"")
    			$('.slide').css('box-shadow',"")
    			$('.slide').css('background-color',"")
    			toggle_mv = true;
    			$(".tgl-skewed").prop('checked',false)
    		});
    		Mousetrap.bind(['esc'], function() {
    		  $('.mask-on').css('z-index','-1000');
      		$('.mask-on').css('background-color','')
          $('.mask-on').css('opacity','0')
      		$('.slide').css('right','-23.063rem')
    		  $('.popup_button').css('display','none')
      		$('.slide').css('opacity',"")
      		$('.slide').css('box-shadow',"")
    		  $('.slide').css('background-color',"")
      		toggle_mv = true;
      		$(".tgl-skewed").prop('checked',false)
    		});
      }

      if(toggle_mv){
        toggle_mv = false;
      }else if (!toggle_mv) {
        toggle_mv = true;
      }
    }
    /*****************************************************************
    * mousemover event
    *
    *
    *****************************************************************/
    function mv(){
	    if(normal){
      if(toggle_mv == true){
        var p = d3.mouse(this); //coordinates
        var x = d3.event.x;

        /*****************************************************************
        * variable for pass nodes and related links to fc ticked();
          to update and draw those stuff.
        *
        * pushes link_associated & node_associated.
        *@callback removeDuplicates()
        *****************************************************************/
        (function create_node_link_associated(){
            node_pointed = simulation.find(transform.invertX(p[0]), transform.invertY(p[1]));
            link_associated = [];
            node_associated = [];
            graph.links.forEach(function(d){
                if(
                  d.source.index == node_pointed.index || d.target.index == node_pointed.index
                  ){
                    link_associated.push(d);
                    graph.nodes.forEach(function(d2){
                        if(d2.index == d.source.index || d2.index == d.target.index){
                           node_associated.push(d2);
                        };
                    });
                };
            });
            //here can pass previous data.
            node_associated = removeDuplicates(node_associated,"id");
            if(node_pointed !== undefined) {
              ticked();
              if(node_pointed.gr){
                if(node_pointed_previous.id !== node_pointed.id){
                  node_pointed_previous = node_pointed;
                  if(node_pointed.gr == 'v'){
                  // draw_vio_tooltip(node_pointed);
                  }
                  if(node_pointed.gr == 'r'){
                  //   draw_tooltip_mouseover_r()
                  }
                }
              }
            }
        })();
        //add text
        if(!isNaN(+node_pointed.id)){
          if(node_for_text.id !== +node_pointed.id){
            node_for_text = data[+node_pointed.id];
            jquery();
          }
          if(node_for_text.id == +node_pointed.id){
            node_for_text = data[+node_pointed.id];
          }
        }
        if(isNaN(+node_pointed.id)){
          if(node_for_violation !== node_pointed.id){
              node_for_violation = node_pointed.id;
            //   console.log(node_for_violation);
              jquery_vio();
          }
          if(node_for_violation == node_pointed.id){
            node_for_violation = node_pointed.id
          }
        }
      }
    }
  }

  // main fc.
  function ticked(){
	 if(normal){
      context.save();
      context.clearRect(0,0,width,height);
      context.translate(transform.x,transform.y);
      context.scale(transform.k,transform.k);

      //violations point
      context.beginPath();
      graph.nodes.forEach(drawNode_inspc);

      context.fillStyle = '#970ac6';
      context.fill();
      context.strokeStyle = '#1b1f3a';
      context.lineWidth =.5;
      context.stroke();

      context.fillStyle = '#970ac6';
      context.fill();
      //restaurants point: A
      context.beginPath();
      graph.nodes.forEach(drawNode_restaurant_A);
      context.fillStyle = '#cd772c'
      context.fill();
      context.strokeStyle = '#1b1f3a'
      context.stroke();
      //restaurants point: B
      context.beginPath();
      graph.nodes.forEach(drawNode_restaurant_B);
      context.fillStyle = '#297aef'
      context.fill();
      context.strokeStyle = '#1b1f3a'
      context.stroke();
      //restaurants point: C
      context.beginPath();
      graph.nodes.forEach(drawNode_restaurant_C);
      context.fillStyle = '#2aff50'
      context.fill();
      context.strokeStyle = '#1b1f3a'
      context.stroke();

      //interaction links
      if(link_associated.length !== 0){

          context.beginPath();
          link_associated.forEach(drawLink)
          context.strokeStyle = "rgba(151, 10, 198,1)";
          context.stroke();
      }
      //interaction nodes:
      if(node_associated.length !== 0){
        if(node_pointed.gr == 'r'){
            context.beginPath();
            node_associated.forEach(drawNode_interact);
            context.fillStyle = '#ffffff';  //"#09f2bf"
            context.fill();
        }
        if(node_pointed.gr == 'v'){
            context.beginPath();
            node_associated.forEach(drawNode_interact);
            context.fillStyle = '#ffffff';  //"#09f2bf"
            context.fill();
        }
      }
    //button for last inspect color
    if(toggle_color_for_last_inspect == true){
      graph.nodes.forEach(drawNode_button_last_inspect);
    }
    context.restore();



    tick_increment++;
	  function getRandomIntInclusive(min, max) {
	  	min = Math.ceil(min);
	  	max = Math.floor(max);
		return Math.floor(Math.random() * (max - min + 1)) + min;
	  }
	   if(tick_increment > getRandomIntInclusive(20,35)){
		     simulation.stop();
	   }
	   }

	  if(grid){
	      context.save();
	      context.clearRect(0,0,width,height);
        context.beginPath();

        if(graph_ABC_toggle){
          context.fillStyle = "rgba(255, 255, 255, .2)";
          context.font = "900 120px futura"; //Miller-DisplayItalic
          context.textAlign = "left";
          context.fillText(" A",graph.nodes[5170+65].x_scatter,graph.nodes[4492+66].y_scatter);
          context.fillText(" B",graph.nodes[997+76].x_scatter,graph.nodes[4492+66].y_scatter);
          context.fillText(" C",graph.nodes[210+78].x_scatter,graph.nodes[4492+66].y_scatter);
        }

	      graph.nodes.forEach(function(d) {
            if(d.gr == 'v'){

              context.fillStyle = "rgba(151, 10, 198, "+ d.circle_opacity+")";
              context.font = "900 " +22*transform.k +"px"+ " Miller-DisplayItalic"; //Miller-DisplayItalic
              context.textAlign = "center";
              context.fillText(d.id,d.x * transform.k + transform.x,
                d.y * transform.k + transform.y
                +(10 *transform.k));
            }
    	  	  if(d.gr == 'r' ){
                context.beginPath();

    	  	      context.moveTo(d.x_draw +
                  // (3 / transform.k)
                  d.circle_size * transform.k
                  ,
                  d.y_draw
                );
    	  	      context.arc(d.x_draw,
                  d.y_draw,
                  // (3 / transform.k)
                  d.circle_size * transform.k
                  ,
                  0,
                  2 * Math.PI
                );
                context.fillStyle = d.color;
        	      context.fill();
    	  	  }
	  	  });
        if(toggle_stroke){
          context.lineWidth = 1*transform.k;
          context.strokeStyle = '#1b1f3a';
        }else{
          context.strokeStyle = "rgba(27, 31, 58,0.575)";
        }
        context.stroke();


	      context.restore();

	  }
  } //ticked


  $('.test').click(click_for_test_n_following); //button_grid AKA test

  $('.following_test').click(click_for_test_n_following);

  $('#header_sorting').click(click_for_test_n_following);
  function click_for_test_n_following(){

    d3.selectAll('.axis').style('visibility','');
    d3.selectAll('#axis_y').style('visibility','');

    $('#plot_rating').addClass('active')
    $('#plot_rating_following').addClass('active');
    $('#plot_inspection').removeClass('active');
    $('#plot_price').removeClass('active');
    if(third_button_clicked){
      d3.selectAll(".axis_x_price")
        .transition()
        .ease(d3.easeQuad)
        .duration(1000)
        .style("opacity", 0)
        .on('interrupt',function(){
          d3.active(this).style('visibility','hidden');
        });
      d3.selectAll(".axis_y_price")
        .transition()
        .ease(d3.easeQuad)
        .duration(1000)
        .style("opacity", 0).on('interrupt',function(){
          d3.active(this).style('opacity',1).style('visibility','hidden');
        });
    }
    if(third_button_clicked){
      svg = d3.select('.sub_visual');
    }else{
      svg = d3.select('body').append('svg').attr('class','sub_visual')
        .attr('width',width)
        .attr('height',height)
    };
    $('#tooltip_wheel').css('display','none')



    $('#tooltip_plot_grade_rating')
      .css('display','block')
      .css('left',window.innerWidth - 400 - $('#tooltip_plot_grade_rating').width())
      .css('bottom',function(){return 50 });
    d3.select("#tooltip_plot_grade_rating")
      .transition().duration(10/2)
      .style("opacity", 0)
      .transition()
      .ease(d3.easeQuad)
      .duration(4000)
      .style("opacity", 1)
    /********************************** compute scatter plot ****************************************/
	  var vio_s = graph.nodes.map(function(d){if(!isNaN(+d.id)){ return data[+d.id].violation.recentScore;}});
	  vio_s.splice(0,78);
	  var vio_s_max = d3.max(vio_s)
	  var vio_s_min = d3.min(vio_s)


	  var rate = graph.nodes.map(function(d){if(!isNaN(+d.id)){return data[+d.id].rating;}});
	  rate.splice(0,78);
	  var rate_max = d3.max(rate)
	  var rate_min = d3.min(rate)
	  var linearScaleX = d3.scaleLinear()
      .domain([vio_s_min,vio_s_max])
      .range([55 , window.innerWidth - 400]);
	  var linearScaleY = d3.scaleLinear()
      .domain([rate_max,rate_min])
      .range([60 + 20, window.innerHeight - 35]);
    graph.nodes.forEach(function(d){
	    if(d.gr == "r"){
        d.x_wheel = d.x;
        d.y_wheel = d.y;
		    d.x_draw = 0;
    	  d.y_draw = 0;
        d.circle_size = 0;
        d.circle_opacity =0;
        d.x_scatter = linearScaleX(data[+d.id].violation.recentScore);
        d.y_scatter = linearScaleY(data[+d.id].rating);
        d.color = '';
	    }
      if(d.gr == "v"){
        d.x_wheel = d.x;
        d.y_wheel = d.y;
      }
    });

    var gx = svg.append('g')
      .attr('class','axis')
      .attr("transform", "translate(0," + (window.innerHeight -25) + ")")
      .call(customXAxis)
      .transition().duration(10/2)
      .style("opacity", 0)
      .transition()
      .ease(d3.easeQuad)
      .duration(4000)
      .style("opacity", 1)

    function customXAxis(g) {
        g.call(d3.axisTop(linearScaleX)
            .tickValues([13, 27])
              );
        g.selectAll('.tick line').attr('y2','-'+(window.innerHeight -(70+30))).attr("stroke-dasharray", "2,10").style('z-index',3);
        g.selectAll(".tick text").attr("x", 10).attr("dy", 4);

        g.append('text')
          .attr('y',15)
          .attr('x',parseFloat(g.select('path').attr('d').match(/[^M].+,/g)) -40.5)
          .attr('text-anchor','start')
          .style('font-size','0.75rem')
          .style('font-family','futura')
          .text('Sanitation Score')
      }

    var gy = svg.append('g')
      .attr('id','axis_y')
      .attr("transform", "translate("+45 +",0)")
      .call(customYAxis)
      .transition().duration(10/2)
      .style("opacity", 0)
      .transition()
      .ease(d3.easeQuad)
      .duration(4000)
      .style("opacity", 1)

    function customYAxis(g){
        g.select(".domain").remove();
        g.call(d3.axisLeft(linearScaleY))
        g.selectAll(".tick text").attr("y", -10).attr("x", 0).style('font-size','.438rem');

        g.select('.tick')
          .append('text')
          .attr('y',(g.select('.tick').select('text').attr('y') -25 + 61))
          .attr('x',(g.select('.tick').select('line').attr('x2') -7))
          .attr('dy','0.32em')
          .attr('text-anchor','start')
          .style('font-size','0.75rem')
          .style('font-family','futura')
          .attr('transform','rotate(90)')
          .text('Foursquare Rating')
      }
    /***************************************** animation *******************************************/
    current_scale = transform.k;
    var interpolate_A = d3.scaleQuantize()
        .domain([0, 1])
        .range(d3.quantize(d3.interpolateRgb('rgb(205, 119, 44)','rgb(254, 77, 1)'),4));
    var interpolate_B = d3.scaleQuantize()
        .domain([0, 1])
        .range(d3.quantize(d3.interpolateRgb('rgb(41, 122, 239)','rgb(254, 77, 1)'),4));
    var interpolate_C = d3.scaleQuantize()
        .domain([0, 1])
        .range(d3.quantize(d3.interpolateRgb('rgb(42, 255, 80)' ,'rgb(254, 77, 1)'),4));

    var timer = d3.timer(
          function(e){
          normal = false;
          grid = true;
          var t = Math.min(1,d3.easeCubicInOut(e/3000));
          if(third_button_clicked){
            graph.nodes.forEach(function(d){
              // 1-t is starterpoint t is endding point
              d.x_draw = d.x_price_force * (1-t)
              + d.x_scatter * t;

              d.y_draw = d.y_price_force * (1-t)
              + d.y_scatter * t;

              d.circle_size =3/transform.k
              //  p5_map(t,0,1,3-(1*transform.k),3/transform.k);

              d.circle_opacity = Math.round(p5_map(t,0,.999,1,0.3) *10) /10;

              d.color = 'rgba(254, 77, 1,.3)';

              if(d.gr == 'v'){ d.circle_opacity=0}
            });
          }else{
            graph.nodes.forEach(function(d){
              // 1-t is starterpoint t is endding point
              d.x_draw = (d.x_wheel * transform.k + transform.x) * (1-t)
              + d.x_scatter * t;

              d.y_draw = (d.y_wheel * transform.k + transform.y) * (1-t)
              + d.y_scatter * t;

              d.circle_size = p5_map(t,0,1,3-(1*transform.k),3/transform.k);

              d.circle_opacity = Math.round(p5_map(t,0,.999,1,0.3) *10) /10;
              if(d.gd <=13){
                d.color = interpolate_A(t).split('(');
                d.color[0] = d.color[0].replace(/rgb/g,'rgba(');
                d.color[1] = d.color[1].replace(/\)/g,', '+ d.circle_opacity + ')');
                d.color = d.color.join('');
              };
              if(d.gd>13 && d.gd<=27){
                d.color = interpolate_B(t).split('(');
                d.color[0] = d.color[0].replace(/rgb/g,'rgba(');
                d.color[1] = d.color[1].replace(/\)/g,', '+ d.circle_opacity + ')');
                d.color = d.color.join('');
              };
              if(d.gd > 27){
                d.color = interpolate_C(t).split('(');
                d.color[0] = d.color[0].replace(/rgb/g,'rgba(');
                d.color[1] = d.color[1].replace(/\)/g,', '+ d.circle_opacity + ')');
                d.color = d.color.join('');
              };
              if(d.gr == 'v'){ d.circle_opacity=Math.round(p5_map(t,0,.2,1,0) *10) /10}
            });
          }


          if(t >=0 && t<0.7){
            toggle_stroke = true;
          }
          ticked();
          if (t === 1) {
            timer.stop();
            toggle_stroke = false;
            third_button_clicked = false;
            graph_ABC_toggle = true;
            ticked();
          }
        })
    /***************************************** find *******************************************/
    var tree = d3.quadtree()
      .extent([[0, 0], [window.innerWidth, window.innerHeight]])
      .x(function(d) { return d.x_scatter})
      .y(function(d) { return d.y_scatter})
      .addAll(graph.nodes);
      if(third_button_clicked){
        var canvas_temp = document.querySelector('.temporary');
        var context_temp = canvas_temp.getContext('2d');
      }else{
        if(d3.select('.temporary')._groups[0][0] == null){
          d3.select('body')
              .append('canvas')
              .attr('height',window.innerHeight)
              .attr('width',window.innerWidth)
              .attr('class','temporary')
              .canvas(true);
          var canvas_temp = document.querySelector('.temporary');
          var context_temp = canvas_temp.getContext('2d');
          $('.temporary').css('z-index',1)

        }
      }
    /***************************************** second canvas *******************************************/
    var featured_point=[];
    d3.select('.temporary').on('mousemove',grid_mv);
    d3.select('.temporary').on('click',grid_click);
    var p_prev = {id: "arbitrary"};
    var clicked = true;
    function grid_mv(){



        clicked = true;
        featured_point=[];
    	  var m = d3.mouse(this),
    	      p = tree.find(m[0], m[1]);
        if(p_prev.id !== p.id){
          p_prev = p;
          node_for_text = data[+p.id];
          console.log(p)
          console.log(node_for_text);
          jquery();
          // console.log("prev !== next");
          (function(){
            var use = _.sortBy(_.sortBy(graph.nodes,'x_draw'),'y_draw');
            var i = 0;
            var count = 0;
            var toggle_loop = true;
            use.forEach(function(d){
              if(d.y_scatter == p.y_scatter){
                if(d.x_scatter == p.x_scatter){
                  featured_point.push(d);
                  i+=25;
                  count++;
            }}})

            var timer_ease = d3.timer(function(e){

              var ease = Math.min(1,d3.easePolyOut(e/500,4));

              context_temp.save();
              context_temp.clearRect(0,0,width,height);


              var interval = 0;
              featured_point.forEach(function(d){
                  context_temp.beginPath();
                  context_temp.moveTo( (d.x_draw  + interval *25 )*ease + d.x_draw * (1-ease),
                    d.y_draw
                  );
                  context_temp.arc((d.x_draw  + interval *25)*ease + d.x_draw * (1-ease),
                    d.y_draw,
                    7*ease + 3* (1-ease) ,
                    0,
                    2 * Math.PI
                  );
                  context_temp.fillStyle = 'rgba(254, 77, 1, .8)'
                  context_temp.fill();
                  interval++;
              })
              if(count >= 2){
                context_temp.globalCompositeOperation = 'destination-over'
                context_temp.fillStyle = "rgba(255, 255, 255,.7)";
                roundRect(context_temp,
                  p.x_scatter + 7.5,
                  p.y_scatter - 15,
                  (i-25 +7.5) * ease + 50* (1-ease),
                  30,
                  20,
                  true);
              }
              context_temp.restore();

              if(ease == 1){
                console.log("stop");
                timer_ease.stop();
              }
              toggle_loop = false;
            })
          })()

        }
        if(p_prev.id == p.id){
          console.log("prev = next");
          node_for_text = data[+p.id];
          (function(){
            var use = _.sortBy(_.sortBy(graph.nodes,'x_draw'),'y_draw');
            var i = 0;
            var count = 0;
            var toggle_loop = true;
            use.forEach(function(d){
              if(d.y_scatter == p.y_scatter){
                if(d.x_scatter == p.x_scatter){
                  featured_point.push(d);
                  i+=25;
                  count++;
            }}})
            context_temp.save();
            context_temp.clearRect(0,0,width,height);
            var interval = 0;
            featured_point.forEach(function(d){
                context_temp.beginPath();
                context_temp.moveTo( (d.x_draw  + interval *25 ),
                  d.y_draw
                );
                context_temp.arc((d.x_draw  + interval *25),
                  d.y_draw,
                  7 ,
                  0,
                  2 * Math.PI
                );
                context_temp.fillStyle = 'rgba(254, 77, 1, .8)'
                context_temp.fill();
                interval++;
            })
            if(count >= 2){
              context_temp.globalCompositeOperation = 'destination-over'
              context_temp.fillStyle = "rgba(255, 255, 255,.7)";
              roundRect(context_temp,
                p.x_scatter + 7.5,
                p.y_scatter - 15,
                (i-25 +7.5),
                30,
                20,
                true);
            }
            context_temp.restore();
          })()
        }
    }
    function grid_click(){
      d3.select('#header_filter_univ').transition().duration(500).style('color','rgba(255,255,255,1)')
      d3.select('#filtering_univ_container').style('display','none')
      d3.select('#header_MAP').transition().duration(500).style('color','rgba(255,255,255,1)')
      d3.select('#map_view_container').style('display','none')
      d3.select('#header_sorting').transition().duration(500).style('color','rgba(255,255,255,1)')
      d3.select('#GRAPH_CONTAINER').style('display','none')


      if(clicked){
        var dig_data = featured_point,
            interval_ = 0;
            loop_once = true,
            pointed_prev = {id:"arbitrary"};

            $('.slide').css('right','2rem')
        		$('.slide').css('background-color',"rgb(27, 31, 58)")
        		$('.slide').css('opacity',"0.92")
        		$('.slide').css('box-shadow',"-31px 8px 180px 2px rgba(14, 16, 33, 0.5)")
            $('.popup_button').css('display','block')
            $('.popup_button').css('z-index',10)

            d3.select('.temporary').on('mousemove',function(){
              var m = d3.mouse(this),
                  minDistance = Infinity;
              if(loop_once){
                  dig_data.forEach(function(d){
                      d.x_draw_temp = d.x_draw  + (interval_ *25);

                      interval_++;
                  })
                  loop_once = false;
              }
              dig_data.forEach(function(d){
                var dx = d.x_draw_temp - m[0];
                var dy = d.y_draw - m[1];
                var distance = Math.sqrt((dx * dx) + (dy * dy));
                // console.log(distance);
                if(distance < minDistance && distance < 7){
                    if(pointed_prev.id !== d.id){
                      node_for_text = data[+d.id];
                      jquery();
                      pointed_prev = d;
                    }
                    if(pointed_prev.id !== d.id){
                      node_for_text = data[+d.id];
                    }
                }
              })
            });

            var timer_ease_c = d3.timer(function(e){
              var ease_v = Math.min(1,d3.easeBackInOut(e/800));
              var ease_color = d3.scaleQuantile()
              .domain([0, 1])
              .range(['rgba(254, 77, 1, .8)', 'rgba(127, 235, 255, .8)']);
              context_temp.save();
              context_temp.clearRect(0,0,width,height);
              dig_data.forEach(function(d,i){
                    context_temp.beginPath();
                    context_temp.moveTo( (d.x_draw  + i *(25*(1-ease_v) + 30*ease_v ) ),
                          d.y_draw
                        );
                    context_temp.arc((d.x_draw  + i *(25*(1-ease_v) + 30*ease_v )),
                          d.y_draw,
                          9*ease_v + 7*(1-ease_v),
                          0,
                          2 * Math.PI
                        );
                    context_temp.fillStyle = ease_color(parseFloat(ease_v));
                    context_temp.fill();
              })
              if(dig_data.length >= 2){
                context_temp.globalCompositeOperation = 'destination-over'
                context_temp.fillStyle = "rgba(255, 255, 255,.7)";
                roundRect(context_temp,
                  dig_data[0].x_scatter + (7.5*(1-ease_v) + 9*ease_v),
                  dig_data[0].y_scatter - (15*(1-ease_v) + 20*ease_v ),
                  ((30*dig_data.length) -30 +7.5),
                  40*ease_v + 30 *(1-ease_v),
                  20*(1-ease_v) + 25*ease_v,
                  true);
              }
              context_temp.fillStyle = "#ffffff";
              context_temp.font = "900 12px futura";
              context_temp.textAlign = "center";
              // context.moveTo(((30*dig_data.length) -30 +7.5) / 2,dig_data[0].y_scatter - 20)
              context_temp.fillText(
                "Total Restaurant here: "+dig_data.length,
                dig_data[0].x_scatter +9 + ((((30*dig_data.length) -30 +7.5) ) / 2),
                dig_data[0].y_scatter + 40
              );
              context_temp.font = "900 9px futura";

              context_temp.fillText(
                "Sanitation Score: "+ data[+dig_data[0].id].violation.recentScore,
                dig_data[0].x_scatter +9 + ((((30*dig_data.length) -30 +7.5) ) / 2),
                dig_data[0].y_scatter + 70
              );
              context_temp.font = "900 9px futura";

              context_temp.fillText(
                "Foursquare Rating: "+ data[+dig_data[0].id].rating,
                dig_data[0].x_scatter +9 + ((((30*dig_data.length) -30 +7.5) ) / 2),
                dig_data[0].y_scatter + 90
              );
              context.closePath();


              context_temp.restore();
              if(ease_v ==1){
                  timer_ease_c.stop();
              }
            })
      }
      if(!clicked){
        d3.select('.temporary').on('mousemove',grid_mv)
        context_temp.clearRect(0,0,width,height)
        $('.slide').css('right','-23.063rem')
  			$('.popup_button').css('display','none')
  			$('.slide').css('opacity',"")
  			$('.slide').css('box-shadow',"")
  			$('.slide').css('background-color',"")
      }
      clicked = false;

    }
  }

  $('.test_two').click(test_two_click_fc);
  $('#header_filter_univ').click(test_two_click_fc);

  function test_two_click_fc(){
    if(toggle_color_for_last_inspect){
      ticked();
      toggle_color_for_last_inspect = false;
      $('#last_inspection_wheel_inner').removeClass('active');
    }
    toggle_axis_price = true;
    $(this).children().children().addClass('active');
    $('#plot_rating').removeClass('active');
    $('#plot_rating_following').removeClass('active');
    $('#plot_price').removeClass('active')
    $('#plot_inspection').addClass('active')

    $('#tooltip_inspect_time').css('visibility','hidden')
    $('#tooltip_wheel').css('display','block')
    d3.select("#tooltip_wheel")
      .transition().duration(10/2)
      .style("opacity", 0)
      .transition()
      .ease(d3.easeQuad)
      .duration(1000)
      .style("opacity", 1)
    $('#tooltip_plot_grade_rating').css('display','none')
    d3.selectAll('.temporary').remove();
    d3.selectAll('.sub_visual').remove();

   zoom_init();
   current_scale = 1;
   var interpolate_A = d3.scaleQuantize()
       .domain([0, 1])
       .range(d3.quantize(d3.interpolateRgb('rgb(254, 77, 1)','rgb(205, 119, 44)'),4));
   var interpolate_B = d3.scaleQuantize()
       .domain([0, 1])
       .range(d3.quantize(d3.interpolateRgb('rgb(254, 77, 1)','rgb(41, 122, 239)'),4));
   var interpolate_C = d3.scaleQuantize()
       .domain([0, 1])
       .range(d3.quantize(d3.interpolateRgb('rgb(254, 77, 1)','rgb(42, 255, 80)' ),4));

   var timer = d3.timer(function(e){
     graph_ABC_toggle = false;
       var t = Math.min(1,d3.easeCubicInOut(e/3000));
       if(third_button_clicked){
         graph.nodes.forEach(function(d){
            d.x_draw = (d.x_wheel * transform.k + transform.x) * t + d.x_price_force * (1-t)
            d.y_draw = (d.y_wheel * transform.k + transform.y) * t + d.y_price_force * (1-t)
            d.circle_size = p5_map(t,0,.999,3/transform.k,  3-(1.5*transform.k) );
            d.circle_opacity = Math.round(p5_map(t,0,.999,0.3,1) *10) /10;
            if(d.gr == 'v'){ d.circle_opacity=Math.round(p5_map(t,0,.999,0,1) *10) /10}
            if(d.gd <=13){
              d.color = interpolate_A(t).split('(');
              d.color[0] = d.color[0].replace(/rgb/g,'rgba(');
              d.color[1] = d.color[1].replace(/\)/g,', '+ d.circle_opacity + ')');
              d.color = d.color.join('');
            };
            if(d.gd>13 && d.gd<=27){
              d.color = interpolate_B(t).split('(');
              d.color[0] = d.color[0].replace(/rgb/g,'rgba(');
              d.color[1] = d.color[1].replace(/\)/g,', '+ d.circle_opacity + ')');
              d.color = d.color.join('');
            };
            if(d.gd > 27){
              d.color = interpolate_C(t).split('(');
              d.color[0] = d.color[0].replace(/rgb/g,'rgba(');
              d.color[1] = d.color[1].replace(/\)/g,', '+ d.circle_opacity + ')');
              d.color = d.color.join('');
            };
        });
       }else{
         graph.nodes.forEach(function(d){
            d.x_draw = (d.x_wheel * transform.k + transform.x) * t + d.x_scatter * (1-t)
            d.y_draw = (d.y_wheel * transform.k + transform.y) * t + d.y_scatter * (1-t)
            d.circle_size = p5_map(t,0,.999,3/transform.k,  3-(1.5*transform.k) );
            d.circle_opacity = Math.round(p5_map(t,0,.999,0.3,1) *10) /10;
            if(d.gr == 'v'){ d.circle_opacity=Math.round(p5_map(t,0,.999,0,1) *10) /10}
            if(d.gd <=13){
              d.color = interpolate_A(t).split('(');
              d.color[0] = d.color[0].replace(/rgb/g,'rgba(');
              d.color[1] = d.color[1].replace(/\)/g,', '+ d.circle_opacity + ')');
              d.color = d.color.join('');
            };
            if(d.gd>13 && d.gd<=27){
              d.color = interpolate_B(t).split('(');
              d.color[0] = d.color[0].replace(/rgb/g,'rgba(');
              d.color[1] = d.color[1].replace(/\)/g,', '+ d.circle_opacity + ')');
              d.color = d.color.join('');
            };
            if(d.gd > 27){
              d.color = interpolate_C(t).split('(');
              d.color[0] = d.color[0].replace(/rgb/g,'rgba(');
              d.color[1] = d.color[1].replace(/\)/g,', '+ d.circle_opacity + ')');
              d.color = d.color.join('');
            };
        });
       }

      if(t >0.5 && t<=1){
        toggle_stroke = true;
      }
      ticked();
       if (t == 1) {
        timer.stop();
         normal = true;
         grid = false;
         third_button_clicked = false;
         toggle_stroke = false;
            ticked();
       }
   })
   select_canvas.on('mousemove',mv);
}

  $('.test_three').click(function(){
    $('#plot_inspection').removeClass('active')
    $('#plot_rating_following').removeClass('active');
    $('#plot_price').addClass('active');
    $('.temporary').css('z-index',1)

    d3.selectAll(".axis")
      .transition()
      .ease(d3.easeQuad)
      .duration(1000)
      .style("opacity", 0).on('interrupt',function(){
        d3.active(this).style('visibility','').style('opacity',1);
      });
    d3.selectAll("#axis_y")
      .transition()
      .ease(d3.easeQuad)
      .duration(1000)
      .style("opacity", 0).on('interrupt',function(){
        d3.active(this).style('visibility','').style('opacity',1);
      })

    d3.selectAll('.axis_x_price')
    .transition()
    .ease(d3.easeQuad)
    .duration(500)
    .style("opacity", 1)
    .style('visibility','');
    d3.selectAll('.axis_y_price')
    .transition()
    .ease(d3.easeQuad)
    .duration(500)
    .style("opacity", 1)
    .style('visibility','');
    /********************************** compute scatter plot ****************************************/
    var change_axis = d3.select('.sub_visual');
    //x axis
    var vio_s = graph.nodes.map(function(d){if(!isNaN(+d.id)){
      if(data[+d.id].violation.recentScore == null ||data[+d.id].violation.recentScore == undefined){ return 0;}
       return data[+d.id].violation.recentScore;
    }});
    vio_s.splice(0,78);
    var vio_s_max = d3.max(vio_s)
    var vio_s_min = d3.min(vio_s)
    var linearScaleX = d3.scaleLinear()
      .domain([vio_s_min,vio_s_max])
      .range([55, window.innerWidth - 400]);
    //y axis
    var price_tier_plot =graph.nodes.map(function(d){if(!isNaN(+d.id)){return data[+d.id].price;}})
    price_tier_plot.splice(0,78);
    var price_max = d3.max(price_tier_plot)
    var price_min = d3.min(price_tier_plot)
    var linearScaleY = d3.scaleLinear()
      .domain([price_max,0])
      .range([60 + 35, window.innerHeight - 35]);
    //set up object property
    graph.nodes.forEach(function(d){
      if(d.gr == "r"){
        d.x = d.x_draw;
        d.y = d.y_draw;
        d.circle_size = 3;
        d.circle_opacity =1;
        d.x_price_scatter = linearScaleX(data[+d.id].violation.recentScore) +Math.random(0,1);
        d.y_price_scatter = linearScaleY(data[+d.id].price) +Math.random(0,1);
      }
    });

    //Collision detection
    var collision = d3.forceSimulation()
        .force("x", d3.forceX(function(d){return d.x_price_scatter; }).strength(0.385))
        .force("y", d3.forceY(function(d){return d.y_price_scatter}).strength(0.025))

    axis_price(change_axis,linearScaleX,linearScaleY);
    //draw loop
    collision
      .nodes(graph.nodes)
      .on('tick',tick_collision)
    var tick_collision_iteration = 0;
    var tree;
    function tick_collision(){
      tick_collision_iteration ++;
      context.save();
      context.clearRect(0,0,width,height);
      context.beginPath();


      // context.fillStyle = "rgba(255, 255, 255, .2)";
      // context.font = "900 120px futura"; //Miller-DisplayItalic
      // context.textAlign = "left";
      // context.fillText(" A",graph.nodes[5170+65].x_scatter,graph.nodes[4492+66].y_scatter);
      // context.fillText(" B",graph.nodes[997+76].x_scatter,graph.nodes[4492+66].y_scatter);
      // context.fillText(" C",graph.nodes[210+78].x_scatter,graph.nodes[4492+66].y_scatter);

      graph.nodes.forEach(function(d){
        if(d.gr == 'r'){
          context.beginPath();
          context.moveTo(d.x +
            // (3 / transform.k)
            3
            ,
            d.y
          );
          context.arc(d.x,
            d.y,
            // (3 / transform.k)
            3
            ,
            0,
            2 * Math.PI
          );
          context.fillStyle = "rgba(254, 77, 1,.5)";
          context.fill();
        }
      })

      context.restore();
      console.log(tick_collision_iteration);
      if(tick_collision_iteration == 152){
        collision.stop();
        third_button_clicked = true;
        graph.nodes.forEach(function(d){
          d.x_price_force = d.x;
          d.y_price_force = d.y;
          d.x = d.x_wheel;
          d.y = d.y_wheel;
        });
        tree = d3.quadtree()
         .extent([[0, 0], [window.innerWidth, window.innerHeight]])
         .x(function(d) { return d.x_price_force})
         .y(function(d) { return d.y_price_force})
         .addAll(graph.nodes);
      }
    }

    var canvas_temp = document.querySelector('.temporary');
    var context_temp = canvas_temp.getContext('2d');
    d3.select('.temporary').on('mousemove',price_mv);
    d3.select('.temporary').on('click',price_click);
    var p_prev = {id: "arbitrary"};
    var clicked_price = true;
    var point_for_click;

    function price_mv(){
      clicked_price = true;
      var m = d3.mouse(this),
          p = tree.find(m[0], m[1]);
      point_for_click = p;
      if(p_prev.id !== p.id){
        p_prev = p;
        node_for_text = data[+p.id];
        jquery();
        console.log("prev !== next");

        var timer_ease = d3.timer(function(e){
          var ease = Math.min(1,d3.easePolyOut(e/500,4));
          context_temp.save();
          context_temp.clearRect(0,0,width,height);

          context_temp.beginPath();
          context_temp.moveTo(p.x_price_force +
            ((p.circle_size * (1-ease)) + 9 * ease)
            ,
            p.y_price_force
          );
          context_temp.arc(p.x_price_force,
            p.y_price_force,
            ((p.circle_size * (1-ease)) + 9 * ease)
            ,
            0,
            2 * Math.PI
          );

          context_temp.fillStyle = 'rgba(244, 185, 168, .8)'
          context_temp.fill();
          context_temp.restore();

          if(ease == 1){
            console.log("stop");
            timer_ease.stop();
          }
        })
      }
    }

    function price_click(){
      console.log("clicked");
      d3.select('#header_filter_univ').transition().duration(500).style('color','rgba(255,255,255,1)')
      d3.select('#filtering_univ_container').style('display','none')
      d3.select('#header_MAP').transition().duration(500).style('color','rgba(255,255,255,1)')
      d3.select('#map_view_container').style('display','none')
      d3.select('#header_sorting').transition().duration(500).style('color','rgba(255,255,255,1)')
      d3.select('#GRAPH_CONTAINER').style('display','none')


      if(clicked_price){
        d3.select('.temporary').on('mousemove',null)
        $('.slide').css('right','2rem')
        $('.slide').css('background-color',"rgb(27, 31, 58)")
        $('.slide').css('opacity',"0.92")
        $('.slide').css('box-shadow',"-31px 8px 180px 2px rgba(14, 16, 33, 0.5)")
        $('.popup_button').css('display','block')
        $('.popup_button').css('z-index',10)
        var timer_ease_c = d3.timer(function(e){
          var ease_v = Math.min(1,d3.easeBackInOut(e/800));
          var ease_color = d3.scaleQuantile()
              .domain([0, 1])
              .range(['rgba(244, 185, 168, .8)', 'rgba(242, 219, 215, 0.8)']);
              context_temp.save();
              context_temp.clearRect(0,0,width,height);
              context_temp.beginPath();
              context_temp.moveTo(point_for_click.x_price_force +
                ((9 * (1-ease_v)) + 11 * ease_v)
                ,
                point_for_click.y_price_force
              );
              context_temp.arc(point_for_click.x_price_force,
                point_for_click.y_price_force,
                ((9 * (1-ease_v)) + 11 * ease_v)
                ,
                0,
                2 * Math.PI
              );
              context_temp.fillStyle = ease_color(parseFloat(ease_v));
              context_temp.fill();
              if(ease_v ==1){
                timer_ease_c.stop();
              }
        });
      }
      if(!clicked_price){
        $('.slide').css('right','-23.063rem')
        $('.popup_button').css('display','none')
        $('.slide').css('opacity',"")
        $('.slide').css('box-shadow',"")
        $('.slide').css('background-color',"")
        d3.select('.temporary').on('mousemove',price_mv)
      }
      clicked_price = false;
    }

  }) //click three

  $( ".last_inspection_wheel" ).click(function (){
    $('#plot_inspection').removeClass('active')
    $('#last_inspection_wheel_inner').addClass('active')

    $('#tooltip_wheel').css('display','none')
    $('#tooltip_inspect_time').css('visibility','visible')
    .css('bottom',function(){return 50;})
    .css('opacity',0)
    d3.select('#tooltip_inspect_time')
      .transition()
      .ease(d3.easeQuad)
      .duration(4000)
      .style("opacity", 1)

    var max = 1487998800000,
        min = 1443499200000,
        color_for_last_inspect = d3.scaleLinear()
        .domain([min, max])
        .range(["red", "white"]); //first parameter is the latest inspect, second one is the oldest.
        // .range(["brown", "steelblue"]);
    data.forEach(function(d){
        d.violation.color_for_last_inspect = color_for_last_inspect(Date.parse(d.violation.recentTime));
    });
    toggle_color_for_last_inspect = true;
    ticked();
    });
  }

$(".map_plot").click(map_plot_fc)
$("#header_MAP").click(map_plot_fc)
function map_plot_fc(){

  $('.temporary').css('z-index',0)
  $('#mapbox').css('display','none')

  d3.select('#infoPanel_container')
    .append('div')
    .attr('id','map_02_container')
    // .style('width',(window.innerWidth - (737 - 369)))
  var tree;
  var size_change =.3;
  var map_view = new mapboxgl.Map({
    container: 'map_02_container',
    style: 'mapbox://styles/jiahao01121/cj2gkvmgh004g2rpnzc7p6g5y',
    center: [-73.98499481968639, 40.74442495683266],
    //2D view:
     // [-73.985,40.715],

    zoom: 13.915641541140074,
    pitch: 58,
    bearing: 44.80000000000007,
  })
  map_view.addControl(new mapboxgl.NavigationControl());
  var bbox = $('#map_02_container')
  var width = bbox.width();
  var height = bbox.height();
  var container = map_view.getCanvasContainer()
  d3.select(container)
    .append("canvas")
    .attr('height',height)
    .attr('width',width)
    .attr('class','subbbbb')
    .canvas(true);
  var canvas = document.querySelector('.subbbbb');
  var ctx = canvas.getContext('2d');

  map_add_button(map_view); /*** button *****/

  var myZoom = {
    start:  map_view.getZoom(),
    end: map_view.getZoom()
  };
  map_view.on('zoomstart', function(e) {
    myZoom.start = map_view.getZoom();
  });
  map_view.on('zoomend', function(e) {
    myZoom.end = map_view.getZoom();
    var diff = myZoom.start - myZoom.end;
    if (diff > 0) {
      size_change  = .3;
    } else if (diff < 0) {
      size_change  = .3;
    }
  });
  var max = d3.max(data.map(function(d){ return d.violation.recentScore}));
  var min = d3.min(data.map(function(d){ return d.violation.recentScore}));

  function render() {
    ctx.save();
    ctx.clearRect(0, 0, width, height);
    ctx.translate(bbox.width()/2, bbox.height()/2);
    ctx.scale((512) * 0.5 / Math.PI * Math.pow(2, map.getZoom()),(512) * 0.5 / Math.PI * Math.pow(2, map.getZoom()));

    data.forEach(function(d) {
      var ready = map_view.project(new mapboxgl.LngLat(d.lng,d.lat));
      d.map_coord_x = ready.x;
      d.map_coord_y = ready.y;
      var size = p5_map(d.violation.recentScore,min,max,2,50) * size_change
      var color;
      if(d.violation.recentScore >=13){
        color =  "rgba(204,119,44,.8)";
      }
      if(d.violation.recentScore >13 && d.violation.recentScore <=27){
        color =  "rgba(41,122,239,.8)";

      }
      if(d.violation.recentScore >27){
        color =  "rgba(42,255,80,.8)";
      }
      ctx.beginPath();
      ctx.moveTo(d.map_coord_x + size , d.map_coord_y);
      ctx.arc(d.map_coord_x, d.map_coord_y, size  , 0, Math.PI*2);

      ctx.fillStyle = color;
      // "rgba(255,255,255,.3)";
      ctx.fill();
      ctx.restore();
    });
    tree = d3.quadtree()
     .extent([[0, 0], [width, height]])
     .x(function(d) { return d.map_coord_x})
     .y(function(d) { return d.map_coord_y})
     .addAll(data);
  }
  map_view.on("viewreset", function() {
    render()
  })
  map_view.on("move", function() {
    render()
  })
  render();
  var clicked_map_view = true;
  map_view.on('click',function(e){
    d3.select('#header_filter_univ').transition().duration(500).style('color','rgba(255,255,255,1)')
    d3.select('#filtering_univ_container').style('display','none')
    d3.select('#header_MAP').transition().duration(500).style('color','rgba(255,255,255,1)')
    d3.select('#map_view_container').style('display','none')
    d3.select('#header_sorting').transition().duration(500).style('color','rgba(255,255,255,1)')
    d3.select('#GRAPH_CONTAINER').style('display','none')



    // console.log(map_view.getCenter())
    // console.log(map_view.getZoom())
    // console.log(map_view.getBearing())
    // console.log(map_view.getPitch())

     p = tree.find(e.point.x, e.point.y);
     node_for_text = p;
     if(!clicked_map_view){
       $('.slide').css('right','-23.063rem');
       $('.popup_button').css('display','none');
       $('.slide').css('opacity',"");
       $('.slide').css('box-shadow',"");
       $('.slide').css('background-color',"");
       $('#mapbox').css('display','none');
       clicked_map_view = true;
     }
     else if(clicked_map_view){
       jquery();
       $('.slide').css('right','2rem');
       $('.slide').css('background-color',"rgb(27, 31, 58)");
       $('.slide').css('opacity',"0.92");
       $('.slide').css('box-shadow',"-31px 8px 180px 2px rgba(14, 16, 33, 0.5)");
       $('.popup_button').css('display','block');
       $('.popup_button').css('z-index',10);
       clicked_map_view = false;
     }
  })// map click

var p_prev = {id: "arbitrary"};
  map_view.on('mousemove',function(e){
    p = tree.find(e.point.x, e.point.y);
    if(p_prev.id !== p.id){
      p_prev = p;
      node_for_text = p;
      jquery();
    }
    if(clicked_map_view){
        $('#mapbox').css('display','none');
    }
  })// map mouseover
}


function map_add_button (map_view){

    $('#map_02_container .mapboxgl-control-container .mapboxgl-ctrl-top-right')
    .css('top','100px')
    .css('right',(window.innerWidth -50) + 'px')
    .css('left','10px')


   /********** china town ************/
   d3.select('#map_02_container .mapboxgl-control-container')
      .append('span')
      .attr('id','china_town_fly')
      .append('p')
      .append('a')
      .text('CHINA TOWN')
      .attr('id','china_town_fly_inner')

    $('#china_town_fly').click(function(){

      map_view.flyTo({
        center: [-73.98922187254743, 40.71574842130374],
        zoom:15,
        pitch: 3.5,
        bearing:12.432028020413211
      });
    })
    /********** little italy ************/
    d3.select('#map_02_container .mapboxgl-control-container')
       .append('span')
       .attr('id','little_italy_fly')
       .append('p')
       .append('a')
       .text('LITTLE ITALY')
       .attr('id','little_italy_fly_inner')

    $('#little_italy_fly').click(function(){

     map_view.flyTo({
        center: [-73.99664850718472,40.72175910303059],
        zoom:15.5122600128775,
        pitch: 3.5,
        bearing:12.432028020413211
      });
    });
    /********** parsons ************/
    d3.select('#map_02_container .mapboxgl-control-container')
       .append('span')
       .attr('id','parsons_fly')
       .append('p')
       .append('a')
       .text('PARSONS')
       .attr('id','parsons_fly_inner')

    $('#parsons_fly').click(function(){
     map_view.flyTo({
        center: [-73.99320257625709, 40.735620893181874],
        zoom:16.79656091478192,
        pitch: 3.5,
        bearing:12.432028020413211
      });
    });
  /********** Bird's Eye View  ************/
  d3.select('#map_02_container .mapboxgl-control-container')
     .append('span')
     .attr('id','birds_fly')
     .append('p')
     .append('a')
     .text('BIRD\'S EYE VIEW - MID TOWN')
     .attr('id','birds_fly_inner')

  $('#birds_fly').click(function(){
   map_view.flyTo({
      center: [-73.98499481968639, 40.74442495683266],
      zoom: 13.915641541140074,
      pitch: 58,
      bearing: 44.80000000000007,
    });
  });
  /********** Bird's Eye View - downtown  ************/
  d3.select('#map_02_container .mapboxgl-control-container')
     .append('span')
     .attr('id','birds_fly_downtown')
     .append('p')
     .append('a')
     .text('BIRD\'S EYE VIEW - DOWN TOWN')
     .attr('id','birds_fly_downtown_inner')

  $('#birds_fly_downtown').click(function(){
   map_view.flyTo({
      center: [-74.00326850065716,40.71402543923372],
      zoom: 13.915641541140074,
      pitch: 58,
      bearing: 44.80000000000007,
    });
  });
  /********** Bird's Eye View - uptown  ************/
  d3.select('#map_02_container .mapboxgl-control-container')
     .append('span')
     .attr('id','birds_fly_uptown')
     .append('p')
     .append('a')
     .text('BIRD\'S EYE VIEW - UP TOWN')
     .attr('id','birds_fly_uptown_inner')

  $('#birds_fly_uptown').click(function(){
     map_view.flyTo({
        center: [-73.94406074752214,40.78430606685018],
        zoom: 12.95651923123018,
        pitch: 52.79999999999984,
        bearing: 60,
      });
    });

    d3.select('#map_02_container .mapboxgl-control-container')
      .append('button')
      .attr('id','map_view_exit')
      .text('X')
    $('#map_view_exit').click(function(){
      d3.select('#map_02_container').style('opacity','1')
        .transition()
        .duration(1000)
        .style("opacity",'0')
        .on('end',function(){
          d3.select('#map_02_container').remove();
          $('#mapbox').css('display','block');
        })
    })
};
setup(draw_wheel);
