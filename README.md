# Mock Thermostat
  Attempts to emulate a simple thermostat.  Running mode will react to changes in temperature.  Temperatures will change based off of the system-mode and running-mode

# Example
    var zetta = require('zetta');
    var Thermo = require('centralite-mock-thermostat');
    
    zetta()
      .use(Thermo,'Thermostat1')
      .listen(1337);