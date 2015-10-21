# nodejs-tarkka

NodeJS utilities to automate things based on Fortum Tarkka hourly prices


## Examples

__Fetch 'Tarkka' hourly data__

    nodejs /path/to/tarkka_fetch.js /tmp/tarkka_result.json

__Query highest 5 hours from previously fetched data__

    nodejs /path/to/tarkka_query.js /tmp/tarkka_result.json highest 5

__Publish particle.io event if current hour is one of the highest 5__

    nodejs /path/to/tarkka_particleIo.js /path/to/tarkka_query.js /tmp/tarkka_result.json highest 5 access_token device_id highest-hours 60

The above publishes an event to particle.io for the deice ''device_id'' if the current hour (the hour the command is
run) is within the 5 highest hours.

The published event JSON looks like this (command ran at 22:26):

    {
      "name":"highest-hours",
      "hour":22,
      "value":3.21,
      "durationsec": 1985
    }

