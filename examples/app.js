(function (angular) {
  'use strict';

  angular
    .module('playground', ['ngMaterial', 'angularjs-gauge'])
    .config(configApp)
    .controller('MainController', mainController);

  configApp.$inject = ['$mdThemingProvider'];
  function configApp($mdThemingProvider) {
    $mdThemingProvider.theme('default')
      .primaryPalette('teal', {
        'default': '400', // by default use shade 400 from the pink palette for primary intentions
        'hue-1': '100', // use shade 100 for the <code>md-hue-1</code> class
        'hue-2': '600', // use shade 600 for the <code>md-hue-2</code> class
        'hue-3': 'A100' // use shade A100 for the <code>md-hue-3</code> class
      })
      // If you specify less than all of the keys, it will inherit from the
      // default shades
      .accentPalette('amber', {
        'default': '200' // use shade 200 for default, and keep all other shades the same
      });
  }

  mainController.$inject = [];
  function mainController() {
    var vm = this;
    vm.options = {
      type: 'arch',
      cap: 'square',
      size: 300,
      value: 50,
      thick: 20,
      label: 'Usage',
      append: 'GB',
      min: 0,
      max: 100,
      foregroundColor: '#FEC925',
      backgroundColor: 'rgba(0, 0, 0, 0.2)'
    };

    vm.thresholds = {
      '0': {color: 'green'},
      '8': {color: "orange"},
      '20': {color: 'yellow'},
      '30': {color: 'coral'},
      '80': {color: 'red'}
    }
    vm.empty = {};
  }
}(angular));