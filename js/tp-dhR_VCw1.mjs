/*! third party licenses: js/vendor.LICENSE.txt */
import{g as t}from"./modulepreload-polyfill-CtIajbZu.mjs";function a(e,s){for(var R=0;R<s.length;R++){const O=s[R];if(typeof O!="string"&&!Array.isArray(O)){for(const n in O)if(n!=="default"&&!(n in e)){const E=Object.getOwnPropertyDescriptor(O,n);E&&Object.defineProperty(e,n,E.get?E:{enumerable:!0,get:()=>O[n]})}}}return Object.freeze(Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}))}function N(e){const s={className:"number",begin:"[1-9][0-9]*",relevance:0},R={className:"symbol",begin:":[^\\]]+"},O={className:"built_in",begin:"(AR|P|PAYLOAD|PR|R|SR|RSR|LBL|VR|UALM|MESSAGE|UTOOL|UFRAME|TIMER|TIMER_OVERFLOW|JOINT_MAX_SPEED|RESUME_PROG|DIAG_REC)\\[",end:"\\]",contains:["self",s,R]},n={className:"built_in",begin:"(AI|AO|DI|DO|F|RI|RO|UI|UO|GI|GO|SI|SO)\\[",end:"\\]",contains:["self",s,e.QUOTE_STRING_MODE,R]};return{name:"TP",keywords:{keyword:["ABORT","ACC","ADJUST","AND","AP_LD","BREAK","CALL","CNT","COL","CONDITION","CONFIG","DA","DB","DIV","DETECT","ELSE","END","ENDFOR","ERR_NUM","ERROR_PROG","FINE","FOR","GP","GUARD","INC","IF","JMP","LINEAR_MAX_SPEED","LOCK","MOD","MONITOR","OFFSET","Offset","OR","OVERRIDE","PAUSE","PREG","PTH","RT_LD","RUN","SELECT","SKIP","Skip","TA","TB","TO","TOOL_OFFSET","Tool_Offset","UF","UT","UFRAME_NUM","UTOOL_NUM","UNLOCK","WAIT","X","Y","Z","W","P","R","STRLEN","SUBSTR","FINDSTR","VOFFSET","PROG","ATTR","MN","POS"],literal:["ON","OFF","max_speed","LPOS","JPOS","ENABLE","DISABLE","START","STOP","RESET"]},contains:[O,n,{className:"keyword",begin:"/(PROG|ATTR|MN|POS|END)\\b"},{className:"keyword",begin:"(CALL|RUN|POINT_LOGIC|LBL)\\b"},{className:"keyword",begin:"\\b(ACC|CNT|Skip|Offset|PSPD|RT_LD|AP_LD|Tool_Offset)"},{className:"number",begin:"\\d+(sec|msec|mm/sec|cm/min|inch/min|deg/sec|mm|in|cm)?\\b",relevance:0},e.COMMENT("//","[;$]"),e.COMMENT("!","[;$]"),e.COMMENT("--eg:","$"),e.QUOTE_STRING_MODE,{className:"string",begin:"'",end:"'"},e.C_NUMBER_MODE,{className:"variable",begin:"\\$[A-Za-z0-9_]+"}]}}var T=N;const r=t(T),o=a({__proto__:null,default:r},[T]);export{T as a,o as t};