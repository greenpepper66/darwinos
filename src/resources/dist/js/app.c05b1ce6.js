(function(e){function t(t){for(var n,a,i=t[0],s=t[1],l=t[2],c=0,d=[];c<i.length;c++)a=i[c],Object.prototype.hasOwnProperty.call(o,a)&&o[a]&&d.push(o[a][0]),o[a]=0;for(n in s)Object.prototype.hasOwnProperty.call(s,n)&&(e[n]=s[n]);f&&f(t);while(d.length)d.shift()();return u.push.apply(u,l||[]),r()}function r(){for(var e,t=0;t<u.length;t++){for(var r=u[t],n=!0,a=1;a<r.length;a++){var i=r[a];0!==o[i]&&(n=!1)}n&&(u.splice(t--,1),e=s(s.s=r[0]))}return e}var n={},a={app:0},o={app:0},u=[];function i(e){return s.p+"js/"+({about:"about"}[e]||e)+"."+{about:"4b5fc0f7"}[e]+".js"}function s(t){if(n[t])return n[t].exports;var r=n[t]={i:t,l:!1,exports:{}};return e[t].call(r.exports,r,r.exports,s),r.l=!0,r.exports}s.e=function(e){var t=[],r={about:1};a[e]?t.push(a[e]):0!==a[e]&&r[e]&&t.push(a[e]=new Promise((function(t,r){for(var n="css/"+({about:"about"}[e]||e)+"."+{about:"f3f2f347"}[e]+".css",o=s.p+n,u=document.getElementsByTagName("link"),i=0;i<u.length;i++){var l=u[i],c=l.getAttribute("data-href")||l.getAttribute("href");if("stylesheet"===l.rel&&(c===n||c===o))return t()}var d=document.getElementsByTagName("style");for(i=0;i<d.length;i++){l=d[i],c=l.getAttribute("data-href");if(c===n||c===o)return t()}var f=document.createElement("link");f.rel="stylesheet",f.type="text/css",f.onload=t,f.onerror=function(t){var n=t&&t.target&&t.target.src||o,u=new Error("Loading CSS chunk "+e+" failed.\n("+n+")");u.code="CSS_CHUNK_LOAD_FAILED",u.request=n,delete a[e],f.parentNode.removeChild(f),r(u)},f.href=o;var h=document.getElementsByTagName("head")[0];h.appendChild(f)})).then((function(){a[e]=0})));var n=o[e];if(0!==n)if(n)t.push(n[2]);else{var u=new Promise((function(t,r){n=o[e]=[t,r]}));t.push(n[2]=u);var l,c=document.createElement("script");c.charset="utf-8",c.timeout=120,s.nc&&c.setAttribute("nonce",s.nc),c.src=i(e);var d=new Error;l=function(t){c.onerror=c.onload=null,clearTimeout(f);var r=o[e];if(0!==r){if(r){var n=t&&("load"===t.type?"missing":t.type),a=t&&t.target&&t.target.src;d.message="Loading chunk "+e+" failed.\n("+n+": "+a+")",d.name="ChunkLoadError",d.type=n,d.request=a,r[1](d)}o[e]=void 0}};var f=setTimeout((function(){l({type:"timeout",target:c})}),12e4);c.onerror=c.onload=l,document.head.appendChild(c)}return Promise.all(t)},s.m=e,s.c=n,s.d=function(e,t,r){s.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:r})},s.r=function(e){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},s.t=function(e,t){if(1&t&&(e=s(e)),8&t)return e;if(4&t&&"object"===typeof e&&e&&e.__esModule)return e;var r=Object.create(null);if(s.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var n in e)s.d(r,n,function(t){return e[t]}.bind(null,n));return r},s.n=function(e){var t=e&&e.__esModule?function(){return e["default"]}:function(){return e};return s.d(t,"a",t),t},s.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},s.p="",s.oe=function(e){throw console.error(e),e};var l=window["webpackJsonp"]=window["webpackJsonp"]||[],c=l.push.bind(l);l.push=t,l=l.slice();for(var d=0;d<l.length;d++)t(l[d]);var f=c;u.push([0,"chunk-vendors"]),r()})({0:function(e,t,r){e.exports=r("56d7")},"034f":function(e,t,r){"use strict";r("85ec")},"21c1":function(e,t,r){"use strict";r.d(t,"a",(function(){return s}));var n=r("255a"),a=r("1157"),o=r.n(a),u=(r("6062"),r("d3b7"),r("3ca3"),r("ddb0"),r("25f0"),r("6095"));function i(e,t,r){o.a.ajax({url:"http://"+e+"/get_result/",type:"post",data:{placeholder:99},cache:!1,xhr:function(){var e=new XMLHttpRequest;return e.responseType="blob",e},success:function(e){var n=new Set;try{Object(u["blob_to_uint32"])(e,(function(e){for(var r=Math.floor(t/2),a=t%2,o=24*r,i=24*a,s=Object(u["extract_data"])(e),l=0;l<s.length;l+=2){var c=s[l],d=(c.toString(16),c>>6&63),f=c>>0&63;n.add(JSON.stringify([d-o,f-i]));break}console.log("try get output neru set ok:",n)}))}catch(a){console.log(a)}finally{console.log("finally",n),r(n)}},error:function(e){console.log(e)}})}function s(e,t,r,a){o.a.ajax({url:"http://192.168.1.254/get_big_chip_matrix/",type:"POST",data:{type:t},xhr:function(){var e=new XMLHttpRequest;return e.responseType="blob",e},success:function(t){var o=new FileReader;o.readAsArrayBuffer(t),o.onload=function(){var t=o.result,u=n["a"].create(n["a"].array("one_chip_matrix",n["a"].uint16(),2304)),s=n["a"].create(n["a"].array("four_chip_matrix",u,3)),l=13824,c=Math.ceil(t.byteLength/l);s=s.readStructs(t,0,c);for(var d=Math.floor(r/4),f=Math.floor(r%4/2),h=r%4%2,m=24*f,p=24*h,v=[],b=s[0].four_chip_matrix[d].one_chip_matrix,g=0;g<24;g++)for(var y=0;y<24;y++)v.push([y,g,b[g+m+48*(y+p)]]);console.log("big    ",s[0]),i(e,r,(function(e){for(var t=0;t<v.length;t++){var r=v[t][0],n=v[t][1];e.has(JSON.stringify([r,n]))&&(v[t]=[r,n,-1])}a(v)}))}},error:function(e){console.log(e)}})}},"255a":function(e,t,r){"use strict";r.d(t,"a",(function(){return a}));r("b0c0"),r("5cc6"),r("9a8c"),r("a975"),r("735e"),r("c1ac"),r("d139"),r("3a7b"),r("d5d6"),r("82f8"),r("e91f"),r("60bd"),r("5f96"),r("3280"),r("3fcc"),r("ca91"),r("25a1"),r("cd26"),r("3c5d"),r("2954"),r("649e"),r("219c"),r("170b"),r("b39a"),r("72f7"),r("d3b7"),r("fd87"),r("8b09"),r("84c3"),r("143c"),r("fb2c"),r("cfc3"),r("4a9b");var n=0,a=Object.create(Object,{int8:{value:function(e){return{name:e,readCode:"v.getInt8(o, true);",byteLength:1,defaultValue:0,structProperty:!0}}},uint8:{value:function(e){return{name:e,readCode:"v.getUint8(o, true);",byteLength:1,defaultValue:0,structProperty:!0}}},int16:{value:function(e){return{name:e,readCode:"v.getInt16(o, true);",byteLength:2,defaultValue:0,structProperty:!0}}},uint16:{value:function(e){return{name:e,readCode:"v.getUint16(o, true);",byteLength:2,defaultValue:0,structProperty:!0}}},int32:{value:function(e){return{name:e,readCode:"v.getInt32(o, true);",byteLength:4,defaultValue:0,structProperty:!0}}},uint32:{value:function(e){return{name:e,readCode:"v.getUint32(o, true);",byteLength:4,defaultValue:0,structProperty:!0}}},float32:{value:function(e){return{name:e,readCode:"v.getFloat32(o, true);",byteLength:4,defaultValue:0,structProperty:!0}}},float64:{value:function(e){return{name:e,readCode:"v.getFloat64(o, true);",byteLength:8,defaultValue:0,structProperty:!0}}},string:{value:function(e,t){var r="(function(o) {\n";return r+='   var str = "";\n',r+="   for(var j = 0; j < "+t+"; ++j) {\n",r+="       var char = v.getUint8(o+j, true);\n",r+="       if(char === 0) { break; }\n",r+="       str += String.fromCharCode(char);\n",r+="   }\n",r+="   return str;\n",r+="})(o);\n",{name:e,readCode:r,byteLength:t,defaultValue:"",structProperty:!0}}},array:{value:function(e,t,r){var n="(function(o) {\n";return n+="   var aa = new Array("+r+"), av;\n",n+="   for(var j = 0; j < "+r+"; ++j) {\n",n+="       av = "+t.readCode+"\n",n+="       o += "+t.byteLength+";\n",n+="       aa[j] = av;\n",n+="   }\n",n+="   return aa;\n",n+="})(o);\n",{name:e,readCode:n,byteLength:t.byteLength*r,defaultValue:null,array:!0,structProperty:!0}}},struct:{value:function(e,t){return{name:e,readCode:t.readCode,byteLength:t.byteLength,defaultValue:null,struct:!0,structProperty:!0}}},skip:{value:function(e){return{name:null,readCode:"null;\n",byteLength:e,structProperty:!0}}},create:{value:function(){var e,t=arguments[arguments.length-1].structProperty?{}:arguments[arguments.length-1],r=0,a=Object.create(Object.prototype,t);Object.defineProperty(a,"struct_type_id",{value:"struct_id_"+n,enumerable:!1,configurable:!1,writable:!1}),Object.defineProperty(this,a.struct_type_id,{value:a,enumerable:!1,configurable:!1,writable:!1}),n+=1;for(var o="(function(o) { var st = Object.create(Struct."+a.struct_type_id+");\n",u=0;u<arguments.length;++u)e=arguments[u],e.structProperty&&(e.name&&(Object.defineProperty(a,e.name,{value:e.defaultValue,enumerable:!0,configurable:!0,writable:!0}),o+="st."+e.name+" = "+e.readCode+"\n"),o+="o += "+e.byteLength+";\n",r+=e.byteLength);o+="return st; })(o);";var i="var a = new Array(count);\n var s;\n";i+="var v = new DataView(arrayBuffer, offset);\n",i+="var o = 0, so = 0;\n",i+="for(var i = 0; i < count; ++i) {\n",i+="    so = o;\n",i+="    s = "+o+"\n",i+="    o += this.byteLength;\n",i+="    if(callback) { callback(s, offset+so); }\n",i+="    a[i] = s;\n",i+="}\n",i+="return a;\n",Object.defineProperty(a,"byteLength",{value:r,enumerable:!0,configurable:!0,writable:!0}),Object.defineProperty(a,"readCode",{value:o,enumerable:!0,configurable:!0,writable:!0});var s=new Function("arrayBuffer","offset","count","callback",i);return Object.defineProperty(a,"readStructs",{value:s,configurable:!0,writable:!0}),a}},readString:{value:function(e,t,r){var n,a="";if(r){n=new Uint8Array(e,t,r);for(var o=0;o<r;++o){var u=n[o];if(0===u)break;a+=String.fromCharCode(u)}}else{n=new Uint8Array(e,t),o=0;while(1){if(u=n[o++],0===u)break;a+=String.fromCharCode(u)}}return a}},readInt8Array:{value:function(e,t,r){for(var n=new Int8Array(r),a=new DataView(e,t),o=0;o<r;++o)n[o]=a.getInt8(o,!0);return n}},readUint8Array:{value:function(e,t,r){for(var n=new Uint8Array(r),a=new DataView(e,t),o=0;o<r;++o)n[o]=a.getUint8(o,!0);return n}},readInt16Array:{value:function(e,t,r){for(var n=new Int16Array(r),a=new DataView(e,t),o=0;o<r;++o)n[o]=a.getInt16(2*o,!0);return n}},readUint16Array:{value:function(e,t,r){for(var n=new Uint16Array(r),a=new DataView(e,t),o=0;o<r;++o)n[o]=a.getUint16(2*o,!0);return n}},readInt32Array:{value:function(e,t,r){for(var n=new Int32Array(r),a=new DataView(e,t),o=0;o<r;++o)n[o]=a.getInt32(4*o,!0);return n}},readUint32Array:{value:function(e,t,r){for(var n=new Uint32Array(r),a=new DataView(e,t),o=0;o<r;++o)n[o]=a.getUint32(4*o,!0);return n}},readFloat32Array:{value:function(e,t,r){for(var n=new Float32Array(r),a=new DataView(e,t),o=0;o<r;++o)n[o]=a.getFloat32(4*o,!0);return n}},readFloat64Array:{value:function(e,t,r){for(var n=new Float64Array(r),a=new DataView(e,t),o=0;o<r;++o)n[o]=a.getFloat64(8*o,!0);return n}}})},"4a60":function(e,t,r){e.exports=r.p+"img/类脑计算机.7fc9a32c.png"},"56d7":function(e,t,r){"use strict";r.r(t);r("e260"),r("e6cf"),r("cca6"),r("a79d");var n=r("2b0e"),a=function(){var e=this,t=e.$createElement,r=e._self._c||t;return r("div",{attrs:{id:"app"}},[r("router-view")],1)},o=[],u=(r("a15b"),r("1157")),i=r.n(u),s=r("c8b0");r("21c1");function l(){var e={nodes:[],models:[],tasks:[]};Object(s["a"])((function(t){for(var r=0;r<t.length;r++){var n=t[r];if(1==n["board_status"]){var a={ip:n["ip_address"].join("."),id:n["board_id"],chips:n["chips"],usedNeureNums:[],role:n["board_role"]};e.nodes.push(a);for(var o=n["file_list"],u=0;u<o.length;u++){var s=o[u];if(1!=s["model_status"]&&0!=s["model_size"]){var l={id:s["model_id"],name:s["model_name"],nodeID:a.id,nodeIP:a.ip};e.models.push(l)}if(3==s["model_status"]){var c={id:s["model_id"],name:s["model_name"],nodeID:a.id,nodeIP:a.ip};e.tasks.push(c)}}}}console.log("app page get all boards data: ",e),i.a.ajax({url:"http://localhost:5002/post",method:"post",data:JSON.stringify(e),success:function(e){console.log(e,"page post success")},error:function(e){console.error(e,"page post error")}})}))}i()((function(){var e=i()(window).height();console.log(e);var t=e;i()("#app").height(t)})),setInterval(l,3e3);var c,d={},f=d,h=(r("034f"),r("2877")),m=Object(h["a"])(f,a,o,!1,null,null,null),p=m.exports,v=(r("d3b7"),r("3ca3"),r("ddb0"),r("8c4f")),b=function(){var e=this,t=e.$createElement,r=e._self._c||t;return r("div",{staticClass:"home_page"},[r("div",[r("div",{staticClass:"home_introduction"},[e._m(0),r("br"),r("table",{staticClass:"home_hovertable"},[e._m(1),r("tr",[r("td",[e._v("健康状态")]),r("td",[1==e.systemStatus?[r("div",{staticClass:"home_statusOkLogo"}),r("span",[e._v(" 健康")])]:0==e.systemStatus?[r("div",{staticClass:"home_statusErrLogo"}),r("span",[e._v(" 系统异常")])]:e._e()],2)]),e._m(2),r("tr",[r("td",[e._v("节点总数")]),r("td",[e._v(e._s(e.totalNodeNum))])]),r("tr",[r("td",[e._v("Master节点数")]),r("td",[e._v(e._s(e.masterNodeNum))])]),r("tr",[r("td",[e._v("Shadow节点数")]),r("td",[e._v(e._s(e.shadowNodeNum))])]),r("tr",[r("td",[e._v("Slave节点数")]),r("td",[e._v(e._s(e.slaveNodeNum))])]),r("tr",[r("td",[e._v("运行中节点数")]),r("td",[e._v(e._s(e.runNodeNum))])]),r("tr",[r("td",[e._v("芯片总数")]),r("td",[e._v(e._s(e.totalChipNum))])]),r("tr",[r("td",[e._v("运行中芯片数")]),r("td",[e._v(e._s(e.runChipNum))])]),r("tr",[r("td",[e._v("神经元簇总数")]),r("td",[e._v(e._s(e.totalNeureNum))])]),r("tr",[r("td",[e._v("运行中神经元簇个数")]),r("td",[e._v(e._s(e.runNeureNum))])])])]),e._m(3)])])},g=[function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("div",{staticClass:"home_logo_box"},[n("img",{staticClass:"home_os_logo",attrs:{src:r("4a60"),alt:"darwin os"}})])},function(){var e=this,t=e.$createElement,r=e._self._c||t;return r("tr",[r("td",[e._v("系统名称")]),r("td",[e._v("达尔文类脑计算机系统")])])},function(){var e=this,t=e.$createElement,r=e._self._c||t;return r("tr",[r("td",[e._v("版本号")]),r("td",[e._v("V1")])])},function(){var e=this,t=e.$createElement,r=e._self._c||t;return r("div",{staticClass:"home_topology"},[r("div",{attrs:{id:"topologyEchart"}}),r("div",{staticClass:"home_node_logoBox"},[r("div",{staticClass:"home_coommonNodeLogo masterNodeLogo"}),r("span",{staticClass:"home_logoDesc"},[e._v(" master节点")]),r("div",{staticClass:"home_coommonNodeLogo shadowNodeLogo"}),r("span",{staticClass:"home_logoDesc"},[e._v(" shadow节点")]),r("div",{staticClass:"home_coommonNodeLogo slaveNodeLogo"}),r("span",{staticClass:"home_logoDesc"},[e._v(" slave节点")]),r("div",{staticClass:"home_coommonNodeLogo outlineNodeLogo"}),r("span",{staticClass:"home_logoDesc"},[e._v(" 不在线节点")])])])}],y=(r("cb29"),r("b0c0"),r("159b"),r("caad"),r("2532"),r("313e")),_=[{c1:"#0054ff",c2:"#4e98ff"},{c1:"#77A4FF",c2:"#AFD1FF"},{c1:"#FF77E0",c2:"#FFD1F9"},{c1:"#FFA73C",c2:"#FFDDA6"}],w="topologyEchart",N=[],C=-1,L=-1,S=[],O=[],j=[],A={toolbox:{show:!0,left:"right",right:20,top:"bottom",bottom:20},selectedMode:"false",bottom:20,left:0,right:0,top:0,animationDuration:1500,animationEasingUpdate:"quinticInOut",series:[{name:"拓扑图",type:"graph",hoverAnimation:!1,layout:"force",force:{repulsion:200,edgeLength:260},nodeScaleRatio:.6,draggable:!0,roam:!0,symbol:"circle",data:O,links:j,focusNodeAdjacency:!0,scaleLimit:{min:.5,max:9},edgeSymbol:["circle","arrow"],edgeSymbolSize:[3,6],label:{normal:{show:!0,position:"right",color:"#fff",distance:5,fontSize:12}},lineStyle:{normal:{width:1.5,curveness:0,type:"solid"}}}]};function D(e,t){for(var r={name:"根节点",value:e,list:[]},n=0;n<=t;n++)if(n!=e){var a={name:"节点"+n,value:n,list:[]};r.list.push(a)}var o=[];return o.push(r),o}function I(e,t,r){e.forEach((function(e){e.list&&e.list.forEach((function(n,a){0===t&&(N.includes(n.value)?n.value==L?(r=_[3],n.category=2):(r=_[2],n.category=1):(r=_[1],n.category=3));var o=null;switch(t){case 0:o=n.list.length>0?{normal:{color:"target"}}:{normal:{color:r.c2}};break;default:o={normal:{color:"source"}};break}var u={source:e.name,target:n.name,lineStyle:o};j.push(u),n.list&&e.list.length>0&&I(e.list,t+1)}))}))}function k(e,t,r,n){e.forEach((function(e,a){if(null===e.name)return!1;var o=10;switch(t){case 0:o=87;break;case 1:o=67;break;default:o=10;break}var u=null;switch(t){case 0:case 1:u={position:"inside",rotate:0};break;default:break}0===t&&(r=-1==C?_[1]:_[0]),1==t&&(r=N.includes(e.value)?e.value==L?_[3]:_[2]:_[1]);var i={color:r.c2},s=null;s={type:"radial",x:.5,y:.5,r:.5,colorStops:[{offset:.2,color:r.c1},{offset:.8,color:r.c2},{offset:1,color:r.c2}],global:!1};var l=null;e.list&&0!==e.list.length?l=-1==C?{color:r.c2,borderColor:r.c2}:{color:s,borderColor:r.c2}:(e.isEnd=!0,l="true"==e.isdisease?{color:s,borderColor:r.c2}:{color:s}),l=Object.assign(l,{shadowColor:"rgba(255, 255, 255, 0.5)",shadowBlur:10}),1==t&&(n=e.name);var c={name:e.name,symbolSize:o,category:n,label:u,color:s,itemStyle:l,lineStyle:i};c=Object.assign(e,c),0===t&&(c=Object.assign(c,{root:!0})),e.list&&0===e.list.length&&(c=Object.assign(c,{isEnd:!0})),O.push(c),e.list&&e.list.length>0&&k(e.list,t+1,r,n)}))}function P(e,t,r,n,a){var o=document.getElementById(w),u=y.getInstanceByDom(o);u&&y.dispose(u),c=y.init(document.getElementById(w)),C=e,L=t,N=n,S=D(e,r),k(JSON.parse(JSON.stringify(S)),0),I(JSON.parse(JSON.stringify(S)),0),c.setOption(A),E(a),window.addEventListener("resize",(function(){c.resize()}))}function x(e,t,r,n,a){C=e,L=t,N=n,O=[],j=[];var o=c.getOption();S=D(e,r),k(JSON.parse(JSON.stringify(S)),0),I(JSON.parse(JSON.stringify(S)),0),o.series[0].data=O,o.series[0].links=j,c.setOption(o),E(a),window.addEventListener("resize",(function(){c.resize()}))}function E(e){c.on("click",(function(t){var r=t.data.value;"node"!=t.dataType||-1==r||!N.includes(r)&&C!=r?console.log("节点不在线"):e.push({path:"/node",query:{nodeID:r}})}))}var F={name:"App",data:function(){return{input_board_id:-1,nodeList:[],totalNodeNum:60,notMasterNodeNum:59,masterNodeNum:0,shadowNodeNum:0,slaveNodeNum:0,runNodeNum:0,systemStatus:0,totalChipNum:720,runChipNum:0,totalNeureNum:414720,runNeureNum:0,runNodeIDList:[],masterNodeID:1,shadowNodeID:-1,runNodeInfo:[]}},mounted:function(){var e=this;Object(s["a"])((function(t){for(var r=[],n=0;n<t.length;n++){var a=t[n],o={ip:a["ip_address"].join("."),id:a["board_id"],status:a["board_status"],chips:a["chips"],file_list:a["file_list"],rule:a["board_role"]};r.push(o),"192.168.1.254"==o.ip?(e.masterNodeID=o.id,e.masterNodeNum++):e.runNodeIDList.push(a["board_id"]),2==o.rule&&(e.shadowNodeID=o.id,e.shadowNodeNum++)}for(var u=new Array(72).fill(new Array(96).fill(0)),i=0;i<60;i++){var s={ip:function(e){return 0==e?"192.168.1.254":"192.168.1."+(e+1)}(i),id:i+1,status:1,chips:new Array(12).fill(0),node_matrix_data:u};e.nodeList.push(s)}e.systemStatus=1,e.runNodeNum=t.length,e.runChipNum=12*e.runNodeNum,e.runNeureNum=24*e.runChipNum*24,e.slaveNodeNum=e.runNodeNum-e.masterNodeNum-e.shadowNodeNum,e.runNodeInfo=e._node_list,x(e.masterNodeID,e.shadowNodeID,e.notMasterNodeNum,e.runNodeIDList,e.$router)})),P(e.masterNodeID,e.shadowNodeID,this.notMasterNodeNum,this.runNodeIDList,this.$router)},beforeRouteEnter:function(e,t,r){r((function(r){"Home"==e.name&&null!=t.name&&"Home"!=t.name&&(console.log("reload home page"),window.location.reload())}))},watch:{},methods:{}},M=r("255a");i()((function(){var e=i()(window).height();console.log("***",e);var t=e-150;i()(".home").height(t),i()(".box").height(t)})),window.Struct=M["a"];var V=F,U=V,B=(r("cccb"),Object(h["a"])(U,b,g,!1,null,null,null)),T=B.exports;n["default"].use(v["a"]);var J=v["a"].prototype.push;v["a"].prototype.push=function(e){return J.call(this,e).catch((function(e){return e}))};var q=[{path:"/",name:"Home",component:T},{path:"/node",name:"Node",component:function(){return r.e("about").then(r.bind(null,"b601"))}},{path:"/chip",name:"Chip",component:function(){return r.e("about").then(r.bind(null,"b0b6"))}},{path:"/model",name:"Model",component:function(){return r.e("about").then(r.bind(null,"89a4"))}},{path:"/uploadModel",name:"UploadModel",component:function(){return r.e("about").then(r.bind(null,"23c4"))}},{path:"/task",name:"Task",component:function(){return r.e("about").then(r.bind(null,"f3e1"))}},{path:"/taskDetail",name:"TaskDetail",component:function(){return r.e("about").then(r.bind(null,"8b46"))}},{path:"/appDetail",name:"AppDetail",component:function(){return r.e("about").then(r.bind(null,"85d7"))}},{path:"/boardsData",name:"BoardsData",component:function(){return r.e("about").then(r.bind(null,"f8c0"))}},{path:"/about",name:"About",component:function(){return r.e("about").then(r.bind(null,"f820"))}}],z=new v["a"]({routes:q}),$=z,R=r("2f62");n["default"].use(R["a"]);var H=new R["a"].Store({state:{},mutations:{},actions:{},modules:{}}),X=r("5c96"),K=r.n(X);r("0fae");n["default"].use(K.a),n["default"].config.productionTip=!1,new n["default"]({router:$,store:H,render:function(e){return e(p)}}).$mount("#app")},"5ced":function(e,t,r){},6095:function(e,t,r){"use strict";r.r(t),function(e){r.d(t,"extract_data",(function(){return o})),r.d(t,"array_sum",(function(){return u})),r.d(t,"array_equal",(function(){return i})),r.d(t,"walk_data",(function(){return s})),r.d(t,"array_mean",(function(){return l})),r.d(t,"blob_to_uint32",(function(){return c})),r.d(t,"arrayBufferToBuffer",(function(){return a})),r.d(t,"trancat",(function(){return d}));r("5cc6"),r("9a8c"),r("a975"),r("735e"),r("c1ac"),r("d139"),r("3a7b"),r("d5d6"),r("82f8"),r("e91f"),r("60bd"),r("5f96"),r("3280"),r("3fcc"),r("ca91"),r("25a1"),r("cd26"),r("3c5d"),r("2954"),r("649e"),r("219c"),r("170b"),r("b39a"),r("72f7"),r("d3b7"),r("a9e3"),r("99af"),r("fb6a");var n=r("255a");function a(t){for(var r=new e(t.byteLength),n=new Uint8Array(t),a=0;a<r.length;++a)r[a]=n[a];return r}function o(e){var t=0,r=[],n=0;while(t<e.length)n=Number(e[t]),r=r.concat(e.slice(t+1,t+1+n)),t+=n+1;return r}function u(e){for(var t=0,r=0;r<e.length;r++)t+=e[r];return t}function i(e,t){if(e.length!=t.length)return!1;for(var r=0;r<e.length;r++)if(e[r]!=t[r])return!1;return!0}function s(e,t){var r=arguments.length>2&&void 0!==arguments[2]?arguments[2]:60;0==e.length?e.push([0,t]):e.push([e[e.length-1][0]+1,t]),e.length>r-1&&e.shift()}function l(e){for(var t=0,r=0;r<e.length;r++)t=(t*r+e[r])/(r+1);return t}function c(e,t){var r=new FileReader;r.readAsArrayBuffer(e),r.onload=function(e){var a=r.result,o=4,u=Math.ceil(a.byteLength/o),i=n["a"].create(n["a"].array("uint32_array",n["a"].uint32(),u));i=i.readStructs(a,0,1),i=i[0].uint32_array;for(var s=[],l=0;l<i.length;l++)s.push(Number(i[l]));t(s)}}function d(e,t,r){for(var n=0;n<e.length;n++)e[n]=Math.min(Math.max(e[n],t),r)}}.call(this,r("b639").Buffer)},"85ec":function(e,t,r){},c8b0:function(e,t,r){"use strict";r.d(t,"a",(function(){return u}));var n=r("255a"),a=r("1157"),o=r.n(a);function u(e){var t="192.168.1.254";console.log("发送请求。。。。"),o.a.ajax({url:"http://"+t+"/request_file_list/",type:"post",data:{placeholder:1},cache:!1,xhr:function(){var e=new XMLHttpRequest;return e.responseType="blob",e},success:function(t){var r=new FileReader;r.onload=function(){for(var t=r.result,a=32,o=20,u=2100,i=Math.floor(t.byteLength/u),s=n["a"].create(n["a"].uint16("model_id"),n["a"].uint32("model_size"),n["a"].string("model_name",a),n["a"].string("real_model_name",a),n["a"].string("md5",32),n["a"].uint8("model_status")),l=n["a"].create(n["a"].uint16("board_id"),n["a"].array("ip_address",n["a"].uint8(),4),n["a"].uint8("board_status"),n["a"].uint8("noresp"),n["a"].array("chips",n["a"].uint8(),12),n["a"].string("version",8),n["a"].array("file_list",s,o),n["a"].uint32("_config_list"),n["a"].uint32("_app_list"),n["a"].uint32("_slave_tcpb"),n["a"].uint8("board_role")),c=l.readStructs(t,0,i),d=[],f=0;f<c.length;f++){var h=c[f];1==h["board_status"]&&d.push(h)}console.log("在线节点: ",d),e(d)},r.readAsArrayBuffer(t)},error:function(e){}})}},cccb:function(e,t,r){"use strict";r("5ced")}});
//# sourceMappingURL=app.c05b1ce6.js.map