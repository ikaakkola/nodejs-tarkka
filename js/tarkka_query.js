/*
 * Reads data from a tarkka_fetch.js file according to given parameters
 * 
 * Requires: fs
 * 
 * Usage:
 * 
 * Query 5 highest hours
 * nodejs tarkka_query.js /data/fetch_result.json highest 5
 * 
 * Query 2 lowest hours
 * nodejs tarkka_query.js /data/fetch_result.json lowest 2
 * 
 * Query hours above or at given limit
 * nodejs tarkka_query.js /data/fetch_result.json over 5.01
 *
 * Query hours below or at given limit
 * nodejs tarkka_query.js /data/fetch_result.json under 3.21
 * 
 * Copyright 2015, Ilkka Kaakkola <xenic@iki.fi>
 * 
 * Licensed under Apache License 2.0
 */

//
// Globals
//
var fs = require( 'fs' );
var today = new Date();
today.setHours( 0 );
today.setMinutes( 0 );
today.setSeconds( 0 );
today.setMilliseconds( 0 );
var resultFile = null;
var mode = null;
var count = 1;
var limit = 5.00;

// Usage information
var usage = function() {
    console.log( "Usage: nodejs tarkka_query.js file mode [mode_specific]" );
    console.log( "\nfile - the full filesystem path to read data from." );
    console.log( "mode - mode of query, one of 'highest,lowest,under,over'" );
    console.log( "mode_specific - mode specific parameter, for highest and "
        + "lowest this is the number of values to return, for over and under this is the value limit to query for" );
    process.exit( 1 );
}

//
// Main
//

// Process arguments
var args = process.argv.splice( 2 );
if( args.length < 2 ) {
    usage();
}

resultFile = args[ 0 ];
mode = args[ 1 ];
if( "highest" === mode.toLowerCase() || "lowest" === mode.toLowerCase() ) {
    count = args.length > 2 ? args[ 2 ]: count;
} else {
    limit = args.length > 2 ? args[ 2 ]: count;
}

// Look for result file
var valid = false;
try {
    var fileStats = fs.statSync( resultFile );
    if( !fileStats.isFile() ) {
        console.log( "'" + resultFile + "' is not a file." );
        process.exit( 1 );
    }

    var data = JSON.parse( fs.readFileSync( resultFile, 'utf8' ) );
    if( data.time < today.getTime() ) {
        console.log( "File '" + resultFile + "' does not contain valid results for today." );
        process.exit( 1 );
    }
    var values = [];
    for( var i = 0; i < data.data.length; i++ ) {
        var val = data.data[ i ];
        values.push( {
                "hour": i,
                "value": data.data[ i ]
            } );
    }

    values.sort( function( a, b ) {
            switch( mode.toLowerCase() ) {
                case "highest":
                case "over":
                    if( a.value > b.value ) {
                        return -1;
                    }
                    if( b.value > a.value ) {
                        return 1;
                    }
                    return a.hour > b.hour;
                case "lowest":
                case "under":
                    if( a.value > b.value ) {
                        return 1;
                    }
                    if( b.value > a.value ) {
                        return -1;
                    }
                    return a.hour > b.hour;
            }
        } );
    var resultValues;
    switch( mode.toLowerCase() ) {
        case "highest":
        case "lowest":
            if( count <= 0 ) {
                count = 1;
            }
            if( count >= values.length ) {
                count = values.length;
            }
            resultValues = values.splice( 0, count );
            break;
        case "over":
            resultValues = [];
            for( var i = 0; i < values.length; i++ ) {
                if( values[ i ].value >= limit ) {
                    resultValues.push( values[ i ] );
                }
            }
            break;
        case "under":
            resultValues = [];
            for( var i = 0; i < values.length; i++ ) {
                if( values[ i ].value <= limit ) {
                    resultValues.push( values[ i ] );
                }
            }
    }
    var res = {
        "values": resultValues,
        "unit": "c/kWh"
    }
    console.log( JSON.stringify( res ) );
    process.exit( 0 );
} catch( e ) {
    console.log( "Unable to read data from '" + resultFile + "': " + e );
    process.exit( 1 );
}
