/*
 * Reads the hours over provided c/kWh limit from given 'Tarkka' hourly file.
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
var limit = -1;

// Usage information
var usage = function() {
    console.log( "Usage: nodejs tarkka_over.js file limit" );
    console.log( "\nfile - the full filesystem path to read data from." );
    console.log( "limit - the c/kWh limit to return hours for, inclusive." );
    process.exit( 1 );
}

//
// Main
//

var args = process.argv.splice( 2 );
if( args.length < 2 ) {
    usage();
}

resultFile = args[ 0 ];
limit = parseFloat( args[ 1 ] );

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

    var hours = [];
    for( var i = 0; i < data.data.length; i++ ) {
        var val = data.data[ i ];
        if( val >= limit ) {
            hours.push( i );
        }
    }
    var res = {
        "value": limit,
        "unit": "c/kWh",
        "hours": hours
    }
    console.log( JSON.stringify( res ) );
} catch( e ) {
    console.log( "Unable to read data from '" + resultFile + "': " + e );
    process.exit( 1 );
}
