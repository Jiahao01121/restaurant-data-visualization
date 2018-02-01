var _ = require('underscore');
var util = require('util')
var fs = require('fs');
var data = add_id();
var nodes = [];
var links = [];
function add_id(){
  var data = JSON.parse(fs.readFileSync('mar_25_all_mahat_5233outOf9881.json','utf8'));
  var count = 0;
  for (var i = 0; i < data.length; i++) {
    data[i].id = count;
    count++;
  }
  // fs.writeFileSync('mar_25_all_mahat_5233outOf9881.json',JSON.stringify(data));
  return data;
}
function generate_n(){
  for (var i = 0; i < data.length; i++) {
    for(var t = data[i].violation.historyVCode.length; t>=0;t--){
      if(data[i].violation.historyVCode[t] !== undefined && data[i].violation.historyVCode[t] !== ''){
        nodes.push(data[i].violation.historyVCode[t]);
      }
    }
  }
  nodes = _.uniq(nodes);
  for (var i = nodes.length -1; i >=0 ; i--) {
    if(nodes[i] == '15H'||nodes[i] == '03G'||nodes[i]
     == '05I'||nodes[i] == '04I'||nodes[i] == '04G'||nodes[i] == '02D'||nodes[i] == '02F'||nodes[i] == '03F'||nodes[i] == '16F'||nodes[i] == '10G'||nodes[i] == '02J'||nodes[i] ==
     '22G'||nodes[i] == '03E'){
      nodes.splice(i,1);
    }
  }
  for (var i = 0; i < nodes.length; i++) {
    nodes[i] = { id: nodes[i], gr : 'v',gd : null};
  }
  for (var i = 0; i < data.length; i++) {
    nodes.push({  id:data[i].id.toString(), gr:'r',gd : data[i].violation.recentScore });
  }
  return nodes
}
function generate_l(){
  for (var i = 0; i < data.length; i++) {
    var arr = [];
    /************************************************************************************************/
    /*                               *delete invaild *                                              */
    /************************************************************************************************/
    for(var t = data[i].violation.historyVCode.length-1 ; t >=0 ;t--){
      if(
        data[i].violation.historyVCode[t] == '15H'||data[i].violation.historyVCode[t] == '03G'||data[i].violation.historyVCode[t] == '05I'||data[i].violation.historyVCode[t] == '04I'||data[i].violation.historyVCode[t] == '04G'||
        data[i].violation.historyVCode[t] == '02D'||data[i].violation.historyVCode[t]== '02F'||data[i].violation.historyVCode[t] == '03F'||data[i].violation.historyVCode[t] == '16F'
        ||data[i].violation.historyVCode[t]== '10G'||data[i].violation.historyVCode[t] == '02J'||data[i].violation.historyVCode[t] == '22G'||data[i].violation.historyVCode[t]== '03E'
      ){
        data[i].violation.historyVCode.splice(t,1)
      }
    }
    /************************************************************************************************/
    /*                               *loop           *                                              */
    /************************************************************************************************/
    for(var ti = data[i].violation.historyVCode.length-1 ; ti >=0 ;ti--){
      if(data[i].violation.historyVCode.length !== 0){
      if (data[i].violation.historyVCode[ti] !== undefined && data[i].violation.historyVCode[ti] !== '') {
        var a ={};
        a.source = data[i].violation.historyVCode[ti];
        a.target = data[i].id;
        // a.value = 0;
        arr.push(a);
      }
      }
    }
    arr = _.sortBy(arr,'source');
    // console.log("----------------------");
    if(arr.length !==0){
            for(var it = arr.length-1;it>=0;it--){
                for(var tt = arr.length-1;tt>=0;tt--){
                  if(arr[it].source === arr[tt].source){
                    // arr[it].value++;
                  }
                }
            }
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
          }
          var arr = removeDuplicates(arr, "source");
          for (var iii in arr) {
              links.push(arr[iii])
          }
          // console.log(arr);
    }
  }
}
generate_n();
generate_l();
417
601
var delete_empty_restau = []
for (var i = 0; i < data.length; i++) {
  var a = _.findWhere(links,{target : data[i].id});
  if (a == undefined) {
    delete_empty_restau.push(data[i].id);
  }
}
var arr = [];
for (var i = 0; i < delete_empty_restau.length; i++) {
var b = _.findWhere(nodes,{id:delete_empty_restau[i].toString()});
arr.push(b);
};
var final_nodes = _.difference(nodes, arr);
for (var i = 0; i < final_nodes.length; i++) {
  console.log(final_nodes[i]);
}

fs.writeFileSync('n_l_v2.json',JSON.stringify({nodes:final_nodes,links:links}));


//var data = JSON.parse(fs.readFileSync("n_l_v2.json",'utf8'));
// console.log(data);
// var c = 0;
// for (var i = 0; i < data.nodes.length; i++) {
//   if(data.nodes[i].gr =='v'){
//     c++
//   }
//
// }
// console.log(c);
