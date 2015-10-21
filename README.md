# nodejs-tarkka

NodeJS utilities to automate things based on Fortum Tarkka hourly prices


## Examples

__Fetch 'Tarkka' hourly data__

    nodejs /path/to/tarkka_fetch.js /tmp/tarkka_result.json

__Query highest 5 hours from previously fetched data__

    nodejs /path/to/tarkka_query.js /tmp/tarkka_result.json highest 5

__Publish particle.io event if current hour is one of the highest 5__

    nodejs /path/to/tarkka_particleIo.js /path/to/tarkka_query.js /tmp/tarkka_result.json highest 5 access_token event_name 3600

The above publishes an event to particle.io as ''event_name'' if the current hour (the hour the command is
run) is within the 5 highest hours.

