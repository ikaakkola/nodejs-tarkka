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
 * Query 5 highest hours, only returning hour 12 if it was within the 5 highest
 * nodejs tarkka_query.js /data/fetch_result.json highest 5 12
 * 
 * Query current hour, returning the value if it is over the given limit
 * nodejs tarkka_query.js /data/fetch_result.json over 5.42 current
 * 
 * Query current hour, returning the value if it is under the given limit
 * nodejs tarkka_query.js /data/fetch_result.json under 3.42 current
 *
 *  Copyright 2015 Ilkka Kaakkola <xenic@iki.fi>
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

//
// Globals
//
var fs = require( 'fs' );
var today = new Date();
today.setHours( 0 );
today.setMinutes( 0 );
today.setSeconds( 0 );
today.setMilliseconds( 0 );

//
// We maybe used as a module
//
module.exports = {
    /**
     * Query the highest count hours from the file, returning a JSON object
     * containing the result. If hour is specified, only returns value for that 
     * hour, or no values if that hour is not one of the highest. 
     *
     * 'current' may be used as the hour value to use current hour.
     */
    queryHighest: function( file, count, hour ) {
        return doQuery( file, "highest", count, hour );
    },
    /**
     * Query the lowest count hours from the file, returning a JSON object
     * containing the result. If hour is specified, only returns value for that 
     * hour, or no values if that hour is not one of the lowest.
     *
     * 'current' may be used as the hour value to use current hour.
     */
    queryLowest: function( file, count, hour ) {
        return doQuery( file, "lowest", count, hour );
    },
    /**
     * Query the values under or at given limit, returning a JSON object
     * containing the result. If hour is specified, only returns value for that 
     * hour, or no values if that hour has no value under the limit.
     *
     * 'current' may be used as the hour value to use current hour.
     */
    queryUnder: function( file, limit, hour ) {
        return doQuery( file, "under", limit, hour );
    },
    /**
     * Query the values over or at given limit, returning a JSON object
     * containing the result. If hour is specified, only returns value for that 
     * hour, or no values if that hour has no value over the limit.
     *
     * 'current' may be used as the hour value to use current hour.
     */
    queryOver: function( file, limit, hour ) {
        return doQuery( file, "over", limit, hour );
    }
}

// Usage information
var usage = function() {
    console.log( "Usage: nodejs tarkka_query.js file mode [mode_specific hour]" );
    console.log( "\nfile - the full filesystem path to read data from." );
    console.log( "mode - mode of query, one of 'highest,lowest,under,over'" );
    console.log( "mode_specific - mode specific parameter, for highest and "
        + "lowest this is the number of values to return, for over and under this is the value limit to query for" );
    console.log( "hour - only return value for this hour, 0 to 23. Returns empty result if there was no matching value for hour. Use 'current' for current hour." );
    process.exit( 1 );
}

//
// Utility functions
//

var makeError = function( text ) {
    return JSON.stringify( {
            "error": text,
            "values": []
        } );
}

var doQuery = function( file, mode, modeSpecific, hour ) {
    if( typeof hour !== "undefined" && "current" === hour ) {
	hour = new Date().getHours();
    }

    // Look for result file
    var valid = false;
    try {
        var fileStats = fs.statSync( file );
        if( !fileStats.isFile() ) {
            throw( "'" + file + "' is not a file." );
        }

        var data = JSON.parse( fs.readFileSync( file, 'utf8' ) );
        if( data.time < today.getTime() ) {
            throw( "File '" + file + "' does not contain valid results for today." );
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
                var count = modeSpecific == null ? 5: parseInt( modeSpecific );
                if( count <= 0 ) {
                    count = 1;
                }
                if( count >= values.length ) {
                    count = values.length;
                }
                resultValues = [];
                var previousValue = -1;
                for( var i = 0; i < values.length; i++ ) {
                    if( i >= count && previousValue != values[ i ] ) {
                        break;
                    }
                    previousValue = values[ i ];
                    resultValues.push( values[ i ] );
                }
                break;
            case "over":
                var limit = modeSpecific == null ? 6.00: parseFloat( modeSpecific );
                resultValues = [];
                for( var i = 0; i < values.length; i++ ) {
                    if( values[ i ].value >= limit ) {
                        resultValues.push( values[ i ] );
                    }
                }
                break;
            case "under":
                var limit = modeSpecific == null ? 6.00: parseFloat( modeSpecific );
                resultValues = [];
                for( var i = 0; i < values.length; i++ ) {
                    if( values[ i ].value <= limit ) {
                        resultValues.push( values[ i ] );
                    }
                }
        }

        if( hour >= 0 && hour < 24 ) {
            var want = null;
            for( var i = 0; i < resultValues.length; i++ ) {
                if( resultValues[ i ].hour == hour ) {
                    want = resultValues[ i ];
                    break;
                }
            }
            resultValues = [];
            if( want != null ) {
                resultValues.push( want );
            }
        }
        var res = {
            "values": resultValues,
            "unit": "c/kWh"
        }
        return res;
    } catch( e ) {
        throw( "Unable to read data from '" + resultFile + "': " + e );
    }
}

//
// Main
//
var runningAsScript = !module.parent;

if( runningAsScript ) {

    // Process arguments
    var args = process.argv.splice( 2 );
    if( args.length < 2 ) {
        usage();
    }

    var resultFile = args[ 0 ];
    var mode = args[ 1 ];
    var modeParam = args.length > 2 ? args[ 2 ]: null;
    var hour = args.length > 3 ? args[ 3 ]: hour;

    try {
        var res = doQuery( resultFile, mode.toLowerCase(), modeParam, hour );
        console.log( JSON.stringify( res ) );
        process.exit( 0 );
    } catch( e ) {
        console.log( makeError( "" + e ) );
        process.exit( 1 );
    }
}
