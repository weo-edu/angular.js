'use strict';

describe('$routeParams', function() {
  it('should publish the params into a service',  function() {
    module(function($routeProvider) {
      $routeProvider.when('/foo', {});
      $routeProvider.when('/bar/:barId', {});
    });

    inject(function($rootScope, $route, $location, $routeParams) {
      $location.path('/foo').search('a=b');
      $rootScope.$digest();
      expect($routeParams).toEqual({a:'b'});

      $location.path('/bar/123').search('x=abc');
      $rootScope.$digest();
      expect($routeParams).toEqual({barId:'123', x:'abc'});
    });
  });

  it('should correctly extract the params when a param name is part of the route',  function() {
    module(function($routeProvider) {
      $routeProvider.when('/bar/:foo/:bar', {});
    });

    inject(function($rootScope, $route, $location, $routeParams) {
      $location.path('/bar/foovalue/barvalue');
      $rootScope.$digest();
      expect($routeParams).toEqual({bar:'barvalue', foo:'foovalue'});
    });
  });

  it('should correctly extract the params when an optional param name is part of the route',  function() {
    module(function($routeProvider) {
      $routeProvider.when('/bar/:foo?', {});
    });

    inject(function($rootScope, $route, $location, $routeParams) {
      $location.path('/bar');
      $rootScope.$digest();
      expect($routeParams).toEqual({});

      $location.path('/bar/foovalue');
      $rootScope.$digest();
      expect($routeParams).toEqual({foo: 'foovalue'});

    });
  });

  it('should correctly extract the params when a wildcard is part of the route',  function() {
    module(function($routeProvider) {
      $routeProvider.when('/bar/*', {});
    });

    inject(function($rootScope, $route, $location, $routeParams) {
      $location.path('/bar');
      $rootScope.$digest();
      expect($routeParams).toEqual({});

      $location.path('/bar/foovalue');
      $rootScope.$digest();
      expect($routeParams).toEqual({0: 'foovalue'});

    });
  });

  it('should correctly extract the params when multiple wildcards are part of the route',  function() {
    module(function($routeProvider) {
      $routeProvider.when('/bar/*.*', {});
    });

    inject(function($rootScope, $route, $location, $routeParams) {
      $location.path('/bar/foo.js');
      $rootScope.$digest();
      expect($routeParams).toEqual({0: 'foo', 1: 'js'});
    });
  });

  it('should correctly extract params when route is a regex', function() {
    module(function($routeProvider) {
      $routeProvider.when(/\/(\d+)/, {});
    });

    inject(function($rootScope, $route, $location, $routeParams) {
      $location.path('/12');
      $rootScope.$digest();
      expect($routeParams).toEqual({0: '12'});
    });
  });

  it('should correctly ignore params in ellipsees', function() {
    module(function($routeProvider) {
      $routeProvider.when('/bar/...', {});
    });

    inject(function($rootScope, $route, $location, $routeParams) {
      $location.path('/bar/foovalue');
      $rootScope.$digest();
      expect($routeParams).toEqual({});

    });

  });


});
