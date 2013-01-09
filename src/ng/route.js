'use strict';


/**
 * @ngdoc object
 * @name ng.$routeProvider
 * @function
 *
 * @description
 *
 * Used for configuring routes. See {@link ng.$route $route} for an example.
 */
function $RouteProvider(){
  var scopedRoutes = {},
      options = {
        strict: true
      };

    function scopeKey(scope) {
      return scope && scope.$id || null;
    }

    function addScope(scope) {
      var key = scopeKey(scope);
      scopedRoutes[key] = {
        routes: [],
        scope: scope
      };
      if (!scopedRoutes[null])
        scopedRoutes[null] = scopedRoutes[key];
    }

    function pushRoute(scope, route) {
      var key = scopeKey(scope);
      scopedRoutes[key].routes.push(route);
    }

    function removeScope(scope) {
      var key = scopeKey(scope);
      var router = scopedRoutes[key];
      delete scopedRoutes[key];
      if (scopedRoutes[null] === router)
        delete scopedRoutes[null];
    }

    function scoped(scope) {
      var key = scopeKey(scope);
      if (key in scopedRoutes)
        return scopedRoutes[key];
      else {
        return scoped(scope.$parent);
      }
    }

  /**
   * @ngdoc method
   * @name ng.$routeProvider#when
   * @methodOf ng.$routeProvider
   *
   * @param {string} path Route path (matched against `$location.path`). If `$location.path`
   *    contains redundant trailing slash or is missing one, the route will still match and the
   *    `$location.path` will be updated to add or drop the trailing slash to exacly match the
   *    route definition.
   * @param {Object} route Mapping information to be assigned to `$route.current` on route
   *    match.
   *
   *    Object properties:
   *
   *    - `controller` – `{(string|function()=}` – Controller fn that should be associated with newly
   *      created scope or the name of a {@link angular.Module#controller registered controller}
   *      if passed as a string.
   *    - `template` – `{string=}` –  html template as a string that should be used by
   *      {@link ng.directive:ngView ngView} or
   *      {@link ng.directive:ngInclude ngInclude} directives.
   *      this property takes precedence over `templateUrl`.
   *    - `templateUrl` – `{string=}` – path to an html template that should be used by
   *      {@link ng.directive:ngView ngView}.
   *    - `resolve` - `{Object.<string, function>=}` - An optional map of dependencies which should
   *      be injected into the controller. If any of these dependencies are promises, they will be
   *      resolved and converted to a value before the controller is instantiated and the
   *      `$routeChangeSuccess` event is fired. The map object is:
   *
   *      - `key` – `{string}`: a name of a dependency to be injected into the controller.
   *      - `factory` - `{string|function}`: If `string` then it is an alias for a service.
   *        Otherwise if function, then it is {@link api/AUTO.$injector#invoke injected}
   *        and the return value is treated as the dependency. If the result is a promise, it is resolved
   *        before its value is injected into the controller.
   *
   *    - `redirectTo` – {(string|function())=} – value to update
   *      {@link ng.$location $location} path with and trigger route redirection.
   *
   *      If `redirectTo` is a function, it will be called with the following parameters:
   *
   *      - `{Object.<string>}` - route parameters extracted from the current
   *        `$location.path()` by applying the current route templateUrl.
   *      - `{string}` - current `$location.path()`
   *      - `{Object}` - current `$location.search()`
   *
   *      The custom `redirectTo` function is expected to return a string which will be used
   *      to update `$location.path()` and `$location.search()`.
   *
   *    - `[reloadOnSearch=true]` - {boolean=} - reload route when only $location.search()
   *    changes.
   *
   *      If the option is set to `false` and url in the browser changes, then
   *      `$routeUpdate` event is broadcasted on the root scope.
   *
   * @returns {Object} self
   *
   * @description
   * Adds a new route definition to the `$route` service.
   */
  var trailingRegex = /^.*(\.\.\.|\*)$/g;
  function when(scope, path, route, opts) {
    if (scope === null && !scopedRoutes[null])
      addScope(null);

    if (this.base && isString(path) && path[0] !== '/') {
      path = this.base + path;
    }

    pushRoute(scope, extend(
      {reloadOnSearch: true}, 
      route,
      path && pathRegExp(path, extend({}, options, opts))
    ));

    // create redirection for trailing slashes
    if (path && !trailingRegex.exec(path)) {
      var redirectPath = (path[path.length-1] === '/')
          ? path.substr(0, path.length-1)
          : path +'/';

      pushRoute(scope, extend(
        {redirectTo: path},
        pathRegExp(redirectPath, extend({}, options, opts))
      ));
    }

    return this;
  }

  this.when = bind(this, when, null);

  //  http://github.com/visionmedia/express
  function pathRegExp(path, opts) {
    var sensitive = opts.sensitive,
        strict = opts.strict,
        ret = {
          originalPath: path,
          regexp: path
        },
        keys = ret.keys = [];

    if (path instanceof RegExp) return ret;

    path = path
      .replace(/([\\\(\)\^\$])/g, "\\$1")
      .concat(strict ? '' : '/?')
      .replace(/\/\(/g, '(?:/')
      .replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?(\*)?/g, function(_, slash, format, key, capture, optional, star){
        keys.push({ name: key, optional: !! optional });
        slash = slash || '';
        return ''
          + (optional ? '' : slash)
          + '(?:'
          + (optional ? slash : '')
          + (format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')'
          + (optional || '')
          + (star ? '(/*)?' : '');
      })
      .replace(/([\/.])/g, '\\$1')
      .replace(/\*/g, '(.*)')
      .replace(/\\.\\.\\.$/g, function(a, b) {
        ret.ellipsis = true;
        return ''
      });

    ret.regexp = new RegExp('^' + path + (ret.ellipsis ? '' : '$'), sensitive ? '' : 'i');
    return ret
  }

  /**
   * @ngdoc method
   * @name ng.$routeProvider#otherwise
   * @methodOf ng.$routeProvider
   *
   * @description
   * Sets route definition that will be used on route change when no other route definition
   * is matched.
   *
   * @param {Object} params Mapping information to be assigned to `$route.current`.
   * @returns {Object} self
   */
   function otherwise(scope, params) {
    var key = scopeKey(scope), 
        routes = scopedRoutes[key].routes;

    routes[null] = extend(
      {reloadOnSearch: true}, 
      params);
    return this;
   }

   this.otherwise = bind(this, otherwise, null);

  /*
   * @ngdoc method
   * @name ng.$routeProvider#options
   * @methodOf ng$routeProvider
   *
   * @description
   * Options fore route matching.
   *   - `sensitive` enable case-sensitive routes
   *   - `strict` disable strict matching for trailing slashes
   */
  
  this.options = function(opts) {
    extend(options, opts);
    return this;
  }


  this.$get = ['$rootScope', '$location', '$routeParams', '$q', '$injector', '$http', '$templateCache', '$interpolate',
      function( $rootScope,   $location,   $routeParams,   $q,   $injector,   $http,   $templateCache, $interpolate) {

    /**
     * @ngdoc object
     * @name ng.$route
     * @requires $location
     * @requires $routeParams
     *
     * @property {Object} current Reference to the current route definition.
     * The route definition contains:
     *
     *   - `controller`: The controller constructor as define in route definition.
     *   - `locals`: A map of locals which is used by {@link ng.$controller $controller} service for
     *     controller instantiation. The `locals` contain
     *     the resolved values of the `resolve` map. Additionally the `locals` also contain:
     *
     *     - `$scope` - The current route scope.
     *     - `$template` - The current route template HTML.
     *
     * @property {Array.<Object>} routes Array of all configured routes.
     *
     * @description
     * Is used for deep-linking URLs to controllers and views (HTML partials).
     * It watches `$location.url()` and tries to map the path to an existing route definition.
     *
     * You can define routes through {@link ng.$routeProvider $routeProvider}'s API.
     *
     * The `$route` service is typically used in conjunction with {@link ng.directive:ngView ngView}
     * directive and the {@link ng.$routeParams $routeParams} service.
     *
     * @example
       This example shows how changing the URL hash causes the `$route` to match a route against the
       URL, and the `ngView` pulls in the partial.

       Note that this example is using {@link ng.directive:script inlined templates}
       to get it working on jsfiddle as well.

     <example module="ngView">
       <file name="index.html">
         <div ng-controller="MainCntl">
           Choose:
           <a href="Book/Moby">Moby</a> |
           <a href="Book/Moby/ch/1">Moby: Ch1</a> |
           <a href="Book/Gatsby">Gatsby</a> |
           <a href="Book/Gatsby/ch/4?key=value">Gatsby: Ch4</a> |
           <a href="Book/Scarlet">Scarlet Letter</a><br/>

           <div ng-view></div>
           <hr />

           <pre>$location.path() = {{$location.path()}}</pre>
           <pre>$route.current.templateUrl = {{$route.current.templateUrl}}</pre>
           <pre>$route.current.params = {{$route.current.params}}</pre>
           <pre>$route.current.scope.name = {{$route.current.scope.name}}</pre>
           <pre>$routeParams = {{$routeParams}}</pre>
         </div>
       </file>

       <file name="book.html">
         controller: {{name}}<br />
         Book Id: {{params.bookId}}<br />
       </file>

       <file name="chapter.html">
         controller: {{name}}<br />
         Book Id: {{params.bookId}}<br />
         Chapter Id: {{params.chapterId}}
       </file>

       <file name="script.js">
         angular.module('ngView', [], function($routeProvider, $locationProvider) {
           $routeProvider.when('/Book/:bookId', {
             templateUrl: 'book.html',
             controller: BookCntl,
             resolve: {
               // I will cause a 1 second delay
               delay: function($q, $timeout) {
                 var delay = $q.defer();
                 $timeout(delay.resolve, 1000);
                 return delay.promise;
               }
             }
           });
           $routeProvider.when('/Book/:bookId/ch/:chapterId', {
             templateUrl: 'chapter.html',
             controller: ChapterCntl
           });

           // configure html5 to get links working on jsfiddle
           $locationProvider.html5Mode(true);
         });

         function MainCntl($scope, $route, $routeParams, $location) {
           $scope.$route = $route;
           $scope.$location = $location;
           $scope.$routeParams = $routeParams;
         }

         function BookCntl($scope, $routeParams) {
           $scope.name = "BookCntl";
           $scope.params = $routeParams;
         }

         function ChapterCntl($scope, $routeParams) {
           $scope.name = "ChapterCntl";
           $scope.params = $routeParams;
         }
       </file>

       <file name="scenario.js">
         it('should load and compile correct template', function() {
           element('a:contains("Moby: Ch1")').click();
           var content = element('.doc-example-live [ng-view]').text();
           expect(content).toMatch(/controller\: ChapterCntl/);
           expect(content).toMatch(/Book Id\: Moby/);
           expect(content).toMatch(/Chapter Id\: 1/);

           element('a:contains("Scarlet")').click();
           sleep(2); // promises are not part of scenario waiting
           content = element('.doc-example-live [ng-view]').text();
           expect(content).toMatch(/controller\: BookCntl/);
           expect(content).toMatch(/Book Id\: Scarlet/);
         });
       </file>
     </example>
     */

    /**
     * @ngdoc event
     * @name ng.$route#$routeChangeStart
     * @eventOf ng.$route
     * @eventType broadcast on root scope
     * @description
     * Broadcasted before a route change. At this  point the route services starts
     * resolving all of the dependencies needed for the route change to occurs.
     * Typically this involves fetching the view template as well as any dependencies
     * defined in `resolve` route property. Once  all of the dependencies are resolved
     * `$routeChangeSuccess` is fired.
     *
     * @param {Route} next Future route information.
     * @param {Route} current Current route information.
     */

    /**
     * @ngdoc event
     * @name ng.$route#$routeChangeSuccess
     * @eventOf ng.$route
     * @eventType broadcast on root scope
     * @description
     * Broadcasted after a route dependencies are resolved.
     * {@link ng.directive:ngView ngView} listens for the directive
     * to instantiate the controller and render the view.
     *
     * @param {Route} current Current route information.
     * @param {Route} previous Previous route information.
     */

    /**
     * @ngdoc event
     * @name ng.$route#$routeChangeError
     * @eventOf ng.$route
     * @eventType broadcast on root scope
     * @description
     * Broadcasted if any of the resolve promises are rejected.
     *
     * @param {Route} current Current route information.
     * @param {Route} previous Previous route information.
     * @param {Route} rejection Rejection of the promise. Usually the error of the failed promise.
     */

    /**
     * @ngdoc event
     * @name ng.$route#$routeUpdate
     * @eventOf ng.$route
     * @eventType broadcast on root scope
     * @description
     *
     * The `reloadOnSearch` property has been set to false, and we are reusing the same
     * instance of the Controller.
     */

    var matcher = switchRouteMatcher,
        forceReload = false,
        $route = {
          routes: scopedRoutes[null].routes,

          /**
           * @ngdoc method
           * @name ng.$route#reload
           * @methodOf ng.$route
           *
           * @description
           * Causes `$route` service to reload the current route even if
           * {@link ng.$location $location} hasn't changed.
           *
           * As a result of that, {@link ng.directive:ngView ngView}
           * creates new scope, reinstantiates the controller.
           */
          reload: function() {
            forceReload = true;
            $rootScope.$evalAsync(updateRoute);
          },

          /**
           * @ngdoc method
           * @name ng.$route#scopedRouter
           * @methodOf ng.$route
           *
           * @description
           * Creates a router on given scope, which controls routing for the
           * given scope and it's children.
           *
           * @param {Scope} scope The scope to link the router with.
           */

          scopedRouter: function(scope) {
            addScope(scope);

            function updateRouteListener(evt) {
              if (evt.targetScope.$id !== scope.$id) {
                evt.stopDescent();
                updateRoute(scope);
              }
            }

            // route events will be emitted twice for any listeners that come
            // before the ones added by scopeRouter, so don't allow them
            forEach(['$routeUpdate', '$routeChangeStart', '$routeChangeSuccess', '$routeChangeError'], function(name) {
              if (scope.$$listeners[name])
                throw new Error('Scoped router must be first listener to route events');
            });

            scope.$on('$routeUpdate', updateRouteListener);
            scope.$on('$routeChangeStart', function(evt) {
              if (evt.targetScope.$id !== scope.$id)
                evt.stopDescent();
            });
            scope.$on('$routeChangeSuccess', updateRouteListener);
            scope.$on('$routeChangeError', updateRouteListener);
            scope.$on('$destroy', function() {
              removeScope(scope);
            });

            var ret = {};
            ret.base = basePath(scope.$parent);
            ret.when = bind(ret, when, scope);
            ret.otherwise = bind(ret, otherwise, scope);
            ret.updateRoute = bind(null, updateRoute, scope);
            return ret;
          },

          scoped: scoped
        };

    $route.__defineGetter__('current', function() {
      return scopedRoutes[null].current;
    });

    $rootScope.$on('$locationChangeSuccess', function() {
      updateRoute();
    });

    return $route;

    /////////////////////////////////////////////////////
    
    function basePath(scope) {
      var current  = $route.scoped(scope).current;
      if (!current) return;
      return current.base;
    }

    // http://github.com/visionmedia/express
    function switchRouteMatcher(on, route) {
      var keys = route.keys,
          params = {};

      if (!route.regexp) return null;



      var m = route.regexp.exec(on);
      if (!m) return null;

      if (route.ellipsis)
        route.base = m[0];

      var N = 0;
      for (var i = 1, len = m.length; i < len; ++i) {
        var key = keys[i - 1];

        var val = 'string' == typeof m[i]
          ? decodeURIComponent(m[i])
          : m[i];

        if (key) {
          params[key.name] = val;
        } else {
          params[N++] = val;
        }
      }

      return params;
    }

    function updateRoute(scope) {
      var next = parseRoute(scope),
          route = $route.scoped(scope),
          scope = route.scope,
          last = route.current;

      if (next && last && next.$route === last.$route && 
        equals(next.pathParams, last.pathParams) && 
        (!(!equals(next.params, last.params) && next.reloadOnSearch)) && 
        !forceReload) {
        last.params = next.params;
        if (!scope)
          copy(last.params, $routeParams);
        (scope || $rootScope).$routeParams = last.params;
        (scope || $rootScope).$broadcast('$routeUpdate', last);
      } else if (next || last) {
        forceReload = false;
        (scope || $rootScope).$broadcast('$routeChangeStart', next, last);
        route.current = next;
        if (next) {
          if (next.redirectTo) {
            if (isString(next.redirectTo)) {
              $location.path(interpolate(next.redirectTo, next.params, scope)).search(next.params)
                       .replace();
            } else {
              $location.url(next.redirectTo(next.pathParams, $location.path(), $location.search()))
                       .replace();
            }
          }
        }

        $q.when(next).
          then(function() {
            if (next) {
              var keys = [],
                  values = [],
                  template;

              forEach(next.resolve || {}, function(value, key) {
                keys.push(key);
                values.push(isString(value) ? $injector.get(value) : $injector.invoke(value));
              });
              if (isDefined(template = next.template)) {
              } else if (isDefined(template = next.templateUrl)) {
                template = $http.get(template, {cache: $templateCache}).
                    then(function(response) { return response.data; });
              }
              if (isDefined(template)) {
                keys.push('$template');
                values.push(template);
              }
              return $q.all(values).then(function(values) {
                var locals = {};
                forEach(values, function(value, index) {
                  locals[keys[index]] = value;
                });
                return locals;
              });
            }
          }).
          // after route change
          then(function(locals) {
            if (next == route.current) {
              if (next) {
                next.locals = locals;
                if (!scope)
                  copy(next.params, $routeParams);
                (scope || $rootScope).$routeParams = next.params;
              }
              (scope || $rootScope).$broadcast('$routeChangeSuccess', next, last);
            }
          }, function(error) {
            if (next == route.current) {
              (scope || $rootScope).$broadcast('$routeChangeError', next, last, error);
            }
          });
      }
    }


    /**
     * @returns the current active route, by matching it against the URL
     */
    function parseRoute(scope) {
      // Match a route
      var routes = $route.scoped(scope).routes,
          params, match;

      forEach(routes, function(route, path) {
        if (!match && (params = matcher($location.path(), route))) {
          match = inherit(route, {
            params: extend({}, $location.search(), params),
            pathParams: params});
          match.$route = route;
        }
      });

      // No route matched; fallback to "otherwise" route
      return match ||  routes[null] && inherit(routes[null], {params: {}, pathParams:{}});;
    }

    /**
     * @returns interpolation of the redirect path with the parametrs
     */
    function interpolate(string, params, scope) {
      if (scope) {
        string = $interpolate(string)(scope);
      }

      var result = [];
      forEach((string||'').split(':'), function(segment, i) {
        if (i == 0) {
          result.push(segment);
        } else {
          var segmentMatch = segment.match(/(\w+)(.*)/);
          var key = segmentMatch[1];
          result.push(params[key]);
          result.push(segmentMatch[2] || '');
          delete params[key];
        }
      });
      return result.join('');
    }
  }];
}
