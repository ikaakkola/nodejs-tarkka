/*
 * Reads the highest hour(s) from given 'Tarkka' hourly file.
 * 
 * Requires: fs
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

// Usage information
var usage = function() {
    console.log( "Usage: nodejs tarkka_highest.js file" );
    console.log( "\nfile - the full filesystem path to read data from.\n" );
    process.exit( 1 );
}

//
// Main
//

var args = process.argv.splice( 2 );
if( args.length == 0 ) {
    usage();
}

resultFile = args[ 0 ];

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

    var highestValue = -1;
    var highestHours = [];
    for( var i = 0; i < data.data.length; i++ ) {
        var val = data.data[ i ];
        if( highestValue === -1 ) {
            highestValue = val;
            highestHours.push( i );
            continue;
        }

        if( val < highestValue ) {
            continue;
        }

        if( val >= highestValue ) {
            highestHours = [];
        }

        highestValue = val;
        highestHours.push( i );
    }
    var res = {
        "value": highestValue,
        "unit": "c/kWh",
        "hours": highestHours
    }
    console.log( JSON.stringify( res ) );
} catch( e ) {
    console.log( "Unable to read data from '" + resultFile + "': " + e );
    process.exit( 1 );
}
