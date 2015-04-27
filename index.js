var Device = require('zetta-device');
var util = require('util');

function randomBound(low,high) {
  return Math.random() * (high-low) + low;
}

function randomTemp(low, high) {
  return Number(randomBound(low,high).toFixed(2));
}

// Name defaults to 'thermostat' if not provided
var Thermostat = module.exports = function(name) {
  Device.call(this);
  this.name = name || 'thermostat';

  this['current-temperature'] = randomTemp(70,80);
  this['heating-setpoint'] = 76.0;
  this['cooling-setpoint'] = 76.0;
  this['system-mode'] = 'cool';
  this['running-mode'] = 'off';
  this['drift'] = 1.5;

  this._tempChange = 1.0;

  setTimeout(this._tick.bind(this),randomBound(1000, 3000));
}

util.inherits(Thermostat, Device);

Thermostat.prototype.init = function(config) {
  config
    .name(this.name)
    .type('thermostat')
    .monitor('current-temperature')
    .monitor('heating-setpoint')
    .monitor('cooling-setpoint')
    .monitor('system-mode')
    .monitor('running-mode')
    .monitor('drift')
    .state('ready')
    .when('ready', {allow:['heating-setpoint','cooling-setpoint','system-mode','drift']})
    .map('heating-setpoint', this.setHeatingSetpoint, [{name:'temperature',type:'number'}])
    .map('cooling-setpoint', this.setCoolingSetpoint, [{name:'temperature',type:'number'}])
    .map('system-mode', this.setSystemMode, [
      {
        name:'mode',
        type:'radio',
        value: [
          {value:'off'},
          {value:'cool'},
          {value:'heat'}
        ]
      }
    ])
    .map('drift', this.setDrift,[{name:'drift',type:'number'}]);
}

Thermostat.prototype.setHeatingSetpoint = function(temp, cb) {
  this['heating-setpoint'] = Number(temp);
  cb();
}

Thermostat.prototype.setCoolingSetpoint = function(temp, cb) {
  this['cooling-setpoint'] = Number(temp);
  cb();
}

Thermostat.prototype.setSystemMode = function(mode, cb) {
  this['system-mode'] = mode;
  cb();
}

Thermostat.prototype.setDrift = function(drift, cb) {
  this['drift'] = Math.abs(Number(drift));
  cb();
}

Thermostat.prototype._tick = function() {
  var current = this['current-temperature'];
  var mode = this['system-mode'];
  var running = this['running-mode'];

  var jitter = randomTemp(0,1);
  if(this._tempChange < 0) {
    jitter *= -1;
  }

  current += (this._tempChange + jitter);
  current = Number(current.toFixed(2));
  if(current > 100) current = 100;
  else if(current < 32) current = 32;

  console.log(this.name + ': Temp changed to ' + current);
  this['current-temperature'] = current;

  switch(mode) {
    case 'cool':
      // cool if the current temp is > than the setpoint and drift
      if(current > (this['cooling-setpoint'] + this['drift'])) {
        // if we are already cooling, do nothing
        if( running != 'cooling' ) {
          console.log('starting cool');
          this._tempChange = -1.0;
          this['running-mode'] = 'cooling';
        }
      } else if(current < (this['cooling-setpoint'] - this['drift'])) {
        if( running != 'off' ) {
          console.log('stopping cool');
          this._tempChange = 1.0;
          this['running-mode'] = 'off';
        }
      }
      break;
    case 'heat':
      // cool if the current temp is > than the setpoint and drift
      if(current < (this['heating-setpoint'] - this['drift'])) {
        // if we are already cooling, do nothing
        if( running != 'heating' ) {
          console.log('staring heat');
          this._tempChange = 1.0;
          this['running-mode'] = 'heating';
        }
      } else if(current > (this['heating-setpoint'] + this['drift'])) {
        if( running != 'off' ) {
          console.log('stopping heat');
          this._tempChange = -1.0;
          this['running-mode'] = 'off';
        }
      }
      break;
  }
  
  setTimeout(this._tick.bind(this),5000);
}