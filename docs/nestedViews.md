Added scoped routing to make nested ngViews possible.

Example:

index.html
```html
<div>
  <a href="Book/Moby>Moby</a> |
  <a href="Book/Gatsby>Gatsby</a>
  <ng:view></ng:view>
</div>
```
book.html
```html
Name:  {{bookName}}
Chapters: 
<div ng-repeat="for chapter in chapters">
  <a href="/Book/{{$routeParams.name}}/chapter/{{chapter}}>{{chapter}}</a>
</div>
<ng:view></ng:view>
```

chapter.html
```html
Name: {{chapterName}}
Pages: {{pages}}
```

script.js
```javascript
angular.module('ngView', [], function()($routeProvider) {
  $routeProvider.when('/Book/:name/*', {
    templateUrl: 'book.html',
    controller: BookCntl,
    reloadOnParams: 'name'
  }); 
});

var books = {
  Moby: {
    chapterNames: ['the whale', 'the sea'],
    chapters: { 'the whale': {pages: 10}, 'the sea'' : {pages: 15} }
  }
  Gatsby: {
     chapterNames: ['the car'],
     chapters: { 'the car': {pages: 20} }
  }
};

function BookCntl($scope) {
 $scope.bookName = $scope.$routerParams.name;
 $scope.chapters = books[$scope.bookName];

  $scope.$router = function(router) {
    router.when('/Book/' + $scope.bookName + '/chapter/:name', {
      templateUrl: 'chapter.html',
      controller: ChapterCntl,
    }); 
  });
}

function ChapterCntl($scope) {
  $scope.chapterName = $scope.$routerParams.name;
  $scope.pages = books[$scope.bookName][$scope.chapterName].pages;
}     
```