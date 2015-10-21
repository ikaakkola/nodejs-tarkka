/*
 * Reads the lowest hour(s) from given 'Tarkka' hourly file.
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
    console.log( "Usage: nodejs tarkka_lowest.js file" );
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

    var lowestValue = -1;
    var lowestHours = [];
    for( var i = 0; i < data.data.length; i++ ) {
        var val = data.data[ i ];
        if( lowestValue === -1 ) {
            lowestValue = val;
            lowestHours.push( i );
            continue;
        }

        if( val > lowestValue ) {
            continue;
        }

        if( val <= lowestValue ) {
            lowestHours = [];
        }

        lowestValue = val;
        lowestHours.push( i );
    }
    var res = {
        "value": lowestValue,
        "unit": "c/kWh",
        "hours": lowestHours
    }
    console.log( JSON.stringify( res ) );
} catch( e ) {
    console.log( "Unable to read data from '" + resultFile + "': " + e );
    process.exit( 1 );
}
