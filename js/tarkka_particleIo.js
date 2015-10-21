/*
 * Reads tarkka_query.js output and creates a particle.io event out of the
 * given data.
 * 
 * All queries are performed so that they only return values if the query matches
 * the current hour
 * 
 * Requires: spark (npm install spark)
 * 
 * Usage:
 * 
 * nodejs tarkka_particleIo.js /path/to/tarkka_query.js /tmp/tarkka_data.json highest 5 apikey deviceId eventname 
 * 
 * Copyright 2015, Ilkka Kaakkola <xenic@iki.fi>
 * 
 * Licensed under Apache License 2.0
 */

// Usage information
var usage = function() {
    console.log( "Usage: nodejs tarkka_particleIo.js queryJs file mode apikey deviceId eventname ttl" );
    console.log( "\nqueryJs - full path to tarkka_query.js" );
    console.log( "file - the full path to read data from." );
    console.log( "mode - query mode, one of 'highest','lowest','under','over'" );
    console.log( "mode_specific - query mode specific, either number of highest or lowest entries, or 'limit' for over or udner" )
    console.log( "apikey - particle.io API key" );
    console.log( "device - particle.io device ID" );
    console.log( "eventname - name of the publish event" );
    console
        .log( "duration - duration of the event in seconds, this is sent as the 'data' for an event. Defaults to 3600 (1 hour). The amount of seconds that has passed for this hour is reduced from the value." );
    process.exit( 1 );
}

//
// Utility functions
//

/* Called after spark login */
var loginCallback = function( spark, event, device, err, body ) {
    if( err !== null ) {
        console.error( "Login failed: " + err + "\n" );
        if( body != null ) {
            console.error( JSON.stringify( body ) );
        }
        process.exit( 1 );
    }

    postEvent( spark, event, device );
}

/* Post given event to spark */
var postEvent = function( spark, event, device ) {
    var publishEventPr = spark.publishEvent( device, event );

    publishEventPr.then( function( data ) {
            if( data.ok ) {
                console.log( "Event published succesfully." )
            }
        }, function( err ) {
            console.error( "Failed to publish event '" + JSON.stringify( event ) + "' to device '" + device + "': " + err )
            process.exit( 1 );
        } );
}

//
// Main
//

// Process arguments
var queryJs = null;
var file = null;
var mode = null;
var modeSpecific = null;
var device = null;
var apiKey = null;
var eventName = null;
var duration = 3600;

var args = process.argv.splice( 2 );
if( args.length < 7 ) {
    usage();
}

for( var i = 0; i < args.length; i++ ) {
    switch( i ) {
        case 0:
            queryJs = args[ i ];
            break;
        case 1:
            file = args[ i ];
            break;
        case 2:
            mode = args[ i ];
            break;
        case 3:
            modeSpecific = args[ i ];
            break;
        case 4:
            apiKey = args[ i ];
            break;
        case 5:
            device = args[ i ];
            break;
        case 6:
            eventName = args[ i ];
            break;
        case 7:
            duration = parseInt( args[ i ] );
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
            data = query.queryHighest( file, count, now.getHours() );
            break;
        case "lowest":
            var count = parseInt( modeSpecific );
            data = query.queryLowest( file, count, now.getHours() );
            break;
        case "under":
            var limit = parseFloat( modeSpecific );
            data = query.queryUnder( file, limit, now.getHours() );
            break;
        case "over":
            var limit = parseFloat( modeSpecific );
            data = query.queryOver( file, limit, now.getHours() );
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
        console.log( "Hour " + now.getHours() + " did not match query '" + mode + "'." );
        process.exit( 0 );
    }

    var finalDuration = parseInt( duration ) - ( ( now.getMinutes() * 60 ) + now.getSeconds() );
    if( finalDuration < 0 ) {
        finalDuration = duration;
    }

    var event = {
        "name": eventName,
        "hour": data.values[ 0 ].hour,
        "value": data.values[ 0 ].value,
        "durationsec": finalDuration
    }
    console.log( JSON.stringify( event ) );

    var spark = require( 'spark' );

    spark.login( {
            accessToken: apiKey
        }, function( err, body ) {
            loginCallback( spark, event, device, err, body );
        } );
} catch( e ) {
    console.error( "Internal error: " + e );
    process.exit( 1 );
}
