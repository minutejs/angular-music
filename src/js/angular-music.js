/// <reference path="../../../minute/_all.d.ts" />
var Minute;
(function (Minute) {
    var AngularMusic = (function () {
        function AngularMusic() {
            var _this = this;
            this.$get = function ($rootScope, $q, $http, $audio, $ui) {
                var service = {};
                var categories = {};
                var template = "\n            <div class=\"box box-md\">\n                <div class=\"box-body\">\n                    <form>\n                        <div class=\"pull-right\"><a href=\"\" class=\"close-button\"><sup tooltip=\"remove\"><i class=\"fa fa-times\"></i></sup></a></div>\n                        \n                        <div class=\"progress\" ng-if=\"!!data.loading\">\n                            <div class=\"progress-bar progress-bar-striped active\" role=\"progressbar\" aria-valuenow=\"45\" aria-valuemin=\"0\" aria-valuemax=\"100\" style=\"width: 90%\">\n                                <span translate=\"\">Loading music tracks...</span>\n                            </div>\n                        </div>\n    \n                        <div class=\"tabs-panel\"  ng-if=\"!data.loading\">\n                            <ul class=\"nav nav-tabs\">\n                                <li ng-class=\"{active: tab === data.tabs.selectedTab}\" ng-repeat=\"tab in ['stock', 'upload']\" ng-init=\"data.tabs.selectedTab = data.tabs.selectedTab || tab\">\n                                    <a href=\"\" ng-click=\"data.tabs.selectedTab = tab\">{{tab | ucfirst}}</a>\n                                </li>\n                            </ul>\n                            <div class=\"tab-content\">\n                                <div class=\"tab-pane fade in active\" ng-if=\"data.tabs.selectedTab === 'stock'\">\n                                    <div class=\"row\" style=\"margin-bottom: 5px;\">\n                                        <div class=\"col-sm-8\">\n                                            <div class=\"btn-group\">\n                                                <button type=\"button\" class=\"btn btn-default btn-flat btn-sm\">{{data.selectedCategory | ucfirst}} <span translate=\"\">tracks</span></button>\n                                                <button type=\"button\" class=\"btn btn-default btn-flat btn-sm dropdown-toggle\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"false\">\n                                                    <span class=\"caret\"></span>\n                                                </button>\n                                                <ul class=\"dropdown-menu\">\n                                                    <li ng-repeat=\"(category, tracks) in data.categories\"><a href=\"\" ng-click=\"data.selectedCategory = category\">{{category | ucfirst}}</a></li>\n                                                </ul>\n                                            </div>\n                                        </div>\n                                        <div class=\"col-sm-4\"><input type=\"search\" class=\"form-control input-sm\" ng-model=\"data.filter\" title=\"search\" placeholder=\"Search music..\" /></div>\n                                    </div>\n    \n                                    <div class=\"pre-scrollable\">\n                                        <div class=\"list-group-item list-group-item-bar {{track.url === data.selectedTrack.url && 'list-group-item-bar-success' || 'list-group-item-bar-default'}}\"\n                                             ng-repeat=\"track in data.categories[data.selectedCategory] | filter:data.filter\" ng-click=\"data.selectedTrack = data.selectedTrack !== track && track || null\">\n                                            <div class=\"pull-left\">\n                                                <h4 class=\"list-group-item-heading\">\n                                                    <span ng-click=\"$event.stopImmediatePropagation();\" ng-switch=\"track == data.previewTrack\">\n                                                        <span audio-player sound=\"{{data.previewTrack.url}}\" autoplay=\"true\" ng-switch-when=\"true\" skin=\"round\"></span>\n                                                        <a ng-click=\"data.previewTrack = track\" ng-switch-default=\"\" tooltip=\"preview\" tooltip-position=\"right\"><i class=\"fa fa-play-circle-o\"></i></a>\n                                                    </span>\n                                                    {{track.name}}\n                                                </h4>\n                                                <!--<p class=\"list-group-item-text hidden-xs text-sm\">Category: {{track.category | ucfirst}}</p>-->\n                                            </div>\n    \n                                            <div class=\"pull-right hidden-xs\">\n                                                <i class=\"fa fa-fw {{track.url === data.selectedTrack.url && 'fa-check-circle' || ''}}\"></i>\n                                            </div>\n    \n                                            <div class=\"clearfix\"></div>\n                                        </div>\n    \n                                    </div>\n                                </div>\n                                <div class=\"tab-pane fade in active\" ng-if=\"data.tabs.selectedTab === 'upload'\">\n                                    <p class=\"help-block\"><span translate=\"\">You can also upload your own MP3 files!</span></p>\n                                    <minute-uploader ng-model=\"data.selectedTrack.url\" on-upload=\"setName\" type=\"audio\" remove=\"true\" label=\"Upload MP3..\"></minute-uploader>\n                                </div>\n                            </div>\n                        </div>\n                    </form>\n                </div>\n    \n                <div class=\"box-footer with-border\">\n                    <div class=\"row\">\n                        <div class=\"col-sm-8\">\n                            <div ng-show=\"!!data.selectedTrack.url\">\n                                <span audio-player sound=\"{{data.selectedTrack.url}}\" skin=\"simple\" btn-class=\"btn-xs btn-info\"></span> {{data.selectedTrack.name}}\n                            </div>\n                        </div>\n                        <div class=\"col-sm-4\">\n                            <button type=\"button\" class=\"btn btn-flat btn-primary pull-right\" ng-disabled=\"!data.selectedTrack.url\" ng-click=\"resolve(data.selectedTrack); hide();\">\n                                <i class=\"fa fa-check-circle\"></i> <span translate>Select song</span>\n                            </button>\n                        </div>\n                    </div>\n                </div>\n            </div>\n            ";
                var sortByCategory = function (type, items) {
                    var cats = categories[type] = categories[type] || {};
                    if (!cats.hasOwnProperty('all') || !cats['all'].length) {
                        angular.forEach(items, function (item) {
                            angular.forEach(item.category ? [item.category, 'all'] : ['all'], function (category) {
                                cats[category] = cats[category] || [];
                                cats[category].push(item);
                            });
                        });
                    }
                    return cats;
                };
                service.popup = function (type, value) {
                    var deferred = $q.defer();
                    var obj = angular.isObject(value) ? value : { url: value };
                    var data = { tabs: {}, selectedCategory: 'all', selectedTrack: obj, categories: {}, loading: true };
                    var resolve = function (selected) { return deferred.resolve(selected); };
                    var setName = function (url) { return data.selectedTrack.name = Minute.Utils.basename(url); };
                    $ui.popup(template, false, null, { ctrl: _this, resolve: resolve, setName: setName, data: data });
                    service.getTracksByCategory('', type).then(function (results) {
                        angular.extend(data, { categories: results, loading: false });
                    });
                    return deferred.promise;
                };
                service.loadResource = function (type) {
                    var deferred = $q.defer();
                    $http.get("/stock/resources/" + type).then(function (obj) { return deferred.resolve(obj.data); });
                    return deferred.promise;
                };
                service.getTracksByCategory = function (category, type) {
                    if (type === void 0) { type = 'music'; }
                    var deferred = $q.defer();
                    service.loadResource(type).then(function (results) {
                        var all = sortByCategory(type, results);
                        deferred.resolve(category ? all[category] : all);
                    });
                    return deferred.promise;
                };
                service.init = function () {
                    return service;
                };
                return service.init();
            };
            this.$get.$inject = ['$rootScope', '$q', '$http', '$audio', '$ui'];
        }
        return AngularMusic;
    }());
    Minute.AngularMusic = AngularMusic;
    angular.module('AngularMusic', ['MinuteFramework', 'angularAudio'])
        .provider("$music", AngularMusic);
})(Minute || (Minute = {}));
