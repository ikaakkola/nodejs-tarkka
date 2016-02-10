# nodejs-tarkka

NodeJS utilities to automate things based on Fortum Tarkka hourly prices


## Examples

__Fetch 'Tarkka' hourly data__

    nodejs /path/to/tarkka_fetch.js /tmp/tarkka_result.json

__Query highest 5 hours from previously fetched data__

    nodejs /path/to/tarkka_query.js /tmp/tarkka_result.json highest 5

__Publish particle.io event if current hour is one of the highest 5__

    nodejs /path/to/tarkka_particleIoEvent.js access_token event_name /path/to/tarkka_query.js /tmp/tarkka_result.json highest 5 

The above publishes an event to particle.io as ''event_name'' if the current hour (the hour the command is
run) is within the 5 highest hours.

__Call 'myFunction' on device 'aaabbb' with parameter 'R0:HIGH' if current hour is over 4.2__

    nodejs /path/to/tarkka_particleIoCallFunction.js access_token device_id myFunction R0:HIGH /path/to/tarkka_query.js /tmp/tarkka_result.json over 4.2





