/// <reference path="../../../minute/_all.d.ts" />

module Minute {
    export class AngularMusic implements ng.IServiceProvider {
        constructor() {
            this.$get.$inject = ['$rootScope', '$q', '$http', '$audio', '$ui'];
        }

        $get = ($rootScope: ng.IRootScopeService, $q: ng.IQService, $http: ng.IHttpService, $audio: any, $ui: any) => {
            let service: any = {};
            let categories = {};
            let template = `
            <div class="box box-md">
                <div class="box-body">
                    <form>
                        <div class="pull-right"><a href="" class="close-button"><sup tooltip="remove"><i class="fa fa-times"></i></sup></a></div>
                        
                        <div class="progress" ng-if="!!data.loading">
                            <div class="progress-bar progress-bar-striped active" role="progressbar" aria-valuenow="45" aria-valuemin="0" aria-valuemax="100" style="width: 90%">
                                <span translate="">Loading music tracks...</span>
                            </div>
                        </div>
    
                        <div class="tabs-panel"  ng-if="!data.loading">
                            <ul class="nav nav-tabs">
                                <li ng-class="{active: tab === data.tabs.selectedTab}" ng-repeat="tab in ['stock', 'upload']" ng-init="data.tabs.selectedTab = data.tabs.selectedTab || tab">
                                    <a href="" ng-click="data.tabs.selectedTab = tab">{{tab | ucfirst}}</a>
                                </li>
                            </ul>
                            <div class="tab-content">
                                <div class="tab-pane fade in active" ng-if="data.tabs.selectedTab === 'stock'">
                                    <div class="row" style="margin-bottom: 5px;">
                                        <div class="col-sm-8">
                                            <div class="btn-group">
                                                <button type="button" class="btn btn-default btn-flat btn-sm">{{data.selectedCategory | ucfirst}} <span translate="">tracks</span></button>
                                                <button type="button" class="btn btn-default btn-flat btn-sm dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                                    <span class="caret"></span>
                                                </button>
                                                <ul class="dropdown-menu">
                                                    <li ng-repeat="(category, tracks) in data.categories"><a href="" ng-click="data.selectedCategory = category">{{category | ucfirst}}</a></li>
                                                </ul>
                                            </div>
                                        </div>
                                        <div class="col-sm-4"><input type="search" class="form-control input-sm" ng-model="data.filter" title="search" placeholder="Search music.." /></div>
                                    </div>
    
                                    <div class="pre-scrollable">
                                        <div class="list-group-item list-group-item-bar {{track.url === data.selectedTrack.url && 'list-group-item-bar-success' || 'list-group-item-bar-default'}}"
                                             ng-repeat="track in data.categories[data.selectedCategory] | filter:data.filter" ng-click="data.selectedTrack = data.selectedTrack !== track && track || null">
                                            <div class="pull-left">
                                                <h4 class="list-group-item-heading">
                                                    <span ng-click="$event.stopImmediatePropagation();" ng-switch="track == data.previewTrack">
                                                        <span audio-player sound="{{data.previewTrack.url}}" autoplay="true" ng-switch-when="true" skin="round"></span>
                                                        <a ng-click="data.previewTrack = track" ng-switch-default="" tooltip="preview" tooltip-position="right"><i class="fa fa-play-circle-o"></i></a>
                                                    </span>
                                                    {{track.name}}
                                                </h4>
                                                <!--<p class="list-group-item-text hidden-xs text-sm">Category: {{track.category | ucfirst}}</p>-->
                                            </div>
    
                                            <div class="pull-right hidden-xs">
                                                <i class="fa fa-fw {{track.url === data.selectedTrack.url && 'fa-check-circle' || ''}}"></i>
                                            </div>
    
                                            <div class="clearfix"></div>
                                        </div>
    
                                    </div>
                                </div>
                                <div class="tab-pane fade in active" ng-if="data.tabs.selectedTab === 'upload'">
                                    <p class="help-block"><span translate="">You can also upload your own MP3 files!</span></p>
                                    <minute-uploader ng-model="data.selectedTrack.url" on-upload="setName" type="audio" remove="true" label="Upload MP3.."></minute-uploader>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
    
                <div class="box-footer with-border">
                    <div class="row">
                        <div class="col-sm-8">
                            <div ng-show="!!data.selectedTrack.url">
                                <span audio-player sound="{{data.selectedTrack.url}}" skin="simple" btn-class="btn-xs btn-info"></span> {{data.selectedTrack.name}}
                            </div>
                        </div>
                        <div class="col-sm-4">
                            <button type="button" class="btn btn-flat btn-primary pull-right" ng-disabled="!data.selectedTrack.url" ng-click="resolve(data.selectedTrack); hide();">
                                <i class="fa fa-check-circle"></i> <span translate>Select song</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            `;

            let sortByCategory = (type, items) => {
                let cats = categories[type] = categories[type] || {};

                if (!cats.hasOwnProperty('all') || !cats['all'].length) {
                    angular.forEach(items, (item) => {
                        angular.forEach(item.category ? [item.category, 'all'] : ['all'], (category) => {
                            cats[category] = cats[category] || [];
                            cats[category].push(item);
                        });
                    });
                }

                return cats;
            };

            service.popup = (type, value: any) => {
                let deferred = $q.defer();
                let obj = angular.isObject(value) ? value : {url: value};

                let data = {tabs: {}, selectedCategory: 'all', selectedTrack: obj, categories: {}, loading: true};
                let resolve = (selected) => deferred.resolve(selected);
                let setName = (url) => data.selectedTrack.name = Minute.Utils.basename(url);

                $ui.popup(template, false, null, {ctrl: this, resolve: resolve, setName: setName, data: data});

                service.getTracksByCategory('', type).then((results) => {
                    angular.extend(data, {categories: results, loading: false});
                });

                return deferred.promise;
            };

            service.loadResource = (type) => {
                let deferred = $q.defer();
                $http.get("/stock/resources/" + type).then((obj: any) => deferred.resolve(obj.data));
                return deferred.promise;
            };

            service.getTracksByCategory = (category, type = 'music') => {
                let deferred = $q.defer();

                service.loadResource(type).then((results) => {
                    let all = sortByCategory(type, results);
                    deferred.resolve(category ? all[category] : all);
                });

                return deferred.promise;
            };

            service.init = () => {
                return service;
            };

            return service.init();
        }
    }

    angular.module('AngularMusic', ['MinuteFramework', 'angularAudio'])
        .provider("$music", AngularMusic);
}