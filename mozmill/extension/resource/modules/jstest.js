// ***** BEGIN LICENSE BLOCK *****
// Version: MPL 1.1/GPL 2.0/LGPL 2.1
// 
// The contents of this file are subject to the Mozilla Public License Version
// 1.1 (the "License"); you may not use this file except in compliance with
// the License. You may obtain a copy of the License at
// http://www.mozilla.org/MPL/
// 
// Software distributed under the License is distributed on an "AS IS" basis,
// WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
// for the specific language governing rights and limitations under the
// License.
// 
// The Original Code is Mozilla Corporation Code.
// 
// The Initial Developer of the Original Code is
// Adam Christian.
// Portions created by the Initial Developer are Copyright (C) 2008
// the Initial Developer. All Rights Reserved.
// 
// Contributor(s):
//  Adam Christian <adam.christian@gmail.com>
//  Mikeal Rogers <mikeal.rogers@gmail.com>
// 
// Alternatively, the contents of this file may be used under the terms of
// either the GNU General Public License Version 2 or later (the "GPL"), or
// the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
// in which case the provisions of the GPL or the LGPL are applicable instead
// of those above. If you wish to allow use of your version of this file only
// under the terms of either the GPL or the LGPL, and not to allow others to
// use your version of this file under the terms of the MPL, indicate your
// decision by deleting the provisions above and replace them with the notice
// and other provisions required by the GPL or the LGPL. If you do not delete
// the provisions above, a recipient may use your version of this file under
// the terms of any one of the MPL, the GPL or the LGPL.
// 
// ***** END LICENSE BLOCK *****

var EXPORTED_SYMBOLS = ["runFromFile", "runFromString"];
var results = {}; Components.utils.import('resource://mozmill/modules/results.js', results);

var runFromFile = function(path){
  var code = getFile(path);
  var tests = parseTest(code);
  var result = run(tests, code);
  return;
}

var runFromString = function(code){
  var tests = parseTest(code);
  var result = run(tests, code);
  //report(result);
  return;
}

var run = function(tests, code){
  var re = /\/\*(.|\n)*?\*\//g;
  code = code.replace(re, '');
  
  try { var r = eval(code); }
  catch(err){
    results.write('Please run valid JavaScript only. '+err, 'lightred');
  }
  
  for (test in tests){   
    try {
      var func = eval(tests[test]);
      if (typeof func == 'function'){
        
        results.write("Running "+tests[test]+'...');    
        results.status(tests[test]+'...');
        
        //do some timing and run the func
        var d = new Date();
        var startMS = d.getTime();
        func.call(this);
        var d = new Date();
        var endMS  = d.getTime();
        var runTime = endMS - startMS;
        results.perf('Test '+ tests[test]+' had runtime of '+runTime+' ms.');
        results.write("Succesfully ran "+tests[test], 'lightgreen');
      }
    }
    catch(err){
      results.write('Error running '+tests[test]+", "+err, 'lightred');
    }
  }
  return true;
}

var parseTest = function(s){
  var re = /test\S+/g;
  var tests = s.match(re);
  
  //in the case the tests contains something like
  //var blah = "test"
  for (test in tests){
    //we may get an unterminated literal string err
    try {
      if (tests[test].indexOf('"') != -1){
        tests[test] = "";
      }
    } catch(err){ tests[test] = ""; }
  }
  
  var re = /setup/;
  var hasSetup = re.test(s);
  if (hasSetup){
    tests.unshift('setup');
  }
  
  var re = /teardown/;
  var hasTeardown = re.test(s);
  if (hasTeardown){
    tests.push('teardown');
  }
  return tests;
}

var getFile = function(path){
  //define the file interface
  var file = Components.classes["@mozilla.org/file/local;1"]
                       .createInstance(Components.interfaces.nsILocalFile);
  //point it at the file we want to get at
  file.initWithPath(path);
  // define file stream interfaces
  var data = "";
  var fstream = Components.classes["@mozilla.org/network/file-input-stream;1"]
                          .createInstance(Components.interfaces.nsIFileInputStream);
  var sstream = Components.classes["@mozilla.org/scriptableinputstream;1"]
                          .createInstance(Components.interfaces.nsIScriptableInputStream);
  fstream.init(file, -1, 0, 0);
  sstream.init(fstream); 

  //pull the contents of the file out
  var str = sstream.read(4096);
  while (str.length > 0) {
    data += str;
    str = sstream.read(4096);
  }

  sstream.close();
  fstream.close();

  //data = data.replace(/\r|\n|\r\n/g, "");
  return data;  
}