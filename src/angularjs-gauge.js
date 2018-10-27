(function (angular) {
  'use strict';
  angular
    .module('angularjs-gauge', [])
    .directive('ngGauge', gaugeMeterDirective)
    .provider('ngGauge', gaugeMeterProviderFn);

  gaugeMeterProviderFn.$inject = [];
  function gaugeMeterProviderFn() {
    var defaultOptions = {
      size: 200,
      cap: 'square',
      thick: 20,
      type: 'arch',
      foregroundColor: { amber: '#FEC925', green: '#5AB190' },
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
      duration: 1000,
      pass: 0 ,
      target: 0,
      total:0,
      epa: ''
    };

    this.setOptions = function (customOptions) {
      if (!(customOptions && angular.isObject(customOptions)))
        throw new Error('Invalid option type specified in the ngGaugeProvider');
      defaultOptions = angular.merge(defaultOptions, customOptions);
    };

    var ngGauge = {
      getOptions: function () {
        return angular.extend({}, defaultOptions);
      }
    };

    this.$get = function () {
      return ngGauge;
    };
  }

  gaugeMeterDirective.$inject = ['ngGauge'];

  function gaugeMeterDirective(ngGauge) {

    var tpl =
      '<div style="display:inline-block;text-align:center;position:relative;">' +
      '<pass> {{pass | number}} </pass>' +
      '<labelpass> Pass </labelpass>' +
      '<total> Total: {{ total | number }} </total>' +
      '<target> {{ target | number }} </target>' +
      '<epa> {{ epa }} </epa>' +
      '<canvas></canvas>' +
      '</div>';

    var Gauge = function (element, options) {
      this.element = element.find('canvas')[0];
      this.pass = element.find('pass');
      this.total = element.find('total');
      this.labelpass = element.find('labelpass');
      this.target = element.find('target');
      this.epa = element.find('epa');
      this.context = this.element.getContext('2d');
      this.options = options;
      this.init();
    };

    Gauge.prototype = {

      init: function () {
        this.setupStyles();
        this.create(null, null);
      },

      setupStyles: function () {

        this.context.canvas.width = this.options.size;
        this.context.canvas.height = this.options.size;
        this.context.lineCap = this.options.cap;
        this.context.lineWidth = this.options.thick;

        var lfs = this.options.size * 0.22;
        var top = this.options.size * 0.20;

        this.pass.css({
          width: '100%',
          position: 'absolute',
          fontSize: lfs + 'px',
          top: top + 'px'
        });

        var fs = this.options.size / 13;
        var lh = parseInt(lfs) + parseInt(top) + 15;
        this.labelpass.css({
          width: '100%',
          position: 'absolute',
          fontSize: fs + 'px',
          top: lh + 'px'
        });

        var fst = this.options.size / 18;
        var topTotal = this.options.size * 0.65;
        this.total.css({
          width: '100%',
          position: 'absolute',
          fontSize: fst + 'px',
          top: topTotal + 'px'
        });

        this.epa.css({
          width: '120%',
          position: 'absolute',
          fontSize: fst + 'px',
          right: '-10%',
          bottom: '0px'
        });

        var aw = parseInt(fs) * 1.7;
        var bounds = this.getBounds(this.options.type);
        var unit = (bounds.tail - bounds.head) / (this.getMax());
        var angle = bounds.head + (unit * (this.options.target));
        var targetX = this.getCenter().x + Math.cos(angle) * (this.getRadius()) - (aw / 4);
        var targetY = this.getCenter().y + Math.sin(angle) * (this.getRadius()) - (aw / 2);
        this.target.css({
          "border-radius": "50%",
          "background-color": 'white',
          "border-style": "solid",
          color: "rgba(0, 150, 136, 1)",
          width: aw + 'px',
          height: aw + 'px',
          position: 'absolute',
          fontSize: fs + 'px',
          top: targetY + 'px',
          left: targetX + 'px'
        });


      },

      create: function (nv, ov) {

        var self = this,
          type = this.getType(),
          bounds = this.getBounds(type),
          duration = this.getDuration(),
          min = this.getMin(),
          max = this.getMax(),
          pass = this.clamp(this.getPass(), min, max),
          total = this.clamp(this.getTotal(), min, max),
          target = this.getTarget(),
          start = bounds.head,
          unit = (bounds.tail - bounds.head) / (max - min),
          displacementTotal = unit * (total - min),
          displacementPass = unit * (pass - min),
          tail = bounds.tail,
          color = this.getForegroundColor(pass, target),
          requestID,
          startTime;

        if (nv && ov) {
          displacementTotal = unit * nv - unit * ov;
          displacementPass = unit * nv - unit * ov;
        }

        function animate(timestamp) {
          timestamp = timestamp || new Date().getTime();
          var runtime = timestamp - startTime;
          var progress = Math.min(runtime / duration, 1); // never exceed 100%
          var previousProgress = ov ? (ov * unit) : 0;
          var middle = start + previousProgress + displacementTotal * progress;
          var stopPass = start + previousProgress + displacementPass * progress;

          self.drawShell(start, middle, stopPass, tail, color);
          if (runtime < duration) {
            requestID = window.requestAnimationFrame(function (timestamp) {
              animate(timestamp);
            });
          } else {
            cancelAnimationFrame(requestID);
          }
        }

        requestAnimationFrame(function (timestamp) {
          startTime = timestamp || new Date().getTime();
          animate(timestamp);
        });

      },

      getBounds: function (type) {
        var head, tail;
        if (type == 'semi') {
          head = Math.PI;
          tail = 2 * Math.PI;
        } else if (type == 'full') {
          head = 1.5 * Math.PI;
          tail = 3.5 * Math.PI;
        } else if (type === 'arch') {
          head = 0.8 * Math.PI;
          tail = 2.2 * Math.PI;
        }

        return {
          head: head,
          tail: tail
        };

      },

      drawShell: function (start, middle, stopPass, tail, color) {
        var
          context = this.context,
          center = this.getCenter(),
          radius = this.getRadius(),
          foregroundColor = color,
          backgroundColor = this.getBackgroundColor();

        this.clear();

        middle = Math.max(middle, start); // never below 0%
        middle = Math.min(middle, tail); // never exceed 100%

        // increase line size for background
        context.lineWidth = context.lineWidth + 2;
        context.beginPath();
        context.strokeStyle = backgroundColor;
        context.arc(center.x, center.y, radius, start, tail, false);
        context.stroke();

        // move the line width back to normal
        context.lineWidth = context.lineWidth - 2;
       // if (middle < tail) {
          context.beginPath();
          context.strokeStyle = 'white';
          context.arc(center.x, center.y, radius, middle, tail, false);
          context.stroke();
        //}

        if (stopPass > start) {
          context.beginPath();
          context.strokeStyle = foregroundColor;
          context.arc(center.x, center.y, radius, start, stopPass, false);
          context.stroke();
        }
        

      },

      clear: function () {
        this.context.clearRect(0, 0, this.getWidth(), this.getHeight());
      },

      update: function (nv, ov) {
        this.create(nv, ov);
      },

      destroy: function () {
        this.clear();
      },

      getRadius: function () {
        var center = this.getCenter();
        return center.x - this.getThickness();
      },

      getCenter: function () {
        var x = this.getWidth() / 2,
          y = this.getHeight() / 2;
        return {
          x: x,
          y: y
        };
      },
      getPass: function () {
        return this.options.pass;
      },
      getTarget: function () {
        return this.options.target;
      },
      getTotal: function () {
        return this.options.total;
      },
      getMin: function () {
        return 0;
      },
      getMax: function () {
        return Math.floor(this.options.target * 1.8);
      },
      getWidth: function () {
        return this.context.canvas.width;
      },

      getHeight: function () {
        return this.context.canvas.height;
      },

      getThickness: function () {
        return this.options.thick;
      },

      getBackgroundColor: function () {
        return this.options.backgroundColor;
      },

      getForegroundColor: function (pass, target) {
        if (pass < target) {
          return this.options.foregroundColor.amber;
        } else {
          return this.options.foregroundColor.green;
        }
      },

      getLineCap: function () {
        return this.options.cap;
      },

      getType: function () {
        return this.options.type;
      },

      getDuration: function () {
        return this.options.duration;
      },

      clamp: function (value, min, max) {
        return Math.max(min, Math.min(max, value));
      }

    };


    return {
      restrict: 'E',
      replace: true,
      template: tpl,
      scope: {
        backgroundColor: '@?',
        cap: '@?',
        foregroundColor: '@?',
        size: '@?',
        thick: '@?',
        type: '@?',
        duration: '@?',
        pass: '@?',
        total: '@?',
        target: '@?',
        epa: '@?'
      },
      link: function (scope, element) {
        var defaults = ngGauge.getOptions(); // fetching default settings from provider
        scope.size = angular.isDefined(scope.size) ? scope.size : defaults.size;
        scope.cap = angular.isDefined(scope.cap) ? scope.cap : defaults.cap;
        scope.thick = angular.isDefined(scope.thick) ? scope.thick : defaults.thick;
        scope.type = angular.isDefined(scope.type) ? scope.type : defaults.type;
        scope.duration = angular.isDefined(scope.duration) ? scope.duration : defaults.duration;
        scope.foregroundColor = angular.isDefined(scope.foregroundColor) ? scope.foregroundColor : defaults.foregroundColor;
        scope.backgroundColor = angular.isDefined(scope.backgroundColor) ? scope.backgroundColor : defaults.backgroundColor;
        scope.pass = angular.isDefined(scope.pass) ? scope.pass : defaults.pass;
        scope.total = angular.isDefined(scope.total) ? scope.total : defaults.total;
        scope.target = angular.isDefined(scope.target) ? scope.target : defaults.target;
        scope.epa = angular.isDefined(scope.epa) ? scope.epa : defaults.epa;

        var gauge = new Gauge(element, scope);

        scope.$watch('cap', watchOther, false);
        scope.$watch('thick', watchOther, false);
        scope.$watch('type', watchOther, false);
        scope.$watch('size', watchOther, false);
        scope.$watch('duration', watchOther, false);
        scope.$watch('foregroundColor', watchOther, false);
        scope.$watch('backgroundColor', watchOther, false);
        scope.$watch('pass', watchOther, false);
        scope.$watch('total', watchOther, false);
        scope.$watch('target', watchOther, false);
        scope.$watch('epa', watchData, false);

        scope.$on('$destroy', function () { });
        scope.$on('$resize', function () { });

        function watchData(nv, ov) {
          if (!gauge) return;
          if (!angular.isDefined(nv) || angular.equals(nv, ov)) return;
          gauge.update(nv, ov);
        }

        function watchOther(nv, ov) {
          if (!angular.isDefined(nv) || angular.equals(nv, ov)) return;
          gauge.destroy();
          gauge.init();
        }
      }
    };

  }
}(angular));
