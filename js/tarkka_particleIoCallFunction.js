/*
 * Reads tarkka_query.js output and calls a particle.io device function based
 * on the result of the query data. 
 * 
 * Requires: spark (npm install spark)
 * 
 * Usage:
 * 
 * nodejs tarkka_particleIoCallFunction.js apikey device function params /path/to/tarkka_query.js /tmp/tarkka_data.json highest 5 
 * 
 * 
 *  Copyright 2016 Ilkka Kaakkola <xenic@iki.fi>
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

// Usage information
var usage = function() {
    console.log( "Usage: nodejs tarkka_particleIo.js apikey device function functionParams queryJs file mode modeParams modeHour" );
    console.log( "apikey - particle.io API key" );
    console.log( "device - ID of device to call function on" );
    console.log( "function - Name of function to call" );
    console.log( "functionParams - Parameters for function. If set to 'query', will use result of query as parameter." );
    console.log( "\nqueryJs - full path to tarkka_query.js" );
    console.log( "file - the full path to read data from." );
    console.log( "mode - query mode, one of 'highest','lowest','under','over'" );
    console.log( "modeParam - query mode specific, either number of highest or lowest entries, or 'limit' for over or under" )
    console.log( "modeHour - query mode hour, use 'current' (or leave unset) to use current hour" );
    process.exit( 1 );
}

//
// Utility functions
//

/* Called after spark login */
var loginCallback = function( spark, deviceId, functionName, params, err, body ) {
    if( err !== null ) {
        console.error( "Login failed: " + err + "\n" );
        if( body != null ) {
            console.error( JSON.stringify( body ) );
        }
        process.exit( 1 );
    }

    spark.getDevice(deviceId, function(err, device) {
	    if( err !== null && err !== "" ) {
		console.error( "Unable to find device: " + err + "\n" );
		process.exit( 1 );
	    }

	    console.log('Found device, name: ' + device.name);
	    callRemoteFunction( spark, device, functionName, params );
	});
}

/* Call given remote function on device*/
var callRemoteFunction = function( spark, device, functionName, params ) {

    device.callFunction(functionName, params, function( err, data ) {
            if( err !== null && err !== "" ) {
                console.error( "Unable to call function on device: " + err + "\n" );
                process.exit( 1 );
            }
	    console.log( "Function called succesfully: " + JSON.stringify( data ) + "" )
	});
}

//
// Main
//

// Process arguments
var apiKey = null;
var device = null;
var functionName = null;
var functionParams = null;
var queryJs = null;
var file = null;
var mode = null;
var modeSpecific = null;
var modeHour = "current";

var args = process.argv.splice( 2 );
if( args.length < 7 ) {
    usage();
}

for( var i = 0; i < args.length; i++ ) {
    switch( i ) {
        case 0:
	    apiKey = args[i];
            break;
        case 1:
	    device = args[i];
            break;
        case 2:
	    functionName = args[i];
            break;
        case 3:
	    functionParams = args[i];
            break;
        case 4:
	    queryJs = args[i];
            break;
        case 5:
	    file = args[i];
            break;
        case 6:
	    mode = args[i];
            break;
        case 7:
	    modeSpecific = args[i];
	    break;
         case 8:
	     modeHour = args[i];
	     break;
    }
}

var now = new Date();
var data = null;
var query = require( queryJs );

try {
    switch( mode.toLowerCase() ) {
        case "highest":
            var count = parseInt( modeSpecific );
            data = query.queryHighest( file, count, modeHour );
            break;
        case "lowest":
            var count = parseInt( modeSpecific );
            data = query.queryLowest( file, count, modeHour );
            break;
        case "under":
            var limit = parseFloat( modeSpecific );
            data = query.queryUnder( file, limit, modeHour );
            break;
        case "over":
            var limit = parseFloat( modeSpecific );
            data = query.queryOver( file, limit, modeHour );
            break;
        default:
            console.error( "Unknown mode '" + mode + "'" );
            process.exit( 1 );
    }

    if( data == null ) {
        console.error( "No data received for query." );
        process.exit( 1 );
    }

    if( typeof data.error !== "undefined" && data.error !== null ) {
        console.error( "Query failed: " + data.error );
        process.exit( 1 );
    }

    if( data.values.length == 0 ) {
        // This hour did not query
        console.log( "Hour " + modeHour + " did not match query '" + mode + "'." );
        process.exit( 0 );
    }

    var finalParams = null;
    if( functionParams === null || functionParams === "query" ) {
	finalParams = "value=" + data.values[0].value + ",hour=" + data.values[0].hour;
    } else {
	finalParams = functionParams;
    }

    console.log( "Calling '" + functionName + "' of device '" + device + "' with parameters '" + finalParams + "'" );

    var spark = require( 'spark' );

    spark.login( {
            accessToken: apiKey
        }, function( err, body ) {
            loginCallback( spark, device, functionName, finalParams, err, body );
        } );
} catch( e ) {
    console.error( "Internal error: " + e );
    process.exit( 1 );
}
